require("dotenv").config(); 
const express = require('express');
const router = express.Router();
const { dataSource } = require('../db/data-source');
//@解構賦值 的寫法，可讓程式碼更簡潔，意思等於 const dataSource = require('../db/data-source').dataSource;
// const dataSource = require('../db/data-source').dataSource; 這邊的 dataSource 是一個物件，裡面有很多屬性和方法
// 這邊的 dataSource 是一個物件，裡面有很多屬性和方法
const logger = require('../utils/logger')('Users');
const {
  isUndefined,
  isNotValidInteger,
  isNotValidString,
  isValidPassword
} = require('../utils/validUtils'); 
const bcrypt = require('bcrypt');
const saltRounds = 10;
console.log("routesUser 0-------------------");
// 註冊使用者
router.post('/signup', async (req, res, next) => {
  try {
    const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/;
    // 密碼需為包含英文數字大小寫，最短8個字，最長16個字
    const { name, email, password } = req.body; 
    // 解構賦值的寫法，可讓程式碼更簡潔，意思等於 const name = req.body.name; 
    // const email = req.body.email; const password = req.body.password;
    // 要注意的一點是來源必須是物件。

    // 驗證必填欄位
    if (isUndefined(name) || isNotValidString(name) || 
        isUndefined(email) || isNotValidString(email) || 
        isUndefined(password) || isNotValidString(password)) {
      logger.warn("欄位未填寫正確"); 
      res.status(400).json({
        "status": "failed",
        "message": "欄位未填寫正確"
      });
      return; 
      // 當執行這個 return 
    }
    if (!passwordPattern.test(password)) {
      logger.warn("建立使用者錯誤: 密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字");
      // logger.warn 怎麼使用？
      res.status(400).json({
        "status": "failed",
        "message": "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"
      });
      return; // 這邊若沒 return 會繼續執行下面的程式碼;
    }
    const userRepo = dataSource.getRepository('User'); 
    // getRepository 是一個方法，會回傳一個 Repository 物件，這個物件可以用來操作資料庫

    // 檢查 email 是否已存在
    const existingUser = await userRepo.find({
      where:{"email": email}
    });

    if (existingUser.length > 0) {
      logger.warn('建立使用者錯誤: Email 已被使用');
      res.status(409).json({
        "status": "failed",
        "message": "Email 已被使用"
      });
      return;
    }

    // 建立新使用者
    const hashPassword = await bcrypt.hash(password, saltRounds);
    // 將密碼藉由 bcrypt 加密，saltRounds 是加密的強度，數字越大越安全，但也會影響效能，一般來建議使用 10~12
    // 這邊的 hashPassword 是一個 Promise 物件，所以要用 await 等待它完成
    const newUser = userRepo.create({
      name, // 這行的意思與 name : name 是一樣的嗎？是的，這邊可以簡寫成 name
      email,
      "role": "USER",
      "password": hashPassword
    }); 

    const savedUser = await userRepo.save(newUser);
    logger.info('新建立的使用者ID:', savedUser.id);

    res.status(201).json({
      "status": "success",
      "data":{ 
        "user": {
          "id": savedUser.id,
          "name": savedUser.name
        }
      }
    });
  } catch (error) {
    logger.error('建立使用者錯誤:', error);
    next(error);
  }
});
console.log("routesUser 1-------------------");
module.exports = router;