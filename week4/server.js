require("dotenv").config(); 
  // 載入 .env 檔案，讓程式可以使用裡面的環境變數。
  // 為何不用const dotenv = require("dotenv")，再用dotenv.config()呢？
  // 因為 dotenv.config() 會直接載入 .env 檔案，並且將裡面的環境變數加入到 process.env 中，所以不需要再用變數去接
const http = require("http");
const AppDataSource = require("./db");
  // 為何變數取名為AppDataSource？ 因為這個變數是用來連接資料庫的，所以取名為 AppDataSource
  // 若只輸入 require("./db") 會發生什麼事情？ 會發生錯誤，因為 require("./db") 會回傳一個物件，但是沒有用變數去接
  // 會回傳什麼物件？ 會回傳一個 DataSource 的物件。
  // 物件內容是什麼？ 是一個資料庫的連線設定。
const errHandle = require("./errorHandle");
function isUndefined (value) {
  return value === undefined;
}
function isNotValidString (value) {
  return typeof value !== "string" || value.trim().length === 0 || value === "";
  // value.trim()是什麼意思？ 是把字串前後的空白字元去掉
  // 這邊為什麼要用 typeof value !== "string"？ 因為這樣可以避免使用者輸入非字串的資料
  // 這邊為什麼要用 value.trim().length === 0 ？ 因為這樣可以避免使用者只輸入空白字元
  // 這邊為什麼要用 value === "" ？ 因為這樣可以避免使用者只輸入空字串
}
function isNotValidInteger (value) {
  return typeof value !== "number" || value < 0 || value % 1 !== 0;
  // 這邊為什麼要用 value < 0 ？ 因為這樣可以避免使用者輸入負數
  // 這邊為什麼要用 value % 1 !== 0 ？ 因為這樣可以避免使用者輸入小數
}

