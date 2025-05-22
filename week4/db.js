// db.js
const { DataSource, EntitySchema } = require("typeorm"); 
// 為何這邊要用大括號包起來？ 因為 require("typeorm") 會回傳一個物件，這邊是用解構賦值的方式，將物件中的 DataSource, EntitySchema 取出來使用
// 這個物件裡面有什麼屬性或方法？ 有 DataSource, EntitySchema 兩個屬性
// DataSource 這個屬性是什麼？ DataSource 是一個資料庫連線的設定
// EntitySchema 這個屬性是什麼？ EntitySchema 是一個資料庫表格的設定
// 這個物件裡面有什麼方法？ 沒有方法
// 所以一定要用兩個變數去承接 require("typeorm") 這個函式的回傳值嗎？ 不一定，可以用一個變數去承接，但是要用解構賦值的方式，將物件中的屬性取出來使用
// 解構賦值是什麼？ 解構賦值是一種 ES6 的語法，可以將物件或陣列中的屬性或元素取出來使用
// 解構賦值的語法是什麼？ const { 屬性1, 屬性2 } = require("模組名稱")
const CreditPackage = new EntitySchema({
  name: "CreditPackage",        // 在程式碼中的名稱
  tableName: "CREDIT_PACKAGE",  // 在資料庫中的名稱
  columns: {
    id: {
      primary: true,  // 是主鍵的意思
      type: "uuid",   // 資料庫欄位型態，如 varchar, integer, numeric, timestamp, uuid 等 
      generated: "uuid",
      nullable: false // 不可為空值
    },
    name: {
      type: "varchar",
      length: 50,     // 限制字串長度只有 50 個字
      nullable: false,
      unique: true    // 唯一性（不能有２筆資料的該欄位值相同）
    },
    credit_amount: {
      type: "integer",
      nullable: false
    },
    price: {
      type: "numeric",
      precision: 10, // 整數的有效位數？ 
      scale: 2,      // 小數點後２位
      nullable: false
    },
    createdAt: {
      type: "timestamp",
      nullable: false,
      createDate: true,
      name: "created_at"  // 在資料庫中的名稱改為created_at
    }
  }
});

const Skill = new EntitySchema({
  name: "Skill",
  tableName: "SKILL",
  columns: {
    id: {
      primary: true,
      type: "uuid",
      generated: "uuid",
      nullable: false
    },
    name: {
      type: "varchar",
      length: 50,
      nullable: false,
      unique: true
    },
    createdAt: {
      type: "timestamp",
      createDate: true,
      name: "created_at",
      nullable: false
    }
  }
});

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "test",
  database: process.env.DB_DATABASE || "test",
  entities: [CreditPackage, Skill],
  synchronize: true
});


// 透過 entities 陣列將所有 EntitySchema 加入。
// 啟動時 TypeORM 會根據這些設定自動建立或更新表結構（若 synchronize: true）。
// 之後就能使用 AppDataSource.getRepository("CreditPackage") 或 AppDataSource.getRepository("Skill") 進行 CRUD。

module.exports = AppDataSource;
 
// 上面這行的意思？ 將 AppDataSource 這個物件匯出，讓其他檔案可以引入使用
// 其他檔案如何引入使用？ 用 require("./db.js") 引入
// 接著呢？ 就可以使用 AppDataSource 這個物件的方法了
// 如何使用？ AppDataSource.getRepository("CreditPackage") 或 AppDataSource.getRepository("Skill") 進行 CRUD
