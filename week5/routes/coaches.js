const express = require("express");
const router = express.Router();
const { dataSource } = require("../db/data-source");
const logger = require("../utils/logger")("Coach");
const {
    isUndefined,
    isNotValidInteger,
    isNotValidString,
    isValidPassword
  } = require('../utils/validUtils'); 
  // 若我要從"../utils/validUtils"一次調用多個函數過來使用，我該怎麼做？
  // 可以這樣做 const { isUndefined, isNotValidInteger, isNotValidString, isValidPassword } = require("../utils/validUtils");
  // 這是什麼意思？這樣的寫法是將 "../utils/validUtils" 中的所有函式都解構賦值到變數中
console.log("routesCoaches 0-------------------");

// 取得教練列表：{url}/api/coaches/?per=?page=?可以透過 query string 篩選資料。
// 參數說明如下：- per: 一頁幾筆資料- page: 頁碼
router.get("/", async(req ,res ,next)=>{
    try {
        const {per, page} = req.query; // 這邊的 per 和 page 是從 req.query 中取得的
        if (
          isUndefined(per) || isNotValidString(per) ||
          isUndefined(page) || isNotValidString(page)
        ) {
          res.status(400).json({
            "status": "failed",
            "message": "欄位未填寫正確",
          });
          return;
        }
        const perNum = parseInt(per || 5); // 若使用者未輸入 per 則預設顯示 5 筆資料
        const pageNum  = parseInt(page || 1); // 若使用者未輸入 page 則預設是第 1 頁
        if (perNum <= 0 || pageNum <= 0) {
            res.status(400).json({
                "status": "failed",
                "message": "欄位未填寫正確",
            });
            return;
        }
        const coaches = await dataSource.getRepository("Coach").find({
            // select: ["id", "description"],
            take: perNum,
            skip: (pageNum - 1) * perNum, // skip 是什麼？是用來跳過前面幾筆資料的
            // 例如：如果 per = 10，page = 2，那麼 skip = (2 - 1) * 10 = 10，表示跳過前面 10 筆資料
            // 這樣的話，第二頁就會顯示第 11 筆到第 20 筆資料
            relations: {
                User: true,
            },
        });
        const coachList = coaches.map((item) => ({
            "id": item.id,
            "name": item.User.name,
        }));
        res.status(200).json({
            "status": "success",
            "data": coachList
        });
    } catch (error) {
        logger.error(error);
        next(error);
    }
});

// 取得教練詳細資訊：驗證 coachId 的正確性，再從 Coach 資料表中取得教練詳細資訊
router.get("/:coachId", async(req ,res ,next)=>{
    try {
        const {coachId} = req.params;
        if (
          isUndefined(coachId) || isNotValidString(coachId)
        ) {
          res.status(400).json({
            "status": "failed",
            "message": "欄位未填寫正確",
          });
          return;
        }
        const coach = await dataSource.getRepository("Coach").findOne({
            where: {
                "id": coachId,
            },
            relations: {
                "User": true,
            },
        });
        if (!coach) {
            res.status(400).json({
                "status": "failed",
                "message": "教練不存在",
            });
            return;
        }
        const coachDetail = {
            "user":{
                "name": coach.User.name,
                "role": coach.User.role,
            },
            "coach":{
                "id": coach.id,
                "userId": coach.User.id,
                "experience_years": coach.experience_years,
                "description": coach.description,
                "profile_image_url": coach.profile_image_url,
                "created_at": coach.created_at,
                "updated_at": coach.updated_at
            }
        }
        res.status(200).json({
            "status": "success",
            "data": coachDetail
        });
        // console.log(coach);
    } catch (error) {
        logger.error(error);
        next(error);
    }   
});

module.exports = router;