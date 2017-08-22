/**
 * Created by cage on 2016/9/14.
 */
'use strict';
var net = require('net');
var xml2js = require('xml2js');
var Q = require('q');
var xmlParser = new xml2js.Parser({explicitArray : false, ignoreAttrs : true}); // xml -> json
var xmlParserAttr = new xml2js.Parser({explicitArray : false, ignoreAttrs : false}); // xml -> json
var HOST = '127.0.0.1';
var PORT = 7009;
function getXmlResult(xml,req,res) {
    if(req.app.get('sys_cfg')){
        PORT = req.app.get('sys_cfg').manager_port;
    }
    if(!xml){
        var msg = {command_return:"ERROR",return_data:{error_message:"xml not define!"}};
        res.json(msg);
        return;
    }
    var client = new net.Socket();
    var buffer='',timeout=5000,count=0;//超时5000ms
    client.connect(PORT, HOST, function() {
        client.write(xml);
    });
    // client.setTimeout(timeout);
    // data是服务器发回的数据
    client.on('data', function(data) {
        buffer+=data.toString();
        if(count===0){
            if(!buffer || (buffer.indexOf('<dip_command>')<0)){
                client.end();
                return;
            }
        }
        if(buffer.lastIndexOf('</dip_command>')>=0){
            client.end();
        }
        count++;
    });
    client.on('error',function(err){
        var msg = {command_return:"ERROR",return_data:{error_message:"socket manager error!"}};
        res.json(msg);
        // 完全关闭连接
        client.destroy();
    });
    // 为客户端添加“close”事件处理函数
    client.on('close', function() {
        client.destroy();
    });
    client.on('end',function(){
        var msg ={command_return:"ERROR",return_data:{error_message:'tcp client XML parse error'}};
        if(count===0){
              res.json({command_return:"ERROR",return_data:{error_message:'Data format is wrong form manager!'}});
        }else{
            if(xml.indexOf('query_db_table')>=0){
                xmlParserAttr.parseString(buffer,function (err, result) {
                   if(err){
                        res.json(msg);
                   }else{
                        res.json(result.dip_command);     
                   }
                });
            }else{
                xmlParser.parseString(buffer,function (err, result) {
                   if(err){
                        res.json(msg);
                   }else{
                        res.json(result.dip_command);     
                   }
                });
            }
        }
        client.destroy();
    });
}
function getJson(xml,port) {
    var q = Q.defer();
    var client = new net.Socket();
    var buffer='',count=0;
    client.setTimeout(5000);
    client.connect(port, HOST, function() {
        client.write(xml);
    });
    client.on('data', function(data) {
        buffer+=data.toString();
        if(count===0){
            if(!buffer || (buffer.indexOf('<dip_command>')<0)){
                q.reject({err:'Data format err from manager'});
                client.destroy();
                return;
            }
        }
        if(buffer.lastIndexOf('</dip_command>')>0){
            xmlParser.parseString(buffer,function (err, result) {
                if(err)  throw err;
                q.resolve(result.dip_command);
            });
            client.destroy();
        }
        count++;
    });
    client.on('error',function(err){
        q.reject({err:'socket err'});
        client.destroy();
    });
    // 为客户端添加“close”事件处理函数
    client.on('close', function() {
        client.destroy();
    });
    client.on('timeout',function(err){
        q.reject({err:'timeout'});
        client.destroy();
    });
    return q.promise;
}

var tcpClient = {
    getXml:getXmlResult,
    getJson:getJson
};

//导出对象
module.exports = tcpClient;