/**
 * Command Firewall
 * Analyzes commands against allow/deny lists and returns analysis
 */

import { CommandAnalysis } from './types';
import { config } from './config';
import { logger } from './logger';

export class CommandFirewall {
  /**
   * Analyze a command against allow/deny lists
   */
  analyzeCommand(command: string): CommandAnalysis {
    const trimmedCommand = command.trim();

    // Empty command check
    if (!trimmedCommand) {
      return {
        command: trimmedCommand,
        allowed: false,
        reason: 'Empty command',
        riskLevel: 'high',
      };
    }

    // Check for dangerous special characters and operators first
    // Allow pipe for safe commands like: cat .env | grep KEY
    const dangerousPatterns = [
      { pattern: /[;&`]/, reason: 'Command chaining/substitution not allowed' },
      { pattern: />\s*\/dev\//, reason: 'Device file redirection not allowed' },
      { pattern: /\.\.\//g, reason: 'Path traversal not allowed' },
      { pattern: /^\.\//, reason: 'Script execution not allowed' },
      { pattern: /\$\(/, reason: 'Command substitution not allowed' },
      { pattern: /<\(|>\(/, reason: 'Process substitution not allowed' },
      // Allow pipe (|) for read-only operations - validated later
    ];

    for (const { pattern, reason } of dangerousPatterns) {
      if (pattern.test(trimmedCommand)) {
        logger.warn('Command contains dangerous pattern', {
          command: this.redactCommand(trimmedCommand),
          reason,
        });

        return {
          command: trimmedCommand,
          allowed: false,
          reason,
          riskLevel: 'critical',
        };
      }
    }

    // Extract the base command (first word, handle path prefixes)
    let baseCommand = trimmedCommand.split(/\s+/)[0];

    // Strip path prefix to get actual command name
    if (baseCommand.includes('/')) {
      baseCommand = baseCommand.split('/').pop() || baseCommand;
    }

    // Special handling for npm - allow only safe subcommands
    if (baseCommand === 'npm') {
      const npmSubcommand = trimmedCommand.split(/\s+/)[1];
      const allowedNpmSubcommands = ['run', 'test', 't', 'start'];

      if (npmSubcommand && allowedNpmSubcommands.includes(npmSubcommand)) {
        // Allow safe npm commands
        logger.info('Allowing safe npm subcommand', {
          command: this.redactCommand(trimmedCommand),
          subcommand: npmSubcommand,
        });

        // Continue to risk assessment
        const riskLevel = this.assessRisk(trimmedCommand);
        return {
          command: trimmedCommand,
          allowed: true,
          reason: 'Safe npm subcommand',
          riskLevel,
        };
      }
      // If not an allowed subcommand, fall through to denied check
    }

    // Special handling for python3 -c - allow only safe imports and read operations
    if (baseCommand === 'python3' && trimmedCommand.includes(' -c ')) {
      const pythonCode = trimmedCommand.match(/python3\s+-c\s+["'](.+)["']/)?.[1] || '';

      // Block dangerous operations in Python code
      const dangerousPythonPatterns = [
        /\bopen\s*\([^)]*,\s*["']w/,  // Write mode file operations
        /\bopen\s*\([^)]*,\s*["']a/,  // Append mode file operations
        /\bexec\s*\(/,                // Code execution
        /\beval\s*\(/,                // Code evaluation
        /\b__import__\s*\(/,          // Dynamic imports (can be dangerous)
        /\bos\.system\s*\(/,          // System commands
        /\bsubprocess\./,             // Subprocess execution
        /\bshutil\./,                 // File operations (move, copy, remove)
        /\bpickle\./,                 // Pickle can execute arbitrary code
      ];

      for (const pattern of dangerousPythonPatterns) {
        if (pattern.test(pythonCode)) {
          return {
            command: trimmedCommand,
            allowed: false,
            reason: 'Python code contains dangerous operations',
            riskLevel: 'critical',
          };
        }
      }

      // Allow safe Python one-liners (imports, prints, simple operations)
      logger.info('Allowing safe Python one-liner', {
        command: this.redactCommand(trimmedCommand),
      });

      return {
        command: trimmedCommand,
        allowed: true,
        reason: 'Safe Python one-liner',
        riskLevel: 'low',
      };
    }

    // Special handling for npx - allow only playwright
    if (baseCommand === 'npx') {
      const npxTarget = trimmedCommand.split(/\s+/)[1];

      if (npxTarget === 'playwright') {
        logger.info('Allowing npx playwright', {
          command: this.redactCommand(trimmedCommand),
        });

        return {
          command: trimmedCommand,
          allowed: true,
          reason: 'npx playwright test command',
          riskLevel: 'low',
        };
      }

      return {
        command: trimmedCommand,
        allowed: false,
        reason: 'Only npx playwright is allowed',
        riskLevel: 'high',
      };
    }

    // Special handling for export - allow only simple env var assignments
    if (baseCommand === 'export') {
      // Block redirects and dangerous operations
      if (/[>|;&`]/.test(trimmedCommand)) {
        return {
          command: trimmedCommand,
          allowed: false,
          reason: 'export with redirects/operators not allowed',
          riskLevel: 'high',
        };
      }

      // Only allow simple KEY=value format
      if (/^export\s+[A-Z_][A-Z0-9_]*=/.test(trimmedCommand)) {
        logger.info('Allowing safe export command', {
          command: this.redactCommand(trimmedCommand),
        });

        return {
          command: trimmedCommand,
          allowed: true,
          reason: 'Safe environment variable export',
          riskLevel: 'low',
        };
      }

      return {
        command: trimmedCommand,
        allowed: false,
        reason: 'export command format not recognized as safe',
        riskLevel: 'medium',
      };
    }

    // Special handling for node scripts - allow mem-save.js even with "gh" in content
    if (baseCommand === 'node' && trimmedCommand.includes('scripts/memory/mem-save.js')) {
      // This is safe - it's updating memory state, not running gh CLI
      logger.info('Allowing node mem-save.js (contains gh in content, not command)', {
        command: this.redactCommand(trimmedCommand),
      });

      return {
        command: trimmedCommand,
        allowed: true,
        reason: 'Safe memory update script',
        riskLevel: 'low',
      };
    }

    // Check denied commands first (highest priority)
    for (const deniedPattern of config.deniedCommands) {
      if (this.matchesPattern(trimmedCommand, deniedPattern, baseCommand)) {
        logger.warn('Command denied by firewall', {
          command: this.redactCommand(trimmedCommand),
          pattern: deniedPattern,
        });

        return {
          command: trimmedCommand,
          allowed: false,
          reason: `Command matches denied pattern: ${deniedPattern}`,
          riskLevel: 'critical',
        };
      }
    }

    // Check if base command is in allow list
    const isAllowed = config.allowedCommands.some(
      (allowed) => baseCommand === allowed || baseCommand.startsWith(`${allowed}/`)
    );

    if (!isAllowed) {
      logger.info('Command not in allow list', {
        command: this.redactCommand(trimmedCommand),
        baseCommand,
      });

      return {
        command: trimmedCommand,
        allowed: false,
        reason: `Command '${baseCommand}' not in allow list`,
        riskLevel: 'high',
      };
    }

    // Perform additional risk analysis
    const riskLevel = this.assessRisk(trimmedCommand);

    return {
      command: trimmedCommand,
      allowed: true,
      riskLevel,
    };
  }

