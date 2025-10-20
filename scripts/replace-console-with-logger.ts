#!/usr/bin/env tsx
/**
 * Automated Console.* Replacement Script
 *
 * Replaces all console.log/warn/error/info calls with structured logger calls
 * across backend TypeScript files.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface Replacement {
  file: string;
  original: string;
  modified: string;
  count: number;
}

const replacements: Replacement[] = [];

/**
 * Determine the correct relative path to logger based on file location
 */
function getLoggerImportPath(filePath: string): string {
  const fileDir = path.dirname(filePath);

  // Check if file is in backend/src or apps/backend/src
  if (filePath.includes('/backend/src/')) {
    // backend/src/* -> ../../src/lib/utils/logger
    const depth = filePath.split('/backend/src/')[1].split('/').length - 1;
    return '../'.repeat(depth + 2) + 'src/lib/utils/logger.js';
  } else if (filePath.includes('/apps/backend/src/')) {
    // apps/backend/src/* -> ../../../src/lib/utils/logger
    const depth = filePath.split('/apps/backend/src/')[1].split('/').length - 1;
    return '../'.repeat(depth + 3) + 'src/lib/utils/logger.js';
  }

  // Default fallback
  return '../../../src/lib/utils/logger.js';
}

/**
 * Add logger import if not present
 */
function addLoggerImport(content: string, filePath: string): string {
  // Check if logger is already imported
  if (content.includes("from '../") && content.includes("/logger")) {
    return content;
  }
  if (content.includes('import { logger }')) {
    return content;
  }

  const importPath = getLoggerImportPath(filePath);
  const loggerImport = `import { logger } from '${importPath}';`;

  // Find the last import statement
  const lines = content.split('\n');
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ') || lines[i].startsWith("import'")) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex >= 0) {
    // Insert after last import
    lines.splice(lastImportIndex + 1, 0, loggerImport);
    return lines.join('\n');
  } else {
    // Insert at beginning after comments
    let insertIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].startsWith('/**') && !lines[i].startsWith(' *') && !lines[i].startsWith('*/') && !lines[i].startsWith('//') && lines[i].trim() !== '') {
        insertIndex = i;
        break;
      }
    }
    lines.splice(insertIndex, 0, loggerImport, '');
    return lines.join('\n');
  }
}

/**
 * Replace console.log with logger.info
 */
