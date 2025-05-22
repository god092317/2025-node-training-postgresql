const express = require('express');
const app = express();

// 某某人 的音樂列表，抓前10筆
app.get('/user/:names/',function(req,res){
    const myName = req.params.names;
    const limit = req.query.limit;
    const q = req.query.q;
    res.send('<html><head></head><body><h1>'
    +myName
    +'想要找關鍵字叫做'
    +q
    +'的資料，'
    +'是要找前'
    +limit
    +'筆資料'
    +'</h1></body></html>');  
});

app.get('/user/edit-photo',function(req,res){
    // res.send('1234');
    res.send('<html><head></head><body><h1>photo</h1></body></html>');
});

// 監聽 port
const port = process.env.PORT || 3000;
app.listen(port);



// 當你網址輸入 localhost:3000/user/tom?limit=30&q=hello，myName 會等於 tom、limit 會等於30、q 會等於 hello