const express = require('express');
const bcrypt = require('bcrypt');

const router = express.Router();
const config = require('../config/index');
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('Users');
// const generateJWT = require('../utils/generateJWT');  // JWT？
const {
  generateJWT,
  verifyJWT } = require("../utils/jwtUtils");  // 助教寫法
const auth = require('../middlewares/auth')({         // auth？
  secret: config.get('secret').jwtSecret,
  userRepository: dataSource.getRepository('User'),
  logger
});
const {
    isUndefined,
    isNotValidString,
    isValidPassword,
    isValidEmail
} = require("../utils/validUtils");
const appError = require("../utils/appError");

router.post("/signup", async (req, res, next)=>{
  try{
    const { name,
            email, 
            password } = req.body;
    // 驗證使用者輸入的欄位
    if (isUndefined(name) || isNotValidString(name) ||
        isUndefined(email) || isNotValidString(email) ||
        isUndefined(password) || isNotValidString(password)){
          logger.warn("欄位輸入錯誤");
          // res.status(400).json({  
          //   "status": "false",
          //   "message": "欄位輸入錯誤"
          // });
          next(appError(400,"欄位輸入錯誤"));
          return;
    }
    // 驗證 email 是否符合規則
    if (!isValidEmail(email)){
      logger.warn("email 不符合規則");
      res.status(400).json({
        "status": "false",
        "message": "email 不符合規則"
      });
      return;      
    }
    // 驗證密碼是否符合規則（英數字大小寫）
    const passwordPattern = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,16}/;
    if (!passwordPattern.test(password)) {
      logger.warn("密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字");
      res.status(400).json({
        "status": "false",
        "message": "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"
      });
      return;
    }
    // 驗證是否有重複註冊的 Email
    const userRepo = dataSource.getRepository("User");
    const existingUser = await userRepo.findOne({
      where: {email}
    });
    if (existingUser){
      logger.warn("Email 重複註冊");
      res.status(409).json({
        "status": "false",
        "message": "Email 重複註冊"
      });
      return;
    }
    // 將使用者密碼加密後與註冊資料存入 User 資料表
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashPassword = await bcrypt.hash(password, salt);
    const userRepoCreate = userRepo.create({
      name,
      email,
      "password": hashPassword,
      "role" : "USER"
    });
    const user = await userRepo.save(userRepoCreate);
    logger.info(`使用者註冊成功：${user.email}`);
    res.status(201).json({
      "status": "true",
      "data":{ 
        "id": user.id,
        "name" :user.name,
        "email": user.email
      }
    });
  }catch(error){
    logger.error('建立使用者錯誤:', error);
    next(error);
  }
});

router.post("/login", async(req, res, next)=>{
  try{
    const{ email, 
           password } = req.body;
    // 驗證使用者輸入的欄位
    if( isUndefined(email) || isNotValidString(email)||
      isUndefined(password) || isNotValidString(password)){
        logger.warn("欄位輸入錯誤");
        res.status(400).json({
          "status": "false",
          "message": "欄位輸入錯誤"
        });
        return;
    }
    // 驗證密碼規則
    if(!isValidPassword(password)) {
      logger.warn('密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字')
      res.status(400).json({
        "status": "false",
        "message": "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字"
      })
      return;
    }
    // 有這個 email 有在資料庫嗎？ 密碼正確嗎？
    const userRepo = dataSource.getRepository("User");
    const existingUser = await userRepo.findOne({
      select: ["id", "name", "password"],
      where: {email}
    });
    if(!existingUser){
      logger.warn("使用者不存在 或 密碼錯誤");
      res.status(400).json({
        "status": "false",
        "message": "使用者不存在 或 密碼錯誤"
      });
      return;
    }
    // 將使用者輸入的密碼 和 資料庫的做比對
    logger.info(`使用者資料: ${JSON.stringify(existingUser)}`);
    const isMatch = await bcrypt.compare(password , existingUser.password);
    if(!isMatch){
      logger.warn("使用者不存在 或 密碼錯誤");
      res.status(400).json({
        "status": "false",
        "message": "使用者不存在 或 密碼錯誤"
      });
      return;
    }
    // // 原本寫法 token ？？？
    // const token = await generateJWT({                       // 程式碼不太了解？
    //   id: existingUser.id                                   // payload : token 內存的資訊
    // }, config.get('secret.jwtSecret'), {                    // secret : 密鑰，存放於環境變數提高安全性
    //   expiresIn: `${config.get('secret.jwtExpiresDay')}`    // options : 包含 expiresIn（效期）
    // });

    // // 助教寫法
    console.log("錯誤嗎？？？？？？");
    const token = generateJWT({
      id: existingUser.id, 
      role: existingUser.role
    });
    console.log("正確嗎？？？？？？");


    logger.info(`登入成功：${email}`);
    res.status(200).json({
      "status": "true",
      "data": {
        "token": token,
        "name": existingUser.name,
      }
    });

  }catch(error){
    logger.error('登入錯誤:', error);
    next(error);
  }
});

router.get("/profile", auth, async(req, res, next)=>{
  try{
    const {id} = req.user;  // 為何 req.user 裡面有該 user 的資料呢？ 是因為先跑 auth 的 middleware 嗎？
    const user = await dataSource.getRepository("User").findOne({
      select: ["email", "name"],
      where: {id}
    });
    logger.info("取得使用者資料");
    res.status(200).json({
      "status": "true",
      "data": {
        "user": user
      }
    });
    const authHeader = req.headers.authorization;
    const tokenK = authHeader.split(' ')[1];
    // console.log(`authHeader---------------${authHeader}`);
    // console.log(`req.headers---------------${tokenK}`);
    // console.log(`-----------reqHeader--------:${req.headers}`);
  }catch(error){
    logger.error("取得使用者資料錯誤:", error);
    next(error);
  }

});

router.put("/profile", auth, async(req, res, next)=>{
  try{
    const {id} = req.user;
    const {name} = req.body;
    // 驗證使用者輸入的欄位
    if(isUndefined(name) || isNotValidString(name) ){
      logger.warn("欄位填寫錯誤");
      res.status(400).json({
      "status": "false",
      "message": "欄位填寫錯誤"
    });
      return;
    }
    // 驗證 auth 與 要更新的名稱是否不同
    const userRepo = dataSource.getRepository("User");
    const userFind= await userRepo.findOne({
      select: ["name"],
      where: {id}
    });
    if(name === userFind.name){
      logger.warn("使用者名稱未變更");
      res.status(400).json({
      "status": "false",
      "message": "使用者名稱未變更"
    });
      return;      
    }
    // 將要更新的資料寫入資料庫
    const userUpdate = await userRepo.update({
      "id": id,
      // "name": userFind.name,
    },{
      "name": name
    });
    if(userUpdate.affected === 0){
      logger.warn("使用者資料更新失敗");
      res.status(400).json({
        "status": "false",
        "message": "使用者資料更新失敗"
    });
      return;         
    }
    res.status(200).json({
      "status": "true",
      "message": "更新成功"
    });
  }catch(error){
    logger.error('更新使用者資料錯誤:', error);
    next(error);
  }
});

module.exports = router;