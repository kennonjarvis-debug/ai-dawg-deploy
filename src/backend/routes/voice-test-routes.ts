/**
 * Voice Test Commander Routes
 *
 * WebSocket and HTTP endpoints for voice-controlled test execution.
 */

import { Router } from 'express';
import { Server as WebSocketServer } from 'ws';
import { voiceTestCommander } from '../services/voice-test-commander';
import { authService } from '../services/auth-service';
import adminPermissions from '../../config/admin-permissions.json';

const router = Router();

// ============================================================================
// HTTP Routes
// ============================================================================

/**
 * GET /api/voice-test/permissions
 * Check if user has voice test permissions
 */
router.get('/permissions', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const user = await authService.verifySession(token);

    // Check if user is admin
    const isAdmin = adminPermissions.adminUsers.users.some(
      (admin) => admin.userId === user.id || admin.email === user.email
    );

    res.json({
      hasAccess: isAdmin,
      role: isAdmin ? 'admin' : 'viewer',
      features: isAdmin
        ? adminPermissions.roles.admin.features
        : adminPermissions.roles.viewer.features,
    });
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

/**
 * GET /api/voice-test/audit-log
 * Get audit log (admin only)
 */
router.get('/audit-log', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const user = await authService.verifySession(token);

    // Verify admin
    const isAdmin = adminPermissions.adminUsers.users.some(
      (admin) => admin.userId === user.id || admin.email === user.email
    );

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const userId = req.query.userId as string | undefined;
    const auditLog = voiceTestCommander.getAuditLog(userId);

    res.json({ auditLog });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve audit log' });
  }
});

/**
 * POST /api/voice-test/process
 * Process voice command via HTTP (alternative to WebSocket)
 */
router.post('/process', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const user = await authService.verifySession(token);

    // Verify admin
    const isAdmin = adminPermissions.adminUsers.users.some(
      (admin) => admin.userId === user.id || admin.email === user.email
    );

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { audioBase64 } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data required' });
    }

    const audioBuffer = Buffer.from(audioBase64, 'base64');

    const result = await voiceTestCommander.processVoiceCommand(
      audioBuffer,
      user.id,
      isAdmin
    );

    res.json({
      text: result.text,
      audioBase64: result.audio.toString('base64'),
      result: result.result,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// WebSocket Setup
// ============================================================================

export function setupVoiceTestWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws, req) => {
    console.log('Voice Test Commander WebSocket connection established');

    let userId: string | null = null;
    let isAdmin = false;
    let isAuthenticated = false;

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'auth':
            // Authenticate user
            userId = message.userId;
            isAdmin = message.isAdmin;

            // Verify admin status
            const adminUser = adminPermissions.adminUsers.users.find(
              (admin) => admin.userId === userId
            );

            if (adminUser) {
              isAuthenticated = true;
              ws.send(
                JSON.stringify({
                  type: 'auth-success',
                  message: 'Authenticated successfully',
                })
              );
            } else {
              ws.send(
                JSON.stringify({
                  type: 'auth-failed',
                  message: 'Admin privileges required',
                })
              );
              ws.close();
            }
            break;

          case 'process-voice-command':
            if (!isAuthenticated || !userId) {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Not authenticated',
                })
              );
              return;
            }

            const audioBuffer = Buffer.from(message.audioBase64, 'base64');

            // Listen for events
            const transcriptionHandler = (event: any) => {
              if (event.userId === userId) {
                ws.send(
                  JSON.stringify({
                    type: 'transcription',
                    text: event.text,
                    timestamp: new Date().toISOString(),
                  })
                );
              }
            };

            const intentHandler = (event: any) => {
              if (event.userId === userId) {
                ws.send(
                  JSON.stringify({
                    type: 'intent-detected',
                    intent: event.intent,
                  })
                );
              }
            };

            const executionHandler = (event: any) => {
              if (event.userId === userId) {
                ws.send(
                  JSON.stringify({
                    type: 'execution-complete',
                    result: event.result,
                  })
                );
              }
            };

            voiceTestCommander.once('transcription', transcriptionHandler);
            voiceTestCommander.once('intent-detected', intentHandler);
            voiceTestCommander.once('execution-complete', executionHandler);

            try {
              const result = await voiceTestCommander.processVoiceCommand(
                audioBuffer,
                userId,
                isAdmin
              );

              // Send response audio
              ws.send(
                JSON.stringify({
                  type: 'response-audio',
                  audioBase64: result.audio.toString('base64'),
                  text: result.text,
                })
              );
            } catch (error: any) {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  message: error.message,
                })
              );
            }
            break;

          case 'confirm-operation':
            if (!isAuthenticated || !userId) {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Not authenticated',
                })
              );
              return;
            }

            const confirmed = await voiceTestCommander.confirmOperation(userId);

            ws.send(
              JSON.stringify({
                type: 'confirmation-result',
                confirmed,
              })
            );
            break;

          default:
            ws.send(
              JSON.stringify({
                type: 'error',
                message: 'Unknown message type',
              })
            );
        }
      } catch (error: any) {
        ws.send(
          JSON.stringify({
            type: 'error',
            message: error.message,
          })
        );
      }
    });

    ws.on('close', () => {
      console.log('Voice Test Commander WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('Voice Test Commander WebSocket error:', error);
    });
  });
}

export default router;
