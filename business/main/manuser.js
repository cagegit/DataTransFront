/**
 * Created by wangsx on 2016/12/13.
 */
var dbExcute = require('db/dbObject.js');

var username = 'r7';
var password = 'r7';
var db_host = '192.168.88.118';
var db_port = 3306;
var db_name = 'dip';

var dbObject = {
    mysqlCn : 'DRIVER={mysqldriver};SERVER='+db_host+';UID='+username+';PWD='+password+';DATABASE='+db_name,
    oracleCn : 'DRIVER={oradriver};DBQ='+db_host+':'+db_port+'/'+db_name+';UID='+username+';PWD='+password
};

//用户登录校验
function dip_manuser_check_user(uname,upwd,auth) {
    var db = require("odbc")()
        , cn = dbObject.mysqlCn;
    var Q = require('q');

    var sql = 'select user_auth from user_manager where user_name = ? and user_pwd = ?';

    db.open(cn, function (err) {
        if (err) {
            return q.reject(err);
        }

        db.query(sql, [uname, upwd], function (err, data) {
        if (err) {
            console.log(err);
            db.close();
            return q.reject(err);
        }
          db.close(function () {
            console.log('done');
           });

            return q.reject(data);
        })
    })
}

module.exports={};