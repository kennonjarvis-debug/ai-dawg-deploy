import { Router, Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import * as path from 'path';
import * as os from 'os';

const router = Router();

// Helper to get iMessage database connection
function getDb(): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(os.homedir(), 'Library', 'Messages', 'chat.db');
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        reject(new Error(`Failed to connect to iMessage database: ${err.message}`));
      } else {
        resolve(db);
      }
    });
  });
}

// Helper to parse macOS date format
function parseMacDate(macDate: number): Date {
  // macOS epoch starts at 2001-01-01, convert to Unix timestamp
  const macEpoch = 978307200; // Seconds between 1970 and 2001
  const timestamp = macDate / 1000000000 + macEpoch;
  return new Date(timestamp * 1000);
}

// GET /api/v1/imessage/conversations - Get all conversations
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const db = await getDb();

    const query = `
      SELECT
        c.ROWID as chatId,
        c.guid as chatGuid,
        c.chat_identifier as identifier,
        c.display_name as displayName,
        c.service_name as serviceName,
        COUNT(DISTINCT m.ROWID) as messageCount,
        MAX(m.date) as lastMessageDate,
        (SELECT text FROM message WHERE ROWID = (
          SELECT message_id FROM chat_message_join
          WHERE chat_id = c.ROWID
          ORDER BY message_date DESC
          LIMIT 1
        )) as lastMessageText,
        (SELECT is_from_me FROM message WHERE ROWID = (
          SELECT message_id FROM chat_message_join
          WHERE chat_id = c.ROWID
          ORDER BY message_date DESC
          LIMIT 1
        )) as lastMessageIsFromMe
      FROM chat c
      LEFT JOIN chat_message_join cmj ON c.ROWID = cmj.chat_id
      LEFT JOIN message m ON cmj.message_id = m.ROWID
      GROUP BY c.ROWID, c.guid, c.chat_identifier, c.display_name, c.service_name
      HAVING messageCount > 0
      ORDER BY lastMessageDate DESC
      LIMIT 100
    `;

    db.all(query, [], (err, rows: any[]) => {
      db.close();

      if (err) {
        console.error('Error fetching conversations:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch conversations',
        });
      }

      const conversations = rows.map(row => ({
        chatId: row.chatId,
        chatGuid: row.chatGuid,
        identifier: row.identifier,
        displayName: row.displayName,
        serviceName: row.serviceName || 'iMessage',
        messageCount: row.messageCount,
        lastMessageDate: row.lastMessageDate ? parseMacDate(row.lastMessageDate).toISOString() : null,
        lastMessageText: row.lastMessageText,
        lastMessageIsFromMe: row.lastMessageIsFromMe === 1,
      }));

      res.json({
        success: true,
        conversations,
        count: conversations.length,
      });
    });
  } catch (error: any) {
    console.error('Error in /conversations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch conversations',
    });
  }
});

// GET /api/v1/imessage/conversations/:chatId/messages - Get messages for a conversation
router.get('/conversations/:chatId/messages', async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const limit = parseInt(req.query.limit as string) || 200;

    const db = await getDb();

    const query = `
      SELECT
        m.ROWID as id,
        m.guid,
        m.text,
        m.is_from_me as isFromMe,
        m.service,
        m.date,
        h.id as handle_id,
        COALESCE(h.uncanonicalized_id, h.id) as handle,
        c.ROWID as chat_id,
        c.guid as chat_guid
      FROM message m
      LEFT JOIN handle h ON m.handle_id = h.ROWID
      LEFT JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
      LEFT JOIN chat c ON cmj.chat_id = c.ROWID
      WHERE c.ROWID = ? AND m.text IS NOT NULL
      ORDER BY m.date ASC
      LIMIT ?
    `;

    db.all(query, [chatId, limit], (err, rows: any[]) => {
      db.close();

      if (err) {
        console.error('Error fetching messages:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch messages',
        });
      }

      const messages = rows.map(row => ({
        id: row.id,
        guid: row.guid,
        text: row.text,
        handle: row.handle,
        handleId: row.handle_id,
        date: parseMacDate(row.date).toISOString(),
        isFromMe: row.isFromMe === 1,
        service: row.service || 'iMessage',
        chatId: row.chat_id,
        chatGuid: row.chat_guid,
      }));

      res.json({
        success: true,
        messages,
        count: messages.length,
        chatId: parseInt(chatId),
      });
    });
  } catch (error: any) {
    console.error('Error in /conversations/:chatId/messages:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch messages',
    });
  }
});

// GET /api/v1/imessage/recent - Get recent messages across all conversations
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const db = await getDb();

    const query = `
      SELECT
        m.ROWID as id,
        m.guid,
        m.text,
        m.is_from_me as isFromMe,
        m.service,
        m.date,
        h.id as handle_id,
        COALESCE(h.uncanonicalized_id, h.id) as handle,
        c.ROWID as chat_id,
        c.guid as chat_guid
      FROM message m
      LEFT JOIN handle h ON m.handle_id = h.ROWID
      LEFT JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
      LEFT JOIN chat c ON cmj.chat_id = c.ROWID
      WHERE m.text IS NOT NULL
      ORDER BY m.date DESC
      LIMIT ?
    `;

    db.all(query, [limit], (err, rows: any[]) => {
      db.close();

      if (err) {
        console.error('Error fetching recent messages:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch recent messages',
        });
      }

      const messages = rows.map(row => ({
        id: row.id,
        guid: row.guid,
        text: row.text,
        handle: row.handle,
        handleId: row.handle_id,
        date: parseMacDate(row.date).toISOString(),
        isFromMe: row.isFromMe === 1,
        service: row.service || 'iMessage',
        chatId: row.chat_id,
        chatGuid: row.chat_guid,
      }));

      res.json({
        success: true,
        messages,
        count: messages.length,
      });
    });
  } catch (error: any) {
    console.error('Error in /recent:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch recent messages',
    });
  }
});

// GET /api/v1/imessage/status - Get monitoring status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const db = await getDb();

    // Get total message count
    db.get('SELECT COUNT(*) as count FROM message WHERE text IS NOT NULL', [], (err, row: any) => {
      db.close();

      if (err) {
        return res.status(500).json({
          success: false,
          error: 'Failed to get status',
        });
      }

      res.json({
        success: true,
        status: 'connected',
        totalMessages: row.count,
        database: path.join(os.homedir(), 'Library', 'Messages', 'chat.db'),
      });
    });
  } catch (error: any) {
    console.error('Error in /status:', error);
    res.status(500).json({
      success: false,
      status: 'error',
      error: error.message || 'Failed to connect to iMessage database',
    });
  }
});

export default router;