  /**
   * Check if command matches a pattern
   * Enhanced pattern matching with multiple strategies
   */
  private matchesPattern(command: string, pattern: string, baseCommand: string): boolean {
    // List of short command names that should ONLY match at word boundaries
    // Added 'gem' to prevent matching 'gemini'
    const shortCommands = ['su', 'sh', 'nc', 'dd', 'cp', 'mv', 'rm', 'gem'];

    // Strategy 1: For short commands, use strict word boundary matching
    if (shortCommands.includes(pattern)) {
      // Only match if it's the base command or starts the command with a word boundary
      if (baseCommand === pattern) {
        return true;
      }
      const wordBoundaryPattern = new RegExp(`^${this.escapeRegex(pattern)}(\\s|$)`);
      return wordBoundaryPattern.test(command);
    }

    // Strategy 2: Check if pattern is a command word (matches base command)
    if (!pattern.includes(' ') && !pattern.includes('/') && !pattern.includes('.')) {
      // Pattern is a single word/command
      if (baseCommand === pattern) {
        return true;
      }

      // Also check if command starts with this pattern as a word
      const wordBoundaryPattern = new RegExp(`^${this.escapeRegex(pattern)}(\\s|$)`);
      if (wordBoundaryPattern.test(command)) {
        return true;
      }
    }

    // Strategy 3: Check if pattern appears in command (for complex patterns and paths)
    if (command.includes(pattern)) {
      return true;
    }

    // Strategy 4: Check if pattern is at start of command (for path patterns)
    if (command.startsWith(pattern)) {
      return true;
    }

    return false;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Assess risk level of allowed command
   */
  private assessRisk(command: string): CommandAnalysis['riskLevel'] {
    // Commands with write operations
    const mediumRiskPatterns = [
      'git push',
      'git commit',
      'git rebase',
      'git reset',
      'find.*-exec',
      'find.*-delete',
    ];

    for (const pattern of mediumRiskPatterns) {
      if (new RegExp(pattern).test(command)) {
        return 'medium';
      }
    }

    // Default to low risk for allowed commands
    return 'low';
  }

  /**
   * Redact sensitive information from commands for logging
   */
  redactCommand(command: string): string {
    // Redact potential passwords, tokens, keys
    const patterns = [
      /password[=:]\s*\S+/gi,
      /token[=:]\s*\S+/gi,
      /key[=:]\s*\S+/gi,
      /secret[=:]\s*\S+/gi,
      /--password\s+\S+/gi,
      /--token\s+\S+/gi,
    ];

    let redacted = command;
    for (const pattern of patterns) {
      redacted = redacted.replace(pattern, (match) => {
        const parts = match.split(/[=:\s]+/);
        return `${parts[0]}=***REDACTED***`;
      });
    }

    return redacted;
  }
}
