const express = require('express');
const router = express.Router();
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('Admin');
const {               // 解構賦值的寫法，因為這樣可以讓程式碼更簡潔
  isUndefined,        // 寫法等同於 const isundefined = require('../utils/validUtils').isUndefined; -
  isNotValidInteger,  // const isNotValidInteger = require('../utils/validUtils').isNotValidInteger; 
  isNotValidString,
  isValidPassword
} = require('../utils/validUtils'); 

console.log("routesAdmin 0-------------------");
// 新增教練課程資料：將課程資料由 req.body 寫入 Course 資料表，並且驗證欄位填寫是否正確
router.post('/coaches/courses', async (req, res, next) => {
  try {
    const {
      user_id: userId,    // 將 req.body.user_id 賦值給 user_id 並改名為 userId
      skill_id: skillId,  // 將 req.body.skill_id 賦值給 skill_id 並改名為 skillId
      name,               // 將 req.body.name 賦值給 name
      description,        // 將 req.body.description 賦值給 description
      start_at: startAt, 
      end_at: endAt,
      max_participants: maxParticipants, 
      meeting_url: meetingUrl
    } = req.body;   // 這是解構賦值的寫法，寫法等同於 const userId = req.body.user_id; const name = req.body.name

    if (isUndefined(userId) || isNotValidString(userId) ||
      isUndefined(skillId) || isNotValidString(skillId) ||
      isUndefined(name) || isNotValidString(name) ||
      isUndefined(description) || isNotValidString(description) ||
      isUndefined(startAt) || isNotValidString(startAt) ||
      isUndefined(endAt) || isNotValidString(endAt) ||
      isUndefined(maxParticipants) || isNotValidInteger(maxParticipants) ||
      isUndefined(meetingUrl) || isNotValidString(meetingUrl) || !meetingUrl.startsWith('https')) {
      logger.warn('欄位未填寫正確');  // logger 怎麼使用呢？
      res.status(400).json({
        "status": "failed",
        "message": "欄位未填寫正確"
      });
      return;
    }
    const userRepository = dataSource.getRepository('User');
    const existingUser = await userRepository.findOne({
      select: ['id', 'name', 'role'],
      where: { id: userId }
    });
    // 若 userRepository.findOne 有從資料表 User 找到欄位 id = userId 的使用者，則會回傳一個物件，裡面包含了使用者的資料（欄位 id, name, role）
    // 若 userRepository.findOne 沒從資料表 User 找到欄位 id = userId 的使用者，則會回傳 null

    if (!existingUser) {
      logger.warn('使用者不存在');
      res.status(400).json({
        "status": "failed",
        "message": "使用者不存在"
      });
      return;
    } else if (existingUser.role !== 'COACH') {
      logger.warn('使用者尚未成為教練');
      res.status(400).json({
        "status": "failed",
        "message": "使用者尚未成為教練"
      });
      return;
    }
    const courseRepo = dataSource.getRepository('Course');
    const newCourse = courseRepo.create({ // create 為何不用 await？ 因為這邊只是建立一個新的物件，並不需要等待
      "user_id": userId,      // 將 userId 的值賦值給 user_id 這個欄位
      "skill_id": skillId,    
      name,                   // 將 name 的值賦值給 name 這個變數
      description,
      "start_at": startAt,
      "end_at": endAt,
      "max_participants": maxParticipants,
      "meeting_url": meetingUrl
    });
    // console.log("newCourse", newCourse);
    const savedCourse = await courseRepo.save(newCourse);
    const course = await courseRepo.findOne({
      where: { id: savedCourse.id }
    });
    res.status(201).json({
      status: 'success',
      data: {
        course
      }
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

// 將使用者新增為教練：將 userId 的使用者轉成教練身份，也就是將 USER 資料表的 role 欄位由 USER 改成 COACH，並在 COACH 資料表中新增一筆資料
router.post('/coaches/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;  // 寫法等同於 const userId = req.params.userId;
    const {   // 提取 body 中的資料，用解構賦值的方式
      experience_years: experienceYears,
      description,
      profile_image_url: profileImageUrl = null  // 將 profile_image_url 改名成 profileImageUrl 並將值預設為 null
    } = req.body;

    // 驗證欄位填寫是否正確
    if (isUndefined(experienceYears) || isNotValidInteger(experienceYears) || 
        isUndefined(description) || isNotValidString(description)) {
      logger.warn('欄位未填寫正確');
      res.status(400).json({
        "status": "failed",
        "message": "欄位未填寫正確"
      });
      return;
    }
    // 驗證 profileImageUrl 是否為有效的網址
    if (profileImageUrl && !isNotValidString(profileImageUrl) && !profileImageUrl.startsWith('https')) {
      logger.warn('大頭貼網址錯誤');
      res.status(400).json({
        "status": "failed",
        "message": "欄位未填寫正確"
      });
      return;
    }
    // 驗證 userId 是否為有效的 UUID
    const userRepository = dataSource.getRepository('User');
    const existingUser = await userRepository.findOne({ 
      // 什麼時候用 find 什麼時候用 findOne？
      // find 是用來查詢多筆資料，findOne 是用來查詢單筆資料
      // 當 findOne有找到資料時，會回傳一個物件；沒有找到資料時，會回傳 null
      // 當 find 有找到資料時，會回傳一個陣列；沒有找到資料時，會回傳一個空陣列
      select: ['id', 'name', 'role'], // 若沒有這行的話，會將 User 資料表的所有欄位都列出來
      where: { id: userId } // 這邊的 where 是用來篩選資料的，篩選條件是 User 資料表的欄位 id = userId
    });
    if (!existingUser) {
      logger.warn('使用者不存在');
      res.status(400).json({
        "status": "failed",
        "message": "使用者不存在"
      });
      return;
    } else if (existingUser.role === 'COACH') {
      logger.warn('使用者已經是教練');
      res.status(409).json({
        "status": "failed",
        "message": "使用者已經是教練"
      });
      return;
    }
    // 將 User 資料表的 role 欄位改為 COACH
    const updatedUser = await userRepository.update({ // 這邊 update 的語法不熟？
      "id": userId,
      "role": "USER"
      }, {
      "role": "COACH"
    });
    if (updatedUser.affected === 0) { // .affected 會是一個數字，表示有多少筆資料被更新了
      logger.warn('更新使用者失敗');
      res.status(400).json({
        "status": "failed",
        "message": "更新使用者失敗"
      });
      return;
    }
    // 將 body 的資料寫入 Coach 資料表
    const coachRepo = dataSource.getRepository('Coach');
    const newCoach = coachRepo.create({
      "user_id": userId,
      "experience_years": experienceYears,
      description,
      "profile_image_url": profileImageUrl
    });
    const savedCoach = await coachRepo.save(newCoach);
    const savedUser = await userRepository.findOne({
      select: ['name', 'role'],
      where: { id: userId }
    });
    res.status(201).json({
      "status": "success",
      "data": {
        "user": savedUser,
        "coach": savedCoach
      }
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

// 編輯教練課程資料：將課程資料由 req.params 更新至 Course 資料表，並且驗證欄位填寫是否正確
router.put('/coaches/courses/:courseId', async (req, res, next) => {
  try {
    const { courseId } = req.params; // 寫法等同於 const courseId = req.params.courseId;
    const {
      "skill_id": skillId,
      name,
      description, 
      "start_at": startAt, 
      "end_at": endAt,
      "max_participants": maxParticipants, 
      "meeting_url": meetingUrl
    } = req.body;
    if (isNotValidString(courseId) ||
      isUndefined(skillId) || isNotValidString(skillId) ||
      isUndefined(name) || isNotValidString(name) ||
      isUndefined(description) || isNotValidString(description) ||
      isUndefined(startAt) || isNotValidString(startAt) ||
      isUndefined(endAt) || isNotValidString(endAt) ||
      isUndefined(maxParticipants) || isNotValidInteger(maxParticipants) ||
      isUndefined(meetingUrl) || isNotValidString(meetingUrl) || !meetingUrl.startsWith('https')) {
      logger.warn('欄位未填寫正確');
      res.status(400).json({
        "status": "failed",
        "message": "欄位未填寫正確"
      });
      return;
    }
    const courseRepo = dataSource.getRepository('Course');
    const existingCourse = await courseRepo.findOne({
      where: { id: courseId }
    });
    if (!existingCourse) {
      logger.warn('課程不存在');
      res.status(400).json({
        "status": "failed",
        "message": "課程不存在"
      });
      return;
    }
    const updateCourse = await courseRepo.update({
      "id": courseId
    }, {
      "skill_id": skillId,
      name,
      description,
      "start_at": startAt,
      "end_at": endAt,
      "max_participants": maxParticipants,
      "meeting_url": meetingUrl
    });
    if (updateCourse.affected === 0) {
      logger.warn('更新課程失敗');
      res.status(400).json({
        "status": "failed",
        "message": "更新課程失敗"
      });
      return;
    }
    const savedCourse = await courseRepo.findOne({
      where: { id: courseId }
    });
    res.status(200).json({
      "status": "success",
      "data": {
        "course": savedCourse
      }
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

module.exports = router;