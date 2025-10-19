import axios from 'axios';
import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

/**
 * Multi-channel notification dispatcher
 *
 * Supports:
 * - Slack webhooks
 * - Discord webhooks
 * - Email (via nodemailer)
 * - Browser notifications (via dashboard)
 * - SMS (optional via Twilio)
 */

interface NotificationSettings {
  slack?: {
    enabled: boolean;
    webhookUrl: string;
    channel?: string;
    mentions?: string[];
  };
  discord?: {
    enabled: boolean;
    webhookUrl: string;
    mentions?: string[];
  };
  email?: {
    enabled: boolean;
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
    from: string;
    to: string[];
  };
  sms?: {
    enabled: boolean;
    twilioAccountSid: string;
    twilioAuthToken: string;
    twilioPhoneNumber: string;
    recipients: string[];
  };
  browser?: {
    enabled: boolean;
  };
  alertThresholds: {
    criticalFailures: boolean;
    passRateDrop: number; // Percentage drop to trigger alert
    consecutiveFailures: number;
  };
}

export class Notifier {
  private settings: NotificationSettings;
  private settingsPath: string;
  private emailTransporter: any;

  constructor() {
    this.settingsPath = path.join(__dirname, 'notification-settings.json');
    this.loadSettings();
  }

  private async loadSettings(): Promise<void> {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf-8');
      this.settings = JSON.parse(data);
    } catch (error) {
      // Use default settings
      this.settings = {
        slack: {
          enabled: false,
          webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
        },
        discord: {
          enabled: false,
          webhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
        },
        email: {
          enabled: false,
          smtp: {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
              user: process.env.SMTP_USER || '',
              pass: process.env.SMTP_PASS || '',
            },
          },
          from: process.env.EMAIL_FROM || 'noreply@dawg-ai.com',
          to: (process.env.EMAIL_TO || '').split(',').filter(Boolean),
        },
        sms: {
          enabled: false,
          twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
          twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
          twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
          recipients: (process.env.SMS_RECIPIENTS || '').split(',').filter(Boolean),
        },
        browser: {
          enabled: true,
        },
        alertThresholds: {
          criticalFailures: true,
          passRateDrop: 10,
          consecutiveFailures: 3,
        },
      };

