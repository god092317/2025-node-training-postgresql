const express = require('express');

const router = express.Router();
const { dataSource } = require('../db/data-source');
const logger = require('../utils/logger')('Admin');
const {
  isUndefined,
  isNotValidInteger,
  isNotValidString,
  isValidPassword
} = require('../utils/validUtils'); 

// 新增教練課程資料：將課程資料由 req.body 寫入 Course 資料表，並且驗證欄位填寫是否正確
router.post('/coaches/courses', async (req, res, next) => {
  try {
    // 下面這行的意思？ 是從 req.body 中取得 user_id, skill_id, name, description, start_at, end_at, max_participants, meeting_url 這些欄位的值
    // 為何要用解構賦值？ 因為這樣可以讓程式碼更簡潔
    // 若不用解構賦值怎麼做？ 可以這樣做 const userId = req.body.user_id; const skillId = req.body.skill_id; const name = req.body.name; const description = req.body.description; const startAt = req.body.start_at; const endAt = req.body.end_at; const maxParticipants = req.body.max_participants; const meetingUrl = req.body.meeting_url;
    // 這樣做的話，程式碼會變得很長，不好閱讀
    const {
      user_id: userId,
      skill_id: skillId,
      name,
      description, 
      start_at: startAt, 
      end_at: endAt,
      max_participants: maxParticipants, 
      meeting_url: meetingUrl
    } = req.body;
    if (isUndefined(userId) || isNotValidString(userId) ||
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
    const userRepository = dataSource.getRepository('User');
    const existingUser = await userRepository.findOne({
      select: ['id', 'name', 'role'],
      where: { id: userId }
    });
    // userRepository.findOne 回傳的格式是什麼？ 是一個陣列物件，裡面包含了使用者的資料
    // existingUser 有可能是哪些值？ 有可能是 null 或者是物件
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
      "user_id": userId,
      "skill_id": skillId,
      name,
      description,
      "start_at": startAt,
      "end_at": endAt,
      "max_participants": maxParticipants,
      "meeting_url": meetingUrl
    });
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
    const { userId } = req.params; // 這行意思？ 是從 req.params 中取得 userId 的值
    // 為何要用解構賦值？ 因為這樣可以讓程式碼更簡潔
    // 若不用解構賦值怎麼做？ 可以這樣做 const userId = req.params.userId;
    // 這邊變數的名稱要都一樣嗎？ 是的，這邊變數的名稱要都一樣，因為這樣才能正確取得值
    // 這樣做的話，程式碼會變得很長，不好閱讀

    // 提取 body 中的資料，用解構賦值的方式
    const { 
      experience_years: experienceYears,
      description,
      profile_image_url: profileImageUrl = null  // 將 profile_image_url 改名成 profileImageUrl 並將值預設為 null
    } = req.body;

    // 驗證欄位填寫是否正確
    if (isUndefined(experienceYears) || isNotValidInteger(experienceYears) || isUndefined(description) || isNotValidString(description)) {
      logger.warn('欄位未填寫正確');
      res.status(400).json({
        status: 'failed',
        message: '欄位未填寫正確'
      });
      return;
    }
    // 驗證 profileImageUrl 是否為有效的網址
    if (profileImageUrl && !isNotValidString(profileImageUrl) && !profileImageUrl.startsWith('https')) {
      logger.warn('大頭貼網址錯誤');
      res.status(400).json({
        status: 'failed',
        message: '欄位未填寫正確'
      });
      return;
    }
    // 驗證 userId 是否為有效的 UUID
    const userRepository = dataSource.getRepository('User');
    const existingUser = await userRepository.findOne({
      select: ['id', 'name', 'role'],
      where: { id: userId }
    });
    if (!existingUser) {
      logger.warn('使用者不存在');
      res.status(400).json({
        status: 'failed',
        message: '使用者不存在'
      });
      return;
    } else if (existingUser.role === 'COACH') {
      logger.warn('使用者已經是教練');
      res.status(409).json({
        status: 'failed',
        message: '使用者已經是教練'
      });
      return;
    }
    // 將 body 的資料寫入 Coach 資料表
    const coachRepo = dataSource.getRepository('Coach');
    const newCoach = coachRepo.create({  // create 為何不用 await？
      user_id: userId,
      experience_years: experienceYears,
      description,
      profile_image_url: profileImageUrl
    });
    // 將 User 資料表的 role 欄位改為 COACH
    const updatedUser = await userRepository.update({
      id: userId,
      role: 'USER'
      }, {
      role: 'COACH'
    });
    if (updatedUser.affected === 0) {
      logger.warn('更新使用者失敗');
      res.status(400).json({
        status: 'failed',
        message: '更新使用者失敗'
      });
      return;
    }
    const savedCoach = await coachRepo.save(newCoach);
    const savedUser = await userRepository.findOne({
      select: ['name', 'role'],
      where: { id: userId }
    });
    res.status(201).json({
      status: 'success',
      data: {
        user: savedUser,
        coach: savedCoach
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
    const { courseId } = req.params; // req.params 是 Express.js 提供的物件，裡面包含了路由參數的值
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
      id: courseId
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