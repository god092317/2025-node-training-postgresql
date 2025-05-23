const express = require('express');// express 是什麼？是 Node.js 的一個框架，用來建立 Web 應用程式的
const cors = require('cors');// cors 就是在 Header 增加跨網域的那串東西，是一種瀏覽器安全機制，用於限制網頁從不同來源請求資源
const path = require('path');// path 是什麼？是 Node.js 的內建模組，用來處理路徑的
const pinoHttp = require('pino-http');// pino-http 是什麼？是用來記錄 HTTP 請求的日誌的
console.log("App 0-------------------");
const logger = require('./utils/logger')('App');// logger 是什麼？是用來記錄日誌的

// 宣告並導入路由模組
const creditPackageRouter = require('./routes/creditPackage');
const skillRouter = require('./routes/skill');
const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
const coachesRouter = require("./routes/coaches");

const app = express();
app.use(cors());
app.use(express.json());
// express.json() 是什麼？是用來解析 JSON 格式的請求主體
// 為何需要使用？ 因為這樣可以讓伺服器能夠解析 JSON 格式的請求主體
// 缺少這段會發生什麼問題？ 如果沒有這段，伺服器就無法解析 JSON 格式的請求主體，會導致請求失敗
// 意思是就無法解析 req.body 了嗎？ 是的，req.body 會是 undefined

app.use(express.urlencoded({ extended: false }));
// express.urlencoded() 是什麼？是用來解析 URL 編碼格式的請求主體的
// 缺少這段會發生什麼問題？ 如果沒有這段，伺服器就無法解析 URL 編碼格式的請求主體，會導致請求失敗
// 意思是無法解析 req.url嗎？ 是的，req.url 會是 undefined

app.use(express.static(path.join(__dirname, 'public')));
// ???
// express.static() 是什麼？是用來提供靜態檔案的
// 為何要用 express.static()？ 因為這樣可以讓伺服器能夠提供靜態檔案，例如圖片、CSS、JavaScript 等等
// path.join(__dirname, 'public') 是什麼？是把 __dirname 和 public 這兩個路徑合併成一個路徑
// 實體的檔案放在 public 資料夾內


app.use(pinoHttp({
  logger,
  serializerç: {
    req (req) {
      req.body = req.raw.body;
      return req;
    }
  }
}));
// ???  

app.get('/healthcheck', (req, res) => { 
  res.status(200);
  res.send('OK');
});
console.log("APP 1-------------------");
// 將 url 路徑的 request 導入到 對應的路由來處理。
app.use('/api/credit-package', creditPackageRouter);
app.use('/api/skill', skillRouter); 
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use("/api/coaches", coachesRouter);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  req.log.error(err);
  res.status(500).json({
    "status": "error",
    "message": "伺服器錯誤"
  });
});
// ???

module.exports = app;