/**
 * Gateway Configuration
 * Loads configuration from environment variables and HOSTS_JSON
 */

import { GatewayConfig, HostConfig } from './types';
import { logger } from './logger';

function loadHostsConfig(): HostConfig[] {
  const hostsJson = process.env.HOSTS_JSON;

  if (!hostsJson) {
    logger.warn('HOSTS_JSON not set, using default localhost configuration');
    return [
      {
        id: 'localhost',
        host: 'localhost',
        port: 22,
        username: process.env.SSH_USERNAME || 'user',
        password: process.env.SSH_PASSWORD,
      },
    ];
  }

  try {
    const hosts = JSON.parse(hostsJson);
    if (!Array.isArray(hosts)) {
      throw new Error('HOSTS_JSON must be an array');
    }
    return hosts as HostConfig[];
  } catch (error) {
    logger.error('Failed to parse HOSTS_JSON', { error });
    throw error;
  }
}

// ChatGPT CLI Mode - allows AI CLI tools when enabled
const chatGptCliMode = process.env.CHATGPT_CLI_MODE === 'true';

// Build allowed commands list based on mode
function buildAllowedCommands(): string[] {
  const baseCommands = [
    // Version control (read-only operations)
    'git',

    // System monitoring (read-only)
    'ps',
    'top',
    'df',
    'free',
    'uptime',
    'whoami',
    'date',

    // File operations (read-only + mkdir for memory system)
    'ls',
    'cat',
    'grep',
    'pwd',
    'echo',
    'head',
    'tail',
    'find',
    'wc',
    'sort',
    'uniq',
    'mkdir',  // Allow directory creation for memory/logging systems

    // Text editors (user-initiated only)
    'vim',
    'nano',
  ];

  // Add AI CLI tools if ChatGPT mode is enabled
  if (chatGptCliMode) {
    logger.info('ChatGPT CLI Mode enabled - allowing AI CLI tools');
    return [
      ...baseCommands,
      'node',     // Node.js for running orchestration scripts
      'gemini',   // Google Gemini CLI
      'codex',    // OpenAI Codex CLI
      'claude',   // Claude Code CLI (requires API credits)
      'python3',  // Python for safe one-liners (validated separately)
      'npx',      // NPX for playwright tests (validated separately)
      'export',   // Export for env vars (validated separately)
    ];
  }

  return baseCommands;
}

// Build denied commands list based on mode
function buildDeniedCommands(): string[] {
  const baseDenied = [
    // File system destruction
    'rm',
    'rmdir',
    'dd',
    'mkfs',
    'fdisk',
    'parted',
    'shred',
    '> /dev/',
    'truncate',

    // Permission/ownership changes
    'chmod',
    'chown',
    'chgrp',
    'setfacl',

    // System modification
    'sudo',
    'su',
    'doas',
    'pkexec',
    'systemctl',
    'service',
    'reboot',
    'shutdown',
    'halt',
    'poweroff',
    'init',

    // Process control
    'kill',
    'killall',
    'pkill',
    'xkill',

    // Network tools (can be used for attacks)
    'nc',
    'netcat',
    'ncat',
    'telnet',
    'wget',
    'curl',
    'ftp',
    'sftp',
    'ssh',
    'scp',
    'rsync',

    // Container/orchestration (full system access)
    'docker',
    'kubectl',
    'podman',
    'containerd',
    'crictl',
    'minikube',

    // Package managers (can install malware)
    'npm',
    'npx',
    'yarn',
    'pnpm',
    'pip',
    'pip3',
    'gem',
    'cargo',
    'go get',
    'apt',
    'apt-get',
    'yum',
    'dnf',
    'zypper',
    'pacman',
    'brew',

    // Scripting/execution (arbitrary code) - unless in ChatGPT CLI mode
    'python',
    'python3',
    'perl',
    'ruby',
    'php',
    'bash',
    'sh',
    'zsh',
    'fish',
    'exec',
    'eval',
    'source',

    // Other AI CLI tools (GitHub Copilot, gcloud)
    'copilot',
    'gh',
    'gcloud',

    // Compression (can be used to exfiltrate data)
    'tar',
    'zip',
    'unzip',
    'gzip',
    'bzip2',
    '7z',

    // File transfer/writing
    'mv',
    'cp',
    'touch',
    'tee',
    'write',

    // Database access
    'mysql',
    'psql',
    'mongo',
    'redis-cli',

    // System info (can leak sensitive data)
    'env',
    'printenv',
    'export',

    // Dangerous patterns
    ':(){ :|:& };:', // fork bomb
    '&',             // background execution
    '|',             // piping (can bypass filters)
    ';',             // command chaining
    '&&',            // command chaining
    '||',            // command chaining
    '$(',            // command substitution
    '`',             // command substitution
    '<(',            // process substitution
    '>(',            // process substitution
    '>>',            // append redirect
    '>',             // redirect
    '<',             // input redirect

    // Path traversal
    '../',
    '/etc/',
    '/dev/',
    '/proc/',
    '/sys/',
    '/root/',
    '/home/',
    '~/',
  ];

  // Remove node, claude, gemini, codex, gem, python3, npx, export, gh, | from denied list if ChatGPT mode is enabled
  // (gem would block gemini, which contains "gem")
  // (| allowed for safe read-only pipes like: cat .env | grep KEY)
  if (chatGptCliMode) {
    return baseDenied.filter(cmd =>
      !['node', 'claude', 'gemini', 'codex', 'gem', 'python3', 'npx', 'export', 'gh', '|'].includes(cmd)
    );
  }

  return baseDenied;
}

export const config: GatewayConfig = {
  port: parseInt(process.env.GATEWAY_PORT || '3002', 10),
  sessionTTL: parseInt(process.env.SESSION_TTL || '3600000', 10), // 1 hour default
  maxSessions: parseInt(process.env.MAX_SESSIONS || '6', 10),
  inactivityTimeout: parseInt(process.env.INACTIVITY_TIMEOUT || '600000', 10), // 10 minutes default
  heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL || '30000', 10), // 30 seconds default
  hosts: loadHostsConfig(),
  allowedCommands: buildAllowedCommands(),
  deniedCommands: buildDeniedCommands(),
  enableAI: process.env.ENABLE_AI === 'true',
  privilegedApproval: process.env.PRIVILEGED_APPROVAL === 'true',
};

logger.info('Gateway configuration loaded', {
  port: config.port,
  maxSessions: config.maxSessions,
  hostsCount: config.hosts.length,
  enableAI: config.enableAI,
  privilegedApproval: config.privilegedApproval,
});