      await this.saveSettings();
    }

    // Initialize email transporter if enabled
    if (this.settings.email?.enabled) {
      this.emailTransporter = nodemailer.createTransporter(this.settings.email.smtp);
    }
  }

  private async saveSettings(): Promise<void> {
    await fs.writeFile(this.settingsPath, JSON.stringify(this.settings, null, 2));
  }

  public async updateSettings(updates: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...updates };
    await this.saveSettings();

    // Reinitialize email transporter if settings changed
    if (updates.email && this.settings.email?.enabled) {
      this.emailTransporter = nodemailer.createTransporter(this.settings.email.smtp);
    }
  }

  /**
   * Send critical test failure alert
   */
  public async sendCriticalAlert(alert: {
    testName: string;
    error: string;
    timestamp: string;
  }): Promise<void> {
    if (!this.settings.alertThresholds.criticalFailures) {
      return;
    }

    const message = {
      title: '🚨 Critical Test Failure',
      body: `Test "${alert.testName}" failed with critical error`,
      details: [
        `**Test:** ${alert.testName}`,
        `**Error:** ${alert.error}`,
        `**Time:** ${new Date(alert.timestamp).toLocaleString()}`,
      ],
      color: '#ef4444',
      priority: 'high' as const,
    };

    await this.sendNotification(message);
  }

  /**
   * Send pass rate drop alert
   */
  public async sendPassRateAlert(alert: {
    currentRate: number;
    previousRate: number;
    change: number;
  }): Promise<void> {
    if (Math.abs(alert.change) < this.settings.alertThresholds.passRateDrop) {
      return;
    }

    const message = {
      title: '📉 Pass Rate Drop Detected',
      body: `Test pass rate dropped by ${Math.abs(alert.change).toFixed(1)}%`,
      details: [
        `**Current:** ${alert.currentRate.toFixed(1)}%`,
        `**Previous:** ${alert.previousRate.toFixed(1)}%`,
        `**Change:** ${alert.change.toFixed(1)}%`,
      ],
      color: '#f59e0b',
      priority: 'medium' as const,
    };

    await this.sendNotification(message);
  }

  /**
   * Send test completion summary
   */
  public async sendTestCompletionNotification(result: {
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
    timestamp: string;
  }): Promise<void> {
    const passRate = ((result.passed / result.totalTests) * 100).toFixed(1);
    const icon = result.failed === 0 ? '✅' : '⚠️';

    const message = {
      title: `${icon} Test Run Completed`,
      body: `${result.totalTests} tests completed with ${passRate}% pass rate`,
      details: [
        `**Passed:** ${result.passed}`,
        `**Failed:** ${result.failed}`,
        `**Skipped:** ${result.skipped}`,
        `**Duration:** ${(result.duration / 1000).toFixed(1)}s`,
      ],
      color: result.failed === 0 ? '#10b981' : '#f59e0b',
      priority: result.failed > 0 ? ('medium' as const) : ('low' as const),
    };

    await this.sendNotification(message);
  }

  /**
   * Send notification to all enabled channels
   */
  private async sendNotification(message: {
    title: string;
    body: string;
    details: string[];
    color: string;
    priority: 'low' | 'medium' | 'high';
  }): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.settings.slack?.enabled) {
      promises.push(this.sendSlackNotification(message));
    }

    if (this.settings.discord?.enabled) {
      promises.push(this.sendDiscordNotification(message));
    }

    if (this.settings.email?.enabled) {
      promises.push(this.sendEmailNotification(message));
    }

    if (this.settings.sms?.enabled && message.priority === 'high') {
      promises.push(this.sendSMSNotification(message));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(message: {
    title: string;
    body: string;
    details: string[];
    color: string;
  }): Promise<void> {
    if (!this.settings.slack?.webhookUrl) {
      console.warn('Slack webhook URL not configured');
      return;
    }

    try {
      const payload = {
        attachments: [
          {
            color: message.color,
            title: message.title,
            text: message.body,
            fields: message.details.map(detail => {
              const [name, value] = detail.split('**').filter(Boolean)[0].split(':');
              return {
                title: name.trim(),
                value: value?.trim() || '',
                short: true,
              };
            }),
            footer: 'DAWG AI Testing Agent',
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      };

      if (this.settings.slack.mentions && this.settings.slack.mentions.length > 0) {
        payload.attachments[0].text = `${this.settings.slack.mentions.map(m => `<@${m}>`).join(' ')} ${message.body}`;
      }

      await axios.post(this.settings.slack.webhookUrl, payload);
      console.log('✅ Slack notification sent');
    } catch (error) {
      console.error('❌ Failed to send Slack notification:', error.message);
    }
  }

  /**
   * Send Discord notification
   */
  private async sendDiscordNotification(message: {
    title: string;
    body: string;
    details: string[];
    color: string;
  }): Promise<void> {
    if (!this.settings.discord?.webhookUrl) {
      console.warn('Discord webhook URL not configured');
      return;
    }

    try {
      const colorInt = parseInt(message.color.replace('#', ''), 16);

      const payload = {
        embeds: [
          {
            title: message.title,
            description: message.body,
            color: colorInt,
            fields: message.details.map(detail => {
              const [name, value] = detail.split('**').filter(Boolean)[0].split(':');
              return {
                name: name.trim(),
                value: value?.trim() || '',
                inline: true,
              };
            }),
            footer: {
              text: 'DAWG AI Testing Agent',
            },
            timestamp: new Date().toISOString(),
          },
        ],
      };

      if (this.settings.discord.mentions && this.settings.discord.mentions.length > 0) {
        payload.embeds[0].description = `${this.settings.discord.mentions.map(m => `<@${m}>`).join(' ')} ${message.body}`;
      }

      await axios.post(this.settings.discord.webhookUrl, payload);
      console.log('✅ Discord notification sent');
    } catch (error) {
      console.error('❌ Failed to send Discord notification:', error.message);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(message: {
    title: string;
    body: string;
    details: string[];
  }): Promise<void> {
    if (!this.emailTransporter || !this.settings.email?.to?.length) {
      console.warn('Email not configured');
      return;
    }

    try {
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${message.title}</h2>
          <p style="font-size: 16px; color: #666;">${message.body}</p>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${message.details.map(detail => `
              <div style="margin: 10px 0;">
                ${detail.replace(/\*\*/g, '')}
              </div>
            `).join('')}
          </div>

          <p style="color: #999; font-size: 12px;">
            Sent by DAWG AI Testing Agent at ${new Date().toLocaleString()}
          </p>
        </div>
      `;

      await this.emailTransporter.sendMail({
        from: this.settings.email.from,
        to: this.settings.email.to.join(','),
        subject: message.title,
        html: htmlBody,
      });

      console.log('✅ Email notification sent');
    } catch (error) {
      console.error('❌ Failed to send email notification:', error.message);
    }
  }

  /**
   * Send SMS notification (Twilio)
   */
  private async sendSMSNotification(message: {
    title: string;
    body: string;
  }): Promise<void> {
    if (!this.settings.sms?.twilioAccountSid || !this.settings.sms?.recipients?.length) {
      console.warn('SMS not configured');
      return;
    }

    try {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.settings.sms.twilioAccountSid}/Messages.json`;
      const auth = Buffer.from(
        `${this.settings.sms.twilioAccountSid}:${this.settings.sms.twilioAuthToken}`
      ).toString('base64');

      const smsText = `${message.title}\n${message.body}`;

      for (const recipient of this.settings.sms.recipients) {
        await axios.post(
          twilioUrl,
          new URLSearchParams({
            From: this.settings.sms.twilioPhoneNumber,
            To: recipient,
            Body: smsText,
          }),
          {
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );
      }

      console.log('✅ SMS notification sent');
    } catch (error) {
      console.error('❌ Failed to send SMS notification:', error.message);
    }
  }

  /**
   * Send test notification for a specific channel
   */
  public async sendTestNotification(channel: string): Promise<void> {
    const message = {
      title: '🔔 Test Notification',
      body: 'This is a test notification from the DAWG AI Testing Dashboard',
      details: [
        `**Channel:** ${channel}`,
        `**Time:** ${new Date().toLocaleString()}`,
      ],
      color: '#6366f1',
      priority: 'low' as const,
    };

    switch (channel) {
      case 'slack':
        await this.sendSlackNotification(message);
        break;
      case 'discord':
        await this.sendDiscordNotification(message);
        break;
      case 'email':
        await this.sendEmailNotification(message);
        break;
      case 'sms':
        await this.sendSMSNotification(message);
        break;
      case 'browser':
        // Browser notifications are handled on the client side
        console.log('Browser notification test (handled by client)');
        break;
      default:
        console.warn(`Unknown notification channel: ${channel}`);
    }
  }
}
