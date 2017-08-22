/**
 * Created by zcf on 2017/7/31.
 */

let util = require('util');
let expect = require('chai').expect;
let md5 = require('md5');
let syscfg = require('../syscfg');

util.inspect.styles = 'number';
util.inspect.colors = 'red';

describe('系统设置', function () {
    it('保存monitor信息save_reporter_conf', function () {
        let req = {
            body: {
                "request": {
                    "report_system": {
                        "task_identify": "a",
                        "monitor_ip": "172.16.1.57",
                        "monitor_port": "3000",
                        "monitor_interval": 30,
                        "free_disk_threshold": 20,
                        "capture_interval_threshold": "",
                        "unmonitored_group": [{"group": "grp1"}, {"group": "grp2"}]
                    }
                }
            }
        };

        req.body.md5 = md5(JSON.stringify(req.body.request));

        return syscfg.save_reporter_conf(req).then(function (result) {
            console.debug('====', util.inspect(result, null, null));
            expect(result).to.be.empty;
        });
    });

    it('查询monitor信息query_reporter_conf', function () {
        let req = {
            body: {
                "request": {}
            }
        };

        req.body.md5 = md5(JSON.stringify(req.body.request));

        return syscfg.query_reporter_conf(req).then(function (result) {
            console.debug('====', util.inspect(result, null, null));
            expect(result).to.be.an('object');
            expect(result).to.include.keys('report_system');
            expect(result.report_system).to.include.keys('monitor_disk_name');
        });
    });

    it('保存sender信息save_monitor_conf', function () {
        let req = {
            body: {
                "request": {
                    "monitor": {
                        "customer_name": "test",
                        "server_port": "8888",
                        "alert_type": "all",
                        "sms": {
                            "send_method": {"method": "default"},
                            "phone_number_list": [{"phone_number": "123"}, {"phone_number": "234"}]
                        },
                        "mail": {
                            "mail_server": "test@r7data.com",
                            "mail_port": "1234",
                            "user": "sb1",
                            "password": "RLkq2knt8Ks=",
                            "address_list": [{"address": "sb2@r7data.com"}, {"address": "sb3@r7data.com"}]
                        }
                    }
                }
            }
        };

        req.body.md5 = md5(JSON.stringify(req.body.request));

        return syscfg.save_monitor_conf(req).then(function (result) {
            console.debug('====', util.inspect(result, null));
            expect(result).to.be.empty;
        });
    });

    it('查询sender信息query_monitor_conf', function () {
        let req = {
            body: {
                "request": {}
            }
        };

        req.body.md5 = md5(JSON.stringify(req.body.request));

        return syscfg.query_monitor_conf(req).then(function (result) {
            console.debug('====', util.inspect(result, {depth:null, colors:'cyan'}));
            expect(result).to.be.an('object');
            expect(result).to.include.keys('monitor');
            expect(result.monitor).to.include.keys('customer_name');
        });
    });

});