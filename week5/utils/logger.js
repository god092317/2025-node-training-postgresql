const pino = require('pino');
const pretty = require('pino-pretty');
console.log("logger-------------------");
module.exports = function getLogger (prefix, logLevel = 'debug') {
  return pino(pretty({
    level: logLevel,
    messageFormat: `[${prefix}]: {msg}`,
    colorize: true,
    sync: true
  }));
}
