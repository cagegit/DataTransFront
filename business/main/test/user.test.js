/**
 * Created by zcf on 2017/7/31.
 */

let expect = require('chai').expect;
let md5 = require('md5');
let usr = require('../user');
let util = require('util');

describe('用户管理测试', function () {
    it('添加用户 dip_manuser_save_user', function () {
        let req = {
            body: {
                request: {
                    user: "zhf2", passwd: "6/ZGfIjp72HIwUwJublvDA==", authority: "super", founder: "admin", type: "add"
                }
            }
        };

        req.body.md5 = md5(JSON.stringify(req.body.request));

        return usr.dip_manuser_save_user(req).then(function (result) {
            console.debug('====', util.inspect(result, null, null));
            expect(result).to.be.empty;
        });
    });

    it('删除用户 dip_manuser_save_user', function () {
        let req = {
            body: {
                request: {user: "zhf2", passwd: "", authority: "super", founder: "admin", type: "del"}
            }
        };

        req.body.md5 = md5(JSON.stringify(req.body.request));

        return usr.dip_manuser_save_user(req).then(function (result) {
            console.debug('====', util.inspect(result, null, null));
            expect(result).to.be.empty;
        });
    });

    it('更新用户 dip_manuser_save_user', function () {
        let req = {
            body: {
                request: {user: "zhf", passwd: "6Cn1mIrKFVKF+ZzECLBKuQ==", authority: "super", founder: "admin", type: "alter"}
            }
        };

        req.body.md5 = md5(JSON.stringify(req.body.request));

        return usr.dip_manuser_save_user(req).then(function (result) {
            console.debug('====', util.inspect(result, null, null));
            expect(result).to.be.empty;
        });
    });

    it('查询用户 dip_manuser_query_user', function () {
        let req = {
            body: {
                request: {founder: "admin"}
            }
        };

        req.body.md5 = md5(JSON.stringify(req.body.request));

        return usr.dip_manuser_query_user(req).then(function (result) {
            console.debug('====', util.inspect(result, null, null));
            expect(result).to.be.an('object');
            expect(result).to.include.keys('list');
        });
    });
})
;