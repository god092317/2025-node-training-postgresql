const { DataSource } = require('typeorm'); 
// DataSource 是什麼？是 TypeORM 的一個類別，用來建立資料庫連線的
// 寫法等同於 const DataSouce = require('typeorm').DataSource
const config = require('../config/index'); 
// config 是什麼？是用來讀取環境變數的
console.log("dataSource 0-------------------");
const CreditPackage = require('../entities/CreditPackages');
const Coach = require('../entities/Coach');
const Course = require('../entities/Course');
const Skill = require('../entities/Skill');
const User = require('../entities/User');

console.log("dataSource 1-------------------");

const dataSource = new DataSource({
  type: 'postgres',
  host: config.get('db.host'),
  port: config.get('db.port'),
  username: config.get('db.username'),
  password: config.get('db.password'),
  database: config.get('db.database'),
  synchronize: config.get('db.synchronize'),
  poolSize: 10,
  entities: [
    CreditPackage,
    Coach,
    Course,
    Skill,
    User
  ],
  ssl: config.get('db.ssl')
});

module.exports = { dataSource };
