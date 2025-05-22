const express = require('express');
const router = express.Router();
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('Skill');
const {
  isUndefined,
  isNotValidInteger,
  isNotValidString,
  isValidPassword
} = require('../utils/validUtils'); 
const appError = require("../utils/appError");

// 取得教練專長列表：從資料庫取出 Skill 資料表的所有資料，並且只取出 id, name 這兩個欄位的資料
router.get("/", async(req, res, next)=>{
  try {
      const skill = await dataSource.getRepository("Skill").find({
        select : ["id", "name"]
      });
      res.status(200).json({
          "status": "success",
          "data": skill
      });
  } catch (error) {
      logger.error(error);
      next(error);
  }
});

// 新增教練專長：從 req.body 取出資料，再存入 Skill 資料表中
router.post("/", async(req, res, next)=>{
  try {
      const {name} = req.body;
      if (isUndefined(name) || isNotValidString(name)) {
        // 原本寫法
          // res.status(400).json({
          //     "status": "failed",
          //     "message": "欄位未填寫正確"
          // })
        // 優化寫法
          next(appError(400,"欄位未填寫正確")); // 為何要加入 next？
          return;
      }
      const skillRepo = dataSource.getRepository("Skill"); 
      const existSkill = await skillRepo.findOne({
          where : {
            name
          }
      });
      if (existSkill) {
          res.status(409).json({
              "status": "failed",
              "message": "資料重複"
          });
          return;
      }
      const newSkill = await skillRepo.create({
          "name" : name,
      });
      const result = await skillRepo.save(newSkill);
      res.status(200).json({
          "status": "success",
          "data": result
      });
  } catch (error) {
      logger.error(error);
      next(error);
  }
});

// 刪除教練專長：從req.params 取出 skillId，再依據該 Id 刪除 Skill 對應的資料表
router.delete("/:skillId", async(req, res, next)=>{
  try {
      const {skillId} = req.params;
      if (isUndefined(skillId) || isNotValidString(skillId)) {
          res.status(400).json({
              "status": "failed",
              "message": "ID錯誤"
      });
        return;
      }
      const result = await dataSource.getRepository("Skill").delete(skillId);
      if (result.affected === 0) { 
          // affected 是什麼？affected 是指受影響的資料筆數
          // 如果刪除的資料筆數為 0，表示沒有找到對應的資料
          res.status(400).json({
              "status": "failed",
              "message": "ID錯誤"
          });
        return;
      }
      res.status(200).json({
          "status": "success",
          "message": "刪除成功",
          "data": result
      });
  } catch (error) {
      logger.error(error);
      next(error);
  }   
});

module.exports = router;