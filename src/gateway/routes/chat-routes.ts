/**
 * Chat API Routes
 * Endpoints for conversational music production
 */

import { Router, Request, Response } from 'express';
import { IntentService } from '../services/intent-service';
import { chatService } from '../services/chat-service';
import { providerService } from '../services/provider-service';
import { z } from 'zod';

const router = Router();
const intentService = new IntentService();

// ====================================
// VALIDATION SCHEMAS
// ====================================

const SendMessageSchema = z.object({
  conversationId: z.string().optional(),
  userId: z.string(),
  message: z.string().min(1).max(2000),
  projectId: z.string().optional(),
});

const GetConversationsSchema = z.object({
  userId: z.string(),
  projectId: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

// ====================================
// POST /api/chat/message
// Send a message and get streaming response
// ====================================

router.post('/message', async (req: Request, res: Response) => {
  try {
    const { conversationId, userId, message, projectId } = SendMessageSchema.parse(req.body);

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await chatService.getConversation(conversationId);
    } else {
      conversation = await chatService.createConversation({ userId, projectId });
    }

    // Detect intent from user message
    const intentResult = intentService.detectIntent(message);

    console.log('Intent detected:', {
      intent: intentResult.intent,
      entities: intentResult.entities,
      confidence: intentResult.confidence,
    });

    // Save user message
    await chatService.addMessage({
      conversationId: conversation.id,
      role: 'user',
      content: message,
      intent: intentResult.intent,
      entities: intentResult.entities,
    });

    // Get conversation context for AI
    const context = await chatService.getConversationContext(conversation.id, 10);

    // Check if streaming is requested
    const useStreaming = req.headers['accept']?.includes('text/event-stream');

    if (useStreaming) {
      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullResponse = '';

      try {
        // Stream response from AI provider
        for await (const chunk of providerService.streamChatResponse(
          message,
          context,
          intentResult.intent
        )) {
          if (!chunk.done) {
            fullResponse += chunk.content;
            // Send SSE event
            res.write(`data: ${JSON.stringify({ chunk: chunk.content, done: false })}\n\n`);
          }
        }

        // Save assistant message
        const updatedConversation = await chatService.addMessage({
          conversationId: conversation.id,
          role: 'assistant',
          content: fullResponse,
        });

        // Send final event
        res.write(
          `data: ${JSON.stringify({
            done: true,
            conversationId: conversation.id,
            intent: intentResult.intent,
            entities: intentResult.entities,
            followUpQuestion: intentResult.followUpQuestion,
          })}\n\n`
        );

        res.end();
      } catch (error) {
        console.error('Streaming error:', error);
        res.write(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`);
        res.end();
      }
    } else {
      // Non-streaming response
      const aiResponse = await providerService.generateChatResponse(
        message,
        context,
        intentResult.intent
      );

      // Save assistant message
      const updatedConversation = await chatService.addMessage({
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse.content,
      });

      res.json({
        conversationId: conversation.id,
        message: aiResponse.content,
        intent: intentResult.intent,
        entities: intentResult.entities,
        followUpQuestion: intentResult.followUpQuestion,
        provider: aiResponse.provider,
        tokensUsed: aiResponse.tokensUsed,
        cost: aiResponse.cost,
      });
    }
  } catch (error) {
    console.error('Chat message error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }

    res.status(500).json({
      error: 'Failed to process message',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ====================================
// GET /api/chat/conversations
// List user's conversations
// ====================================

router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const { userId, projectId, limit, offset } = GetConversationsSchema.parse({
      userId: req.query.userId,
      projectId: req.query.projectId,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    });

    const result = await chatService.listConversations({
      userId,
      projectId,
      limit,
      offset,
    });

    res.json(result);
  } catch (error) {
    console.error('List conversations error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }

    res.status(500).json({
      error: 'Failed to list conversations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ====================================
// GET /api/chat/conversations/:id
// Get conversation details with messages
// ====================================

router.get('/conversations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const conversation = await chatService.getConversation(id);
    const stats = await chatService.getConversationStats(id);

    res.json({
      conversation,
      stats,
    });
  } catch (error) {
    console.error('Get conversation error:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Conversation not found',
      });
    }

    res.status(500).json({
      error: 'Failed to get conversation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ====================================
// DELETE /api/chat/conversations/:id
// Delete a conversation
// ====================================

router.delete('/conversations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await chatService.deleteConversation(id);

    res.json({
      success: true,
      message: 'Conversation deleted',
    });
  } catch (error) {
    console.error('Delete conversation error:', error);

    res.status(500).json({
      error: 'Failed to delete conversation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ====================================
// POST /api/chat/conversations/:id/regenerate
// Regenerate the last assistant response
// ====================================

router.post('/conversations/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const conversation = await chatService.getConversation(id);

    // Find last user message
    const messages = conversation.messages;
    const lastUserMessage = messages.reverse().find((msg) => msg.role === 'user');

    if (!lastUserMessage) {
      return res.status(400).json({
        error: 'No user message to regenerate from',
      });
    }

    // Get context (excluding the last assistant response)
    const context = await chatService.getConversationContext(id, 10);

    // Detect intent again
    const intentResult = intentService.detectIntent(lastUserMessage.content);

    // Generate new response
    const aiResponse = await providerService.generateChatResponse(
      lastUserMessage.content,
      context,
      intentResult.intent
    );

    // Save new assistant message
    await chatService.addMessage({
      conversationId: id,
      role: 'assistant',
      content: aiResponse.content,
    });

    res.json({
      message: aiResponse.content,
      intent: intentResult.intent,
      provider: aiResponse.provider,
      tokensUsed: aiResponse.tokensUsed,
    });
  } catch (error) {
    console.error('Regenerate error:', error);

    res.status(500).json({
      error: 'Failed to regenerate response',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ====================================
// GET /api/chat/search
// Search conversations by content
// ====================================

router.get('/search', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const query = req.query.q as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    if (!userId || !query) {
      return res.status(400).json({
        error: 'userId and q (query) are required',
      });
    }

    const results = await chatService.searchConversations(userId, query, limit);

    res.json({
      results,
      count: results.length,
    });
  } catch (error) {
    console.error('Search error:', error);

    res.status(500).json({
      error: 'Failed to search conversations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ====================================
// GET /api/chat/intent/test
// Test intent detection (development only)
// ====================================

router.post('/intent/test', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'message is required',
      });
    }

    const result = intentService.detectIntent(message);
    const stats = intentService.getPatternStats();

    res.json({
      message,
      result,
      stats,
    });
  } catch (error) {
    console.error('Intent test error:', error);

    res.status(500).json({
      error: 'Failed to test intent',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ====================================
// GET /api/chat/providers
// Get available AI providers status
// ====================================

router.get('/providers', async (req: Request, res: Response) => {
  try {
    const available = providerService.getAvailableProviders();
    const primary = providerService.getPrimaryProvider();

    res.json({
      available,
      primary,
      count: available.length,
    });
  } catch (error) {
    console.error('Providers status error:', error);

    res.status(500).json({
      error: 'Failed to get providers status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
