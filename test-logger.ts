import { logger } from './src/utils/logger';

console.log('Testing Winston Logger...\n');

logger.info('This is an info message');
logger.warn('This is a warning message');
logger.error('This is an error message');
logger.debug('This is a debug message (should not appear with default log level)');

console.log('\nLogger test complete!');
console.log('Check logs/combined.log and logs/error.log for output');
