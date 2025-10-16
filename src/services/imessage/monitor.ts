import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { EventEmitter } from 'events';

export interface iMessage {
  id: number;
  guid: string;
  text: string | null;
  handle: string;
  handleId: number;
  date: Date;
  isFromMe: boolean;
  service: string;
  chatId?: number;
  chatGuid?: string;
}

export interface AllowedContact {
  identifier: string; // phone number or email
  name?: string;
  enabled: boolean;
}

export class iMessageMonitor extends EventEmitter {
  private db: sqlite3.Database | null = null;
  private dbPath: string;
  private pollInterval: NodeJS.Timeout | null = null;
  private lastMessageId: number = 0;
  private allowedContacts: AllowedContact[] = [];
  private configPath: string;

  constructor() {
    super();
    this.dbPath = path.join(os.homedir(), 'Library', 'Messages', 'chat.db');
    this.configPath = path.join(process.cwd(), '.data', 'imessage-config.json');
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
        this.allowedContacts = config.allowedContacts || [];
        this.lastMessageId = config.lastMessageId || 0;
      } else {
        this.saveConfig();
      }
    } catch (error) {
      console.error('Error loading iMessage config:', error);
      this.allowedContacts = [];
    }
  }

  private saveConfig(): void {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.configPath,
        JSON.stringify({
          allowedContacts: this.allowedContacts,
          lastMessageId: this.lastMessageId,
        }, null, 2)
      );
    } catch (error) {
      console.error('Error saving iMessage config:', error);
    }
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          reject(new Error(`Failed to connect to iMessage database: ${err.message}`));
        } else {
          console.log('✅ Connected to iMessage database');
          resolve();
        }
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db!.close((err) => {
          if (err) reject(err);
          else {
            this.db = null;
            console.log('Disconnected from iMessage database');
            resolve();
          }
        });
      });
    }
  }

  addAllowedContact(identifier: string, name?: string): void {
    // Normalize phone numbers
    const normalized = this.normalizeIdentifier(identifier);

    const existing = this.allowedContacts.find(c =>
      this.normalizeIdentifier(c.identifier) === normalized
    );

    if (existing) {
      existing.enabled = true;
      if (name) existing.name = name;
    } else {
      this.allowedContacts.push({
        identifier: normalized,
        name,
        enabled: true,
      });
    }

    this.saveConfig();
    console.log(`✅ Added allowed contact: ${name || identifier}`);
  }

  removeAllowedContact(identifier: string): void {
    const normalized = this.normalizeIdentifier(identifier);
    this.allowedContacts = this.allowedContacts.filter(c =>
      this.normalizeIdentifier(c.identifier) !== normalized
    );
    this.saveConfig();
    console.log(`Removed contact: ${identifier}`);
  }

  getAllowedContacts(): AllowedContact[] {
    return [...this.allowedContacts];
  }

  private normalizeIdentifier(identifier: string): string {
    // Remove spaces, dashes, parentheses from phone numbers
    // Keep + for country code
    return identifier.replace(/[\s\-\(\)]/g, '').toLowerCase();
  }

  private isAllowedContact(handle: string): boolean {
    if (this.allowedContacts.length === 0) return false;

    const normalized = this.normalizeIdentifier(handle);

    return this.allowedContacts.some(contact => {
      if (!contact.enabled) return false;
      const contactNormalized = this.normalizeIdentifier(contact.identifier);

      // Check exact match or if one contains the other (for partial matches)
      return normalized === contactNormalized ||
             normalized.includes(contactNormalized) ||
             contactNormalized.includes(normalized);
    });
  }

  async getRecentMessages(limit: number = 50): Promise<iMessage[]> {
    if (!this.db) throw new Error('Database not connected');

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

    return new Promise((resolve, reject) => {
      this.db!.all(query, [limit], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const messages = rows.map(row => this.parseMessage(row));
          resolve(messages);
        }
      });
    });
  }

  async startMonitoring(intervalMs: number = 2000): Promise<void> {
    if (!this.db) {
      await this.connect();
    }

    // Get the latest message ID to start from
    const latestMessages = await this.getRecentMessages(1);
    if (latestMessages.length > 0 && this.lastMessageId === 0) {
      this.lastMessageId = latestMessages[0].id;
      this.saveConfig();
    }

    console.log(`🔍 Starting iMessage monitoring (checking every ${intervalMs}ms)...`);
    console.log(`📱 Monitoring ${this.allowedContacts.length} allowed contacts`);

    this.pollInterval = setInterval(() => {
      this.checkForNewMessages();
    }, intervalMs);

    // Check immediately
    this.checkForNewMessages();
  }

  private async checkForNewMessages(): Promise<void> {
    if (!this.db) return;

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
      WHERE m.ROWID > ? AND m.text IS NOT NULL
      ORDER BY m.date ASC
    `;

    this.db.all(query, [this.lastMessageId], (err, rows: any[]) => {
      if (err) {
        console.error('Error checking for new messages:', err);
        return;
      }

      if (rows && rows.length > 0) {
        const messages = rows.map(row => this.parseMessage(row));

        for (const message of messages) {
          // Update last message ID
          if (message.id > this.lastMessageId) {
            this.lastMessageId = message.id;
          }

          // Only emit messages from allowed contacts
          if (!message.isFromMe && this.isAllowedContact(message.handle)) {
            console.log(`📩 New message from ${message.handle}: ${message.text?.substring(0, 50)}...`);
            this.emit('message', message);
          }
        }

        if (this.lastMessageId > 0) {
          this.saveConfig();
        }
      }
    });
  }

  private parseMessage(row: any): iMessage {
    // macOS epoch starts at 2001-01-01, convert to Unix timestamp
    const macEpoch = 978307200; // Seconds between 1970 and 2001
    const timestamp = row.date / 1000000000 + macEpoch;

    return {
      id: row.id,
      guid: row.guid,
      text: row.text,
      handle: row.handle,
      handleId: row.handle_id,
      date: new Date(timestamp * 1000),
      isFromMe: row.isFromMe === 1,
      service: row.service || 'iMessage',
      chatId: row.chat_id,
      chatGuid: row.chat_guid,
    };
  }

  async getConversations(): Promise<any[]> {
    if (!this.db) throw new Error('Database not connected');

    const query = `
      SELECT
        c.ROWID as chatId,
        c.guid as chatGuid,
        c.chat_identifier,
        c.display_name,
        c.service_name,
        COUNT(m.ROWID) as message_count,
        MAX(m.date) as last_message_date,
        (
          SELECT m2.text
          FROM message m2
          JOIN chat_message_join cmj2 ON m2.ROWID = cmj2.message_id
          WHERE cmj2.chat_id = c.ROWID
          ORDER BY m2.date DESC
          LIMIT 1
        ) as last_message_text,
        (
          SELECT m2.is_from_me
          FROM message m2
          JOIN chat_message_join cmj2 ON m2.ROWID = cmj2.message_id
          WHERE cmj2.chat_id = c.ROWID
          ORDER BY m2.date DESC
          LIMIT 1
        ) as last_message_is_from_me
      FROM chat c
      LEFT JOIN chat_message_join cmj ON c.ROWID = cmj.chat_id
      LEFT JOIN message m ON cmj.message_id = m.ROWID
      GROUP BY c.ROWID
      HAVING message_count > 0
      ORDER BY last_message_date DESC
    `;

    return new Promise((resolve, reject) => {
      this.db!.all(query, [], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const macEpoch = 978307200;
          const conversations = rows.map(row => ({
            chatId: row.chatId,
            chatGuid: row.chatGuid,
            identifier: row.chat_identifier,
            displayName: row.display_name,
            serviceName: row.service_name || 'iMessage',
            messageCount: row.message_count,
            lastMessageDate: row.last_message_date
              ? new Date((row.last_message_date / 1000000000 + macEpoch) * 1000)
              : null,
            lastMessageText: row.last_message_text,
            lastMessageIsFromMe: row.last_message_is_from_me === 1,
          }));
          resolve(conversations);
        }
      });
    });
  }

  async getMessagesForChat(chatId: number, limit: number = 100): Promise<iMessage[]> {
    if (!this.db) throw new Error('Database not connected');

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
      JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
      JOIN chat c ON cmj.chat_id = c.ROWID
      WHERE c.ROWID = ?
      ORDER BY m.date DESC
      LIMIT ?
    `;

    return new Promise((resolve, reject) => {
      this.db!.all(query, [chatId, limit], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const messages = rows.map(row => this.parseMessage(row)).reverse();
          resolve(messages);
        }
      });
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.db) await this.connect();
      const messages = await this.getRecentMessages(1);
      console.log('✅ iMessage database test successful');
      console.log(`📊 Found ${messages.length > 0 ? 'messages' : 'no messages'}`);
      if (messages.length > 0) {
        console.log(`   Latest message from: ${messages[0].handle}`);
      }
      return true;
    } catch (error) {
      console.error('❌ iMessage database test failed:', error);
      return false;
    }
  }
}
