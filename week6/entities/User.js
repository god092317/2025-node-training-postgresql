// User.js

const { EntitySchema } = require('typeorm');
// 可以寫成 const EntitySchema = require('typeorm').EntitySchema;
// 這邊的 EntitySchema 是一個類別，用來定義資料庫的實體
// 類別是 class 的意思，這邊的 EntitySchema 是一個類別，用來定義資料庫的實體
module.exports = new EntitySchema({
  name: 'User',
  tableName: 'USER',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
      nullable: false
    },
    name: {
      type: 'varchar',
      length: 50,
      nullable: false
    },
    email: {
      type: 'varchar',
      length: 320,
      nullable: false,
      unique: true
    },
    role: {
      type: 'varchar',
      length: 20,
      nullable: false
    },
    password: {
      type: 'varchar',
      length: 72,
      nullable: false,
      select: false     // 不會在查詢時回傳這個欄位
    },
    created_at: {
      type: 'timestamp',
      createDate: true,
      nullable: false
    },
    updated_at: {
      type: 'timestamp',
      updateDate: true,
      nullable: false
    }
  }
});