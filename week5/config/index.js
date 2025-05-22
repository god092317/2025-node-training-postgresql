const dotenv = require('dotenv');
// dotenv 是什麼？是用來讀取 .env 檔案的
// 為何要用 dotenv？ 因為這樣可以讓我們在程式中使用環境變數
const result = dotenv.config();
// 如果沒有這行，dotenv 就無法讀取 .env 檔案中的環境變數，導致無法使用環境變數
// console.log('dotenv', dotenv);
// console.log('dotenv result', result);
const db = require('./db');
const web = require('./web');

if (result.error) {
  throw result.error;
}

const config = { 
  db,
  web
};
console.log("configIndex-------------------");

class ConfigManager {
  /**
   * Retrieves a configuration value based on the provided dot-separated path.
   * Throws an error if the specified configuration path is not found.
   *
   * @param {string} path - Dot-separated string representing the configuration path.
   * @returns {*} - The configuration value corresponding to the given path.
   * @throws Will throw an error if the configuration path is not found.
   */

  static get (path) {
    if (!path || typeof path !== 'string') {
      throw new Error(`incorrect path: ${path}`);
    }
    const keys = path.split('.');
    let configValue = config;
    keys.forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(configValue, key)) {
        throw new Error(`config ${path} not found`);
      }
      configValue = configValue[key];
    });
    return configValue;
  }
}

module.exports = ConfigManager;