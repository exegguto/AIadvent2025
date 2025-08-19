import { config } from './config.js';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

class Logger {
  constructor() {
    this.level = logLevels[config.logging.level] || logLevels.info;
  }

  _log(level, message, data = null) {
    if (logLevels[level] <= this.level) {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        message,
        ...(data && { data })
      };
      
      console.log(JSON.stringify(logEntry));
    }
  }

  error(message, data = null) {
    this._log('error', message, data);
  }

  warn(message, data = null) {
    this._log('warn', message, data);
  }

  info(message, data = null) {
    this._log('info', message, data);
  }

  debug(message, data = null) {
    this._log('debug', message, data);
  }
}

export const logger = new Logger();