const requestListener = async (req, res) => {
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Content-Length, X-Requested-With",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PATCH, POST, GET,OPTIONS,DELETE",
    "Content-Type": "application/json"
  }
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  if (req.url === "/api/credit-package" && req.method === "GET") {
    try { 
      // 為何這邊要用try catch? 因為這邊是一個非同步的函式，如果資料庫端有錯誤發生，會被拋出到外層，而外層沒有處理錯誤的話，會造成程式中斷  
      // 為何這邊要用await? 因為這邊是一個非同步的函式，await 會等待這個函式執行完，才會繼續執行下面的程式碼
      // 以下程式碼的意思是，從資料庫中取得 CreditPackage 的資料，並且只取得 id, name, credit_amount, price 四個欄位的資料
      const packages = await AppDataSource.getRepository("CreditPackage").find({ 
        select: ["id", "name", "credit_amount", "price"]
      });
      res.writeHead(200, headers);
      res.write(JSON.stringify({
        // JSON.stringify() 是什麼？ 是把物件轉換成 JSON 字串
        // 為何要轉換成 JSON 字串？ 因為這樣才能傳送到前端
        // 若少了 JSON.stringify() 會發生什麼事情？ 會發生錯誤，因為 res.write() 只能傳送字串，不能傳送物件
        "status" : "success",
        "data" : packages
      }));
      res.end();
    } catch (error) {
      errHandle(res);
    }
  } else if (req.url === "/api/credit-package" && req.method === "POST") {
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        // JSON.parse() 是什麼？ 是把 JSON 字串轉換成物件
        // 為何要轉換成物件？ 因為這樣才能使用物件中的屬性
        // 若少了 JSON.parse() 會發生什麼事情？ 會發生錯誤，因為 body 是一個字串，不能直接使用物件中的屬性
        // POST防呆1：驗證資料格式是否正確
        if (isUndefined(data.name) || isNotValidString(data.name) ||
            isUndefined(data.credit_amount) || isNotValidInteger(data.credit_amount) ||
            isUndefined(data.price) || isNotValidInteger(data.price)) {
          res.writeHead(400, headers)
          res.write(JSON.stringify({
            "status" : "failed",
            "message" : "欄位未填寫正確"
          }));
          res.end();
          return; // 為何這邊要用return? 因為如果欄位未填寫正確，就不需要繼續執行下面的程式碼
                  // 跑完 return 後會結束這個函式，那接下來跑哪個函式呢? 會跑到 req.on("end", async () => { 這個函式
                  // 那這邊把 return 拿掉會怎樣? 如果欄位未填寫正確，會繼續執行下面的程式碼，但是這樣會造成錯誤
        }
        // POST防呆2：比對資料庫資料是否重複
        // 下面這行的意思是？ 從資料庫中取得 CreditPackage 的資料，並且只取得 name 欄位的資料
        const creditPackageRepo = await AppDataSource.getRepository("CreditPackage");
        const existPackage = await creditPackageRepo.find({
          // 這邊的 where 是什麼意思？ 是一個條件，這個條件是指 name 欄位的值要等於 data.name
          where : {
            "name" : data.name
          }
        });
        // 為什麼 existPackage.length > 0 代表資料重複？ 因為如果資料庫中有相同的 name 欄位的資料，就會回傳一個陣列，陣列的長度就會大於 0
        if (existPackage.length > 0) {
          res.writeHead(409, headers)
          res.write(JSON.stringify({
            "status" : "failed",
            "message" : "資料重複"
          }));
          res.end();
          return; //return結束後會跑哪個程式碼嗎? 會跑到 req.on("end", async () => { 這個函式
        }
        const newPackage = await creditPackageRepo.create({
          "name" : data.name,
          "credit_amount" : data.credit_amount,
          "price" : data.price
          // id 和 create_at 這兩個欄位是怎麼處理的？ id 是主鍵，會自動生成，create_at 是時間戳記，會自動生成
          // 不用寫什麼代碼就會自動生成嗎？ 是的，因為在 CreditPackage 的 EntitySchema 中有設定
          // 若price也沒有賦值，會自動生成嗎？ 不會，因為在 EntitySchema 中有設定 nullable: false
          // 那為何 create_at 會自動生成？ 因為在 EntitySchema 中有設定 createDate: true
          // 那為何 id 會自動生成？ 因為在 EntitySchema 中有設定 generated: "uuid"
        });
        const result = await creditPackageRepo.save(newPackage);
        // 為何要定義一個 result 變數？ 因為 save 會回傳一個 promise，這個 promise 會回傳一個 CreditPackage 的物件
        // 為何要用 await? 因為 save 是一個非同步的函式，await 會等待這個函式執行完，才會繼續執行下面的程式碼
        res.writeHead(200, headers);
        res.write(JSON.stringify({
          "status" : "success",
          "data" : result
        }));
        res.end();
      } catch (error) {
        errHandle(res);
      }
    });
  } else if (req.url.startsWith("/api/credit-package/") && req.method === "DELETE") {
    try {
      const packageId = req.url.split("/").pop();
      // 為何要用 split("/") ? 因為這樣可以把 url 拆成一個陣列，然後取最後一個元素
      // 為何要用 pop() ? 因為這樣可以取出陣列的最後一個元素
      // 為何要用 packageId ? 因為這樣可以取得 url 中的 id
      // 為何要用 req.url ? 因為這樣可以取得 url
      // 為何要用 startsWith("/api/credit-package/") ? 因為這樣可以判斷 url 是否以 /api/credit-package/ 開頭
      if (isUndefined(packageId) || isNotValidString(packageId)) {
        res.writeHead(400, headers);
        res.write(JSON.stringify({
          "status" : "failed",
          "message" : "ID錯誤"
        }));
        res.end();
        return;
      }
      const result = await AppDataSource.getRepository("CreditPackage").delete(packageId);
      if (result.affected === 0) {
        // 這邊的 result.affected === 0 代表什麼？ 代表沒有刪除到任何資料
        // 為什麼代表沒有刪除到任何資料？ 因為 delete 會回傳一個物件，這個物件有一個 affected 的屬性，這個屬性代表刪除到幾筆資料
        // 那為何要判斷 result.affected === 0？ 因為如果沒有刪除到任何資料，就代表 ID 錯誤  
        res.writeHead(400, headers);
        res.write(JSON.stringify({
          "status" : "failed",
          "message" : "ID錯誤"
        }));
        res.end();
        return;
      }
      res.writeHead(200, headers);
      res.write(JSON.stringify({
        "status" : "success"
      }));
      res.end();
    } catch (error) {
      console.error(error);
      res.writeHead(500, headers);
      res.write(JSON.stringify({
        "status" : "error",
        "message" : "伺服器錯誤"
      }));
      res.end();
    }
  } else if (req.url === "/api/coaches/skill" && req.method === "GET"){
    try {
      const skill = await AppDataSource.getRepository("Skill").find({
        select : ["id", "name"]
      });
      res.writeHead(200, headers);
      res.write(JSON.stringify({
        "status" : "success",
        "data" : skill
      }));
      res.end();
    } catch (error) {
      errHandle(res);
    }
  } else if (req.url === "/api/coaches/skill" && req.method === "POST"){
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        if (isUndefined(data.name) || isNotValidString(data.name)) {
          res.writeHead(400, headers)
          res.write(JSON.stringify({
            "status" : "failed",
            "message" : "欄位未填寫正確"
          }));
          res.end();
          return;
        }
        const skillRepo = await AppDataSource.getRepository("Skill");
        const existSkill = await skillRepo.find({
          "where" : {
            "name" : data.name
          }
        })
        if (existSkill.length > 0) {
          res.writeHead(409, headers)
          res.write(JSON.stringify({
            "status" : "failed",
            "message" : "資料重複"
          }));
          res.end();
          return;
        }
        const newSkill = await skillRepo.create({
          "name" : data.name,
        });
        const result = await skillRepo.save(newSkill);
        res.writeHead(200, headers);
        res.write(JSON.stringify({
          "status" : "success",
          "data" : result
        }));
        res.end();
      } catch (error) {
        errHandle(res);
      }
    });
  } else if (req.url.startsWith("/api/coaches/skill") && req.method === "DELETE"){
    try {
      const skillId = req.url.split("/").pop();
      if (isUndefined(skillId) || isNotValidString(skillId)) {
        res.writeHead(400, headers);
        res.write(JSON.stringify({
          "status" : "failed",
          "message" : "ID錯誤"
        }));
        res.end();
        return;
      }
      const result = await AppDataSource.getRepository("Skill").delete(skillId);
      if (result.affected === 0) {
        res.writeHead(400, headers);
        res.write(JSON.stringify({
          "status" : "failed",
          "message" : "ID錯誤"
        }));
        res.end();
        return;
      }
      res.writeHead(200, headers);
      res.write(JSON.stringify({
        "status" : "success"
      }));
      res.end();
    } catch (error) {
      errHandle(res);
    }
  } else if (req.method === "OPTIONS") {
    res.writeHead(200, headers);
    res.end();
  } else {
    res.writeHead(404, headers)
    res.write(JSON.stringify({
      "status" : "failed",
      "message" : "無此網站路由"
    }));
    res.end();
  }
}
const server = http.createServer(requestListener);

async function startServer () {
  await AppDataSource.initialize();
  console.log("資料庫連接成功");
  server.listen(process.env.PORT);
  console.log(`伺服器啟動成功, port: ${process.env.PORT}`);
  return server;
}

module.exports = startServer();
// 若沒有以上這行會怎樣？ 會導致這個檔案無法被引入
// 在哪有被引入這個檔案？ 在 index.js 中，index.js 在哪？ 在根目錄下
// 我找不到耶？ 這個檔案是被隱藏的，所以你找不到