function replaceConsoleLogs(content: string): string {
  // Pattern 1: console.log('Simple message')
  content = content.replace(
    /console\.log\((['"`])([^'"`]+)\1\);?/g,
    (match, quote, message) => {
      return `logger.info('${message}');`;
    }
  );

  // Pattern 2: console.log('Message:', variable)
  content = content.replace(
    /console\.log\((['"`])([^'"`]+):\1,\s*(\w+)\);?/g,
    (match, quote, message, variable) => {
      return `logger.info('${message}', { ${variable} });`;
    }
  );

  // Pattern 3: console.log with template literal
  content = content.replace(
    /console\.log\(`([^`]+)`\);?/g,
    (match, message) => {
      // Extract variables from template
      const vars = message.match(/\$\{(\w+)\}/g);
      if (vars) {
        const cleanMessage = message.replace(/\$\{(\w+)\}/g, '$1');
        const varNames = vars.map(v => v.replace('${', '').replace('}', ''));
        const contextObj = varNames.map(v => `${v}`).join(', ');
        return `logger.info('${cleanMessage}', { ${contextObj} });`;
      }
      return `logger.info('${message}');`;
    }
  );

  return content;
}

/**
 * Replace console.error with logger.error
 */
function replaceConsoleErrors(content: string): string {
  // Pattern 1: console.error('Message:', error)
  content = content.replace(
    /console\.error\((['"`])([^'"`]+):\1,\s*(\w+)\);?/g,
    (match, quote, message, variable) => {
      if (variable === 'error') {
        return `logger.error('${message}', { error: error.message || String(error) });`;
      }
      return `logger.error('${message}', { ${variable} });`;
    }
  );

  // Pattern 2: console.error('Simple message', error)
  content = content.replace(
    /console\.error\((['"`])([^'"`]+)\1,\s*error\);?/g,
    (match, quote, message) => {
      return `logger.error('${message}', { error: error instanceof Error ? error.message : String(error) });`;
    }
  );

  // Pattern 3: console.error('Simple message')
  content = content.replace(
    /console\.error\((['"`])([^'"`]+)\1\);?/g,
    (match, quote, message) => {
      return `logger.error('${message}');`;
    }
  );

  return content;
}

/**
 * Replace console.warn with logger.warn
 */
function replaceConsoleWarns(content: string): string {
  // Pattern 1: console.warn('Message:', variable)
  content = content.replace(
    /console\.warn\((['"`])([^'"`]+):\1,\s*(\w+)\);?/g,
    (match, quote, message, variable) => {
      return `logger.warn('${message}', { ${variable} });`;
    }
  );

  // Pattern 2: console.warn('Simple message')
  content = content.replace(
    /console\.warn\((['"`])([^'"`]+)\1\);?/g,
    (match, quote, message) => {
      return `logger.warn('${message}');`;
    }
  );

  return content;
}

/**
 * Replace console.info with logger.info
 */
function replaceConsoleInfos(content: string): string {
  // Same patterns as console.log
  content = content.replace(
    /console\.info\((['"`])([^'"`]+)\1\);?/g,
    (match, quote, message) => {
      return `logger.info('${message}');`;
    }
  );

  content = content.replace(
    /console\.info\((['"`])([^'"`]+):\1,\s*(\w+)\);?/g,
    (match, quote, message, variable) => {
      return `logger.info('${message}', { ${variable} });`;
    }
  );

  return content;
}

/**
 * Process a single file
 */
function processFile(filePath: string): boolean {
  try {
    const originalContent = fs.readFileSync(filePath, 'utf-8');
    let modifiedContent = originalContent;

    // Check if file has console calls
    const hasConsoleCalls = /console\.(log|warn|error|info)\(/.test(originalContent);

    if (!hasConsoleCalls) {
      return false;
    }

    // Add logger import
    modifiedContent = addLoggerImport(modifiedContent, filePath);

    // Replace all console calls
    modifiedContent = replaceConsoleLogs(modifiedContent);
    modifiedContent = replaceConsoleErrors(modifiedContent);
    modifiedContent = replaceConsoleWarns(modifiedContent);
    modifiedContent = replaceConsoleInfos(modifiedContent);

    // Count replacements
    const originalCount = (originalContent.match(/console\.(log|warn|error|info)\(/g) || []).length;
    const modifiedCount = (modifiedContent.match(/console\.(log|warn|error|info)\(/g) || []).length;
    const replacedCount = originalCount - modifiedCount;

    if (replacedCount > 0) {
      // Write modified content
      fs.writeFileSync(filePath, modifiedContent, 'utf-8');

      replacements.push({
        file: filePath,
        original: originalContent,
        modified: modifiedContent,
        count: replacedCount
      });

      console.log(`✅ ${filePath}: ${replacedCount} replacements`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting console.* replacement script\n');

  // Find all TypeScript files in backend directories
  const patterns = [
    'backend/src/**/*.ts',
    'apps/backend/src/**/*.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/*.test.ts',
    '!**/*.spec.ts'
  ];

  const files = await glob(patterns);

  console.log(`📁 Found ${files.length} backend TypeScript files\n`);

  let processedCount = 0;
  let totalReplacements = 0;

  for (const file of files) {
    const wasProcessed = processFile(file);
    if (wasProcessed) {
      processedCount++;
      const replacement = replacements.find(r => r.file === file);
      if (replacement) {
        totalReplacements += replacement.count;
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log('='.repeat(50));
  console.log(`Files processed: ${processedCount}`);
  console.log(`Total replacements: ${totalReplacements}`);
  console.log(`Files unchanged: ${files.length - processedCount}`);
  console.log('='.repeat(50));

  if (processedCount > 0) {
    console.log('\n✅ Logger replacement complete!');
    console.log('\n💡 Next steps:');
    console.log('1. Review changes: git diff');
    console.log('2. Test the application');
    console.log('3. Commit changes: git add . && git commit -m "refactor: replace console.* with structured logger"');
  } else {
    console.log('\n✅ No console.* calls found to replace!');
  }
}

main().catch(console.error);
