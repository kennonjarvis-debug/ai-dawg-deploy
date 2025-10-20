class Logger {
  isDevelopment;
  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== "production";
  }
  formatMessage(level, message, context) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}]${contextStr} ${message}`;
  }
  log(level, message, context) {
    const formattedMessage = this.formatMessage(level, message, context);
    switch (level) {
      case "debug":
        if (this.isDevelopment) {
          console.debug(formattedMessage);
        }
        break;
      case "info":
        console.info(formattedMessage);
        break;
      case "warn":
        console.warn(formattedMessage);
        break;
      case "error":
        console.error(formattedMessage);
        break;
    }
  }
  debug(message, context) {
    this.log("debug", message, context);
  }
  info(message, context) {
    this.log("info", message, context);
  }
  warn(message, context) {
    this.log("warn", message, context);
  }
  error(message, context) {
    this.log("error", message, context);
  }
}
const logger = new Logger();
export {
  logger as l
};
