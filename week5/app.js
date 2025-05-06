const express = require('express');
// express 是什麼？是 Node.js 的一個框架，用來建立 Web 應用程式的
const cors = require('cors');
// cors 是什麼？就是在 Header 增加跨網域的那串東西 Access-Control-Allow-Origin
// CORS（Cross-Origin Resource Sharing）是一種瀏覽器的安全機制，用於限制網頁從不同來源請求資源。
const path = require('path');
// path 是什麼？是 Node.js 的內建模組，用來處理路徑的
// path.join(__dirname, 'public') 是什麼？是把 __dirname 和 public 這兩個路徑合併成一個路徑
// __dirname 是什麼？是 Node.js 的內建變數，代表目前檔案所在的路徑
// path.join(__dirname, 'public') 會回傳什麼？會回傳一個路徑，例如 /Users/username/project/public
const pinoHttp = require('pino-http');
// pino-http 是什麼？是用來記錄 HTTP 請求的日誌的
const logger = require('./utils/logger')('App');
// logger 是什麼？是用來記錄日誌的
const creditPackageRouter = require('./routes/creditPackage');
const skillRouter = require('./routes/skill');
const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
const coachRouter = require("./routes/coach");

const app = express();
app.use(cors());
app.use(express.json());
// express.json() 是什麼？是用來解析 JSON 格式的請求主體的
// 為何要用 express.json()？ 因為這樣可以讓伺服器能夠解析 JSON 格式的請求主體
app.use(express.urlencoded({ extended: false }));
// express.urlencoded() 是什麼？是用來解析 URL 編碼格式的請求主體的
// extended: false 是什麼？是用來指定解析的方式，false 代表使用 querystring 模組，true 代表使用 qs 模組
// querystring 模組是 Node.js 的內建模組，用來解析 URL 編碼格式的字串
app.use(pinoHttp({
  logger,
  serializers: {
    req (req) {
      req.body = req.raw.body;
      return req;
    }
  }
}));
app.use(express.static(path.join(__dirname, 'public')));
// express.static() 是什麼？是用來提供靜態檔案的
// 為何要用 express.static()？ 因為這樣可以讓伺服器能夠提供靜態檔案，例如圖片、CSS、JavaScript 等等
// path.join(__dirname, 'public') 是什麼？是把 __dirname 和 public 這兩個路徑合併成一個路徑

app.get('/healthcheck', (req, res) => {
  res.status(200);
  res.send('OK');
});
// 為何這邊不用 express.Router() ？ 因為這邊只是單純的健康檢查，不需要用到路由
// 為何這邊要用 app.get() ？ 因為這邊是用來處理 GET 請求的
// 為何這邊要用 res.status(200) ？ 因為這邊是用來回傳狀態碼的，200 代表請求成功
// 為何這邊要用 res.send('OK') ？ 因為這邊是用來回傳資料的，'OK' 代表請求成功

// 下面這行的意思？ 將 /api/credit-package 的 request 導入到 creditPackageRouter 來處理。
app.use('/api/credit-package', creditPackageRouter);
app.use('/api/skills', skillRouter); 
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use("/api/coaches", coachRouter);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  req.log.error(err);
  res.status(500).json({
    "status": "error",
    "message": "伺服器錯誤"
  });
});

module.exports = app;