var express = require('express');
var app = express();

app.get('/user/:name/',function(req,res){
    var myName = req.params.name;
    if(myName !== 'tom'){
        res.send('<html><head></head><body><h1>'+'查無此人'+'</h1></body></html>')
    }else{
        res.send('<html><head></head><body><h1>'+myName+'</h1></body></html>')
    }
    
})

app.get('/user/edit-photo',function(req,res){
    // res.send('1234');
    res.send('<html><head></head><body><h1>photo</h1></body></html>')
})

// 監聽 port
var port = process.env.PORT || 3000;
app.listen(port);