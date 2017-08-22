/**
 * Created by cage on 2016/11/7.
 */
'use strict';
const xml2js = require('xml2js');
const xmlParser = new xml2js.Parser({explicitArray : false, ignoreAttrs : true});
const fs = require('fs');
const path = require('path');
//读取Etc目录下的dip_config配置信息
let sys_cfg_path = process.env['DIP_HOME']+'/etc/dip_config.xml';
let mysql_path=process.env['DIP_HOME'] + '/mysql/my.cnf';
let config='',port=3306;
let json_cfg ={
    transfer_port:7007,
    http_port:7008,
    manager_port:7009,
    mysql_port:3306
};
let isCz=fs.existsSync(sys_cfg_path);
if(isCz){
    config = fs.readFileSync(sys_cfg_path).toString();
}
let isMs=fs.existsSync(mysql_path);
if(isMs){
    let data = fs.readFileSync(mysql_path).toString();
    let arr =data.toString().split('\n');
    for(let i=0;i<arr.length;i++){
        if(arr[i].indexOf('port')>=0){
            let pp=parseInt(arr[i].replace(/(^port.*=)/,''));
            if(typeof(pp)==='number' && isFinite(pp)){
                json_cfg.mysql_port=pp;
            }
        }
    }
}
xmlParser.parseString(config,function (err, data) {
    if(err){
        console.log(err);
    }else{
        if(data && data.dip_config && data.dip_config.system){
            let cfg = data.dip_config.system;
            json_cfg.http_port= cfg.http_port;
            json_cfg.manager_port = cfg.manager_port;
            json_cfg.transfer_port = cfg.transfer_port;
        }
    }
});
//导出对象
module.exports = json_cfg;