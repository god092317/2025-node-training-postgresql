const express = require('express');
const router = express.Router();
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('CreditPackage');
const {
  isUndefined,
  isNotValidInteger,
  isNotValidString,
  isValidPassword
} = require('../utils/validUtils'); 

// 取得購買方案列表：從資料庫取出 CreditPackage 資料表的所有資料，並只取出 id, name, credit_amount, price 這四個欄位的資料
router.get("/", async (req, res, next) => {
  try { // 這邊的 try-catch 是為了避免資料庫錯誤導致程式崩潰嗎？是的。
    const creditPackage = await dataSource.getRepository('CreditPackage').find({
      select: ['id', 'name', 'credit_amount', 'price']
    });
    // console.log(creditPackage);
    res.status(200).json({
      "status": "success",
      "data": creditPackage
    });
  } catch (error) { // 這會怎麼運作？
      logger.error(error);
      next(error);
  }
});

// 新增購買方案：從 req.body 取出資料，再存入 CreditPackage 資料表中
router.post("/", async (req, res, next) => {
  try {
    const { 
      name, 
      price,
      "credit_amount": creditAmount,
    } = req.body; // 解構賦值的寫法，可讓程式碼更簡潔，意思等於 const name = req.body.name; const price = req.body.price; const creditAmount = req.body.credit_amount;
    if (  // 驗證必填欄位
      isUndefined(name) || isNotValidString(name) ||
      isUndefined(price) || isNotValidInteger(price) ||
      isUndefined(creditAmount) || isNotValidInteger(creditAmount)) {
        res.status(400).json({
        "status": 'failed',
        "message": '欄位未填寫正確'
      });
      return; // 這邊return 會跳到出去哪裡？
    }   // 確認是否有重複的方案名稱
    const creditPackageRepo = await dataSource.getRepository('CreditPackage'); 
    const existCreditPackage = await creditPackageRepo.find({
      where: { 
        "name": name 
      }
    });
    if (existCreditPackage.length > 0) {
      res.status(409).json({
        "status": "failed",
        "message": '資料重複'
      });
      return;
    }
    const newCreditPackage = creditPackageRepo.create({ // 這邊不用 await 因為這邊只是建立一個新的 CreditPackage 物件
      name,
      "credit_amount": creditAmount,
      price
    });
    const result = await creditPackageRepo.save(newCreditPackage); // 這邊才是將資料存入資料庫。
    res.status(200).json({
      "status": "success",
      "data": result,
    });
  } catch (error) {
      logger.error(error);
      next(error);
  }
});

// 刪除購買方案：從 req.params 取出 creditPackageId，然後從 CreditPackage 資料表中刪除該筆資料
router.delete("/:creditPackageId", async (req, res, next) => {
  try {
    const { creditPackageId } = req.params;
    // 驗證 creditPackageId 是否為有效的 UUID
    if (isUndefined(creditPackageId) || isNotValidString(creditPackageId)) {
      res.status(400).json({
        "status": "failed",
        "message": "欄位未填寫正確"
      });
      return;
    }
    const result = await dataSource.getRepository('CreditPackage').delete(creditPackageId);
    if (result.affected === 0) { 
      // 這邊的 result.affected 是什麼意思？ 是指刪除的資料筆數
      // 如果沒有刪除任何資料，代表 creditPackageId 不存在資料表中
      res.status(400).json({
        "status": "failed",
        "message": "ID錯誤"
      });
      return;
    }
    res.status(200).json({
      "status": "success",
      "data": result
    });
  } catch (error) {
      logger.error(error);
      next(error);
  }
});

module.exports = router;