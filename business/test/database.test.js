/**
 * Created by cagej on 2017/8/1.
 */
const database = require('../main/database');
const Pub = require('../common/public');
const md5 = require('md5');
const expect = require('chai').expect;
/*
 * database接口全部方法的测试
 * */
describe('database 接口 的测试', function() {
    "use strict";
    const res = {
        json: function (data) {
            return data;
        }
    };
    let group_id = global.groupId || '';
    let com_id = '';

    it.skip('query_all_db_info 正确执行返回字符串yes或者no', function () {
        let request = {group: group_id, sorcedb_name: 'ora62', targetdb_name: 'dest'};
        let body = {"md5": md5(JSON.stringify(request)),"request": request};
        return database.query_all_db_info(body, res).then(function (result) {
            console.info('mocha database query_all_db_info resolve----1');
            console.debug(result);
            let isDone = false;
            if(result.same ==='yes' || result.same === 'no') {
                isDone = true;
            }
            expect(isDone).to.be.true;
        });
    });
    it.skip('query_db_table 正确执行返回一个对象数组', function () {
        let request = {"db_type":"oracle","db_ip":"172.16.1.62","db_port":"1521","db_user":"nd_test_01","db_password":"aXuUAh34nXs=","db_id":"orcl"};
        let body = {"md5": md5(JSON.stringify(request)),"request": request};
        return database.query_db_table(body, res).then(function (result) {
            console.info('mocha database query_db_table resolve----1');
            console.debug(result);
            expect(result).to.be.an('object');
        });
    });
    describe('数据库保存或者查询', function () {
        it('save_db_info 新增或者修改db_info应该返回一个包含component_id的对象', function () {
            let request = {"group": group_id,"component_name":"ora62","db_type":"oracle","db_ip":"172.16.1.62","db_port":"1521","db_user":"nd_test_01",
                "db_password":"aXuUAh34nXs=","db_id":"orcl","as_source_db":"no","component_id": ''};
            let body = {"md5": md5(JSON.stringify(request)),"request": request};
            return database.save_db_info(body, res).then(function (result) {
                console.info('mocha database save_db_info resolve----1');
                console.debug(result);
                expect(result.component_id).to.equal(com_id);
                com_id = result.component_id;
                global.databaseId = com_id;
                global.databaseName = "ora62";
            });
        });
        it('query_db_info 应该返回一个对象或者抛出找不到db的错误', function() {
            let request = {group: group_id, component_id: com_id};
            let body = {"md5": md5(JSON.stringify(request)), "request": request};
            return database.query_db_info(body, res).then(function (result) {
                console.info('mocha database query_db_info resolve----2');
                console.debug(result);
                if (result.error_msg) {
                    expect(result.error_msg).to.equal('Can not find this dbInfo!');
                } else {
                    expect(result).to.include({group: group_id, component_id: com_id});
                }
            });
        });
    });

    describe('数据库模板测试', function () {
        let dbName = 'ora98';
        it('add_fav_db 保存模板成功应该返回SUCCESS', function () {
            let request = {"db_name": dbName,"db_type": "oracle","db_ip":"172.16.1.98","db_port":"1521","db_user":"nd_test_01","db_password":"iBxFcekUBm0=","db_id":"racdb","as_source_db":"yes"};
            let body = {"md5": md5(JSON.stringify(request)),"request": request};
            return database.add_fav_db(body, res).then(function (result) {
                console.info('mocha database add_fav_db resolve----3');
                console.debug(result);
                expect(result).to.equal('SUCCESS');
            });
        });
        it('query_fav_db 模板列表数组应该包含保存的数据库名称', function () {
            let body = {"md5": "99914b932bd37a50b983c5e7c90ae93b","request": {}};
            return database.query_fav_db(body, res).then(function (result) {
                console.info('mocha database query_fav_db resolve----3');
                console.debug(result);
                let isExist = false;
                if (result.fav_dbs && result.fav_dbs.db) {
                    result.fav_dbs.db.forEach(function (item) {
                       if (item.db_name === dbName) {
                           isExist = true;
                       }
                    });
                }
                expect(isExist).to.be.true;
            });
        });
        it('delete_fav_db 删除指定模板成功应该返回SUCCESS', function () {
            let request = {db_name: dbName};
            let body = {"md5": md5(JSON.stringify(request)),"request": request};
            return database.delete_fav_db(body, res).then(function (result) {
                console.info('mocha database delete_fav_db resolve----3');
                console.debug(result);
                expect(result).to.equal('SUCCESS');
            });
        });
    });

    describe('测试数据库连接及环境检查', function () {
        let requests = [{"db_type":"oracle","db_ip":"172.16.6.74","db_port":"1521","db_user":"scott","db_password": Pub.tdes('123456'),"db_id":"orcl"},
        {"db_type":"sqlserver","db_ip":"172.16.6.71","db_port":"1433","db_user":"sa","db_password": Pub.tdes('P@ssw0rd'),"db_id":"test"},
        {"db_type":"mysql","db_ip":"172.16.6.76","db_port":"3306","db_user":"test","db_password": Pub.tdes('test'),"db_id":"chang"},
        // {"db_type":"db2","db_ip":"172.16.6.80","db_port":"60000","db_user":"db2inst1","db_password": Pub.tdes('123456'),"db_id":"SAMPLE"}
        ];
        let isSource = 'yes';
        requests.forEach(function(item) {
            it('test_db_connection/'+item.db_type+' 应该返回SUCCESS', function () {
                let body = {"md5": md5(JSON.stringify(item)), "request": item};
                return database.test_db_connection(body, res).then(function (result) {
                    console.info('mocha database test_db_connection/'+item.db_type+' resolve');
                    console.debug(result);
                    expect(result).to.equal('SUCCESS');
                });
            });
            it('check_sourcedb_env/'+item.db_type+' 应该返回一个对象', function () {
                item.db_is_source = isSource;
                let body = {"md5": md5(JSON.stringify(item)), "request": item};
                return database.check_sourcedb_env(body, res).then(function (result) {
                    console.info('mocha database check_sourcedb_env/'+item.db_type+' resolve');
                    console.debug(result);
                    expect(result.archive_mode).to.exist;
                });
            });
        });
    });
});