/**
 * Created by zcf on 2017/7/26.
 */

'use strict';

let expect = require('chai').expect;
let path = require('path');
let md5 = require('md5');
let bak = require('../bakup');

describe('备份还原功能测试', function () {
    let file;
    it('备份会生成以.tar.gz为后缀的压缩包', function () {
        let req = {
            body: {
                request: {}
            }
        };

        req.body.md5 = md5(JSON.stringify(req.body.request));
        return bak.export_config(req)
            .then(function (result) {
                expect(result).to.be.an('object');
                expect(result).to.include.keys('filename');
                expect(path.extname(result.filename)).to.be.equal('.gz');
                file = result.filename;
            });
    });

    it('还原会将压缩包解压并执行文件中的sql脚本', function () {
        let req = {
            body: {
                request: {filename:file}
            }
        };

        req.body.md5 = md5(JSON.stringify(req.body.request));
        return bak.import_config(req)
            .then(function (result) {
                expect(result).to.be.empty;
            });
    });
});
