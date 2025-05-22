// Coach.js

const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Coach',
  tableName: 'COACH',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
      nullable: false
    },
    user_id: {
      type: 'uuid',
      unique: true,
      nullable: false
    },
    experience_years: {
      type: 'integer',
      nullable: false
    },
    description: {
      type: 'text',
      nullable: false
    },
    profile_image_url: {
      type: 'varchar',
      length: 2048,
      nullable: true
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
  },
  relations: { // 定義關聯 但不清楚每一行的意思。
    User: {
      target: 'User',       // 這行是指要關聯的表格名稱
      type: 'one-to-one',   // 關聯的型態 one-to-one 
      inverseSide: 'Coach', // 不懂這行要做什麼？
      joinColumn: {         // joinColumn 是指要關聯的欄位名稱
        name: 'user_id',    // 這行是指要關聯的欄位名稱
        referencedColumnName: 'id', 
        foreignKeyConstraintName: 'coach_user_id_fk' //這個欄位可以自己取名
      }
    }
  }
});