var express = require('express');
var app = express();

// 某某人 的音樂列表，抓前10筆
app.get('/user/:name/',function(req,res){
    var myName = req.params.name;
    var limit = req.query.limit;
    var q = req.query.q;
    res.send('<html><head></head><body><h1>'
    +myName
    +'想要找關鍵字叫做'
    +q
    +'的資料，'
    +'是要找前'
    +limit
    +'筆資料'
    +'</h1></body></html>')
       
    
})

app.get('/user/edit-photo',function(req,res){
    // res.send('1234');
    res.send('<html><head></head><body><h1>photo</h1></body></html>')
})

// 監聽 port
var port = process.env.PORT || 3000;
app.listen(port);