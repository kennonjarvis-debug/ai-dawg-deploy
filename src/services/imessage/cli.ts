#!/usr/bin/env tsx
import { iMessageMonitor } from './monitor';

const monitor = new iMessageMonitor();

const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  try {
    switch (command) {
      case 'test':
        console.log('🧪 Testing iMessage database access...\n');
        await monitor.testConnection();
        await monitor.disconnect();
        break;

      case 'allow':
        if (args.length === 0) {
          console.error('❌ Error: Please provide a phone number or email');
          console.log('Usage: npm run imessage allow "+1234567890" [name]');
          process.exit(1);
        }
        monitor.addAllowedContact(args[0], args[1]);
        console.log('\n📋 Current allowed contacts:');
        monitor.getAllowedContacts().forEach(c => {
          console.log(`   ${c.enabled ? '✅' : '❌'} ${c.name || c.identifier}`);
        });
        break;

      case 'remove':
        if (args.length === 0) {
          console.error('❌ Error: Please provide a phone number or email');
          console.log('Usage: npm run imessage remove "+1234567890"');
          process.exit(1);
        }
        monitor.removeAllowedContact(args[0]);
        console.log('\n📋 Current allowed contacts:');
        monitor.getAllowedContacts().forEach(c => {
          console.log(`   ${c.enabled ? '✅' : '❌'} ${c.name || c.identifier}`);
        });
        break;

      case 'list':
        const contacts = monitor.getAllowedContacts();
        console.log('\n📋 Allowed contacts:');
        if (contacts.length === 0) {
          console.log('   (none)');
        } else {
          contacts.forEach(c => {
            console.log(`   ${c.enabled ? '✅' : '❌'} ${c.name || c.identifier}`);
          });
        }
        console.log('');
        break;

      case 'recent':
        console.log('📱 Fetching recent messages...\n');
        await monitor.connect();
        const limit = parseInt(args[0]) || 10;
        const messages = await monitor.getRecentMessages(limit);
        messages.forEach(msg => {
          const time = msg.date.toLocaleString();
          const from = msg.isFromMe ? 'Me' : msg.handle;
          const text = msg.text?.substring(0, 80) || '(no text)';
          console.log(`[${time}] ${from}: ${text}`);
        });
        await monitor.disconnect();
        break;

      case 'start':
        console.log('🚀 Starting iMessage monitoring agent...\n');
        const contacts_list = monitor.getAllowedContacts();

        if (contacts_list.length === 0) {
          console.error('❌ Error: No allowed contacts configured');
          console.log('Add contacts with: npm run imessage allow "+1234567890"');
          process.exit(1);
        }

        console.log('📋 Monitoring contacts:');
        contacts_list.forEach(c => {
          if (c.enabled) {
            console.log(`   ✅ ${c.name || c.identifier}`);
          }
        });
        console.log('');

        await monitor.connect();
        await monitor.startMonitoring(2000);

        monitor.on('message', (msg) => {
          console.log(`\n📨 NEW MESSAGE`);
          console.log(`   From: ${msg.handle}`);
          console.log(`   Time: ${msg.date.toLocaleString()}`);
          console.log(`   Text: ${msg.text}`);
          console.log('');
        });

        // Keep the process running
        console.log('✅ Agent running. Press Ctrl+C to stop.\n');

        // Handle shutdown gracefully
        process.on('SIGINT', async () => {
          console.log('\n\n🛑 Stopping iMessage monitor...');
          await monitor.disconnect();
          process.exit(0);
        });

        break;

      case 'help':
      default:
        console.log(`
📱 iMessage Monitor CLI

Usage: npm run imessage <command> [args]

Commands:
  test                      Test database access
  allow <contact> [name]    Add allowed contact (phone or email)
  remove <contact>          Remove allowed contact
  list                      List all allowed contacts
  recent [limit]            Show recent messages (default: 10)
  start                     Start monitoring agent
  help                      Show this help

Examples:
  npm run imessage test
  npm run imessage allow "+14809750797" "Ben"
  npm run imessage allow "kennonjarvis@gmail.com"
  npm run imessage list
  npm run imessage recent 20
  npm run imessage start
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
