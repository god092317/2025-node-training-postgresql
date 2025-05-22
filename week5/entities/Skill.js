// Skill.js

const { EntitySchema } = require('typeorm');
console.log("data-entitiesSkill 0-------------------");
module.exports = new EntitySchema({
  name: 'Skill',
  tableName: 'SKILL',
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
      nullable: false,
      unique: true
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
      name: 'created_at',
      nullable: false
    }
  }
});