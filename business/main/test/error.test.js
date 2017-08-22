/**
 * Created by zcf on 2017/7/27.
 */

let path = require('path');
let md5 = require('md5');
let expect = require('chai').expect;
let xml2js = require('xml2js');
let xmlParser = new xml2js.Parser({explicitArray: false, ignoreAttrs: true}); // xml -> json
let xmlParserAttr = new xml2js.Parser({explicitArray: false, ignoreAttrs: false}); // xml -> json

let err = require('../error');

describe('错误相关接口测试', function () {
    it('获取全部错误信息', function (done) {
        let xml = '<dip_command><command>query_apply_full_error</command><command_data><group>group_1</group><component_name>apply_2</component_name><owner></owner><object></object><action></action><page_num>1</page_num><mark_flag>0</mark_flag><start_time></start_time><end_time></end_time></command_data></dip_command>';

        xmlParserAttr.parseString(xml, function (error, result) {
            if (error) {
                console.error(error);
            } else {
                err.query_apply_full_error(result.dip_command.command_data).then(function (result) {

                    console.log('====', result);
                    expect(result).to.be.an('object');
                    expect(result).to.include.keys('all_num');
                    expect(result).to.include.keys('all_num');
                    done();
                });
            }
        });
    });

    it('获取当前错误信息', function (done) {
        let xml = '<dip_command><command>query_apply_current_error</command><command_data><group>group_1</group><component_name>apply_2</component_name></command_data></dip_command>';

        xmlParserAttr.parseString(xml, function (error, result) {
            if (error) {
                console.error(error);
            } else {
                err.query_apply_current_error(result.dip_command.command_data).then(function (result) {

                    console.log('====', result);
                    expect(result).to.be.an('object');
                    expect(result).to.include.keys('time');
                    expect(result).to.include.keys('owner');
                    done();
                }, function (err) {
                    console.error(err);
                });
            }
        });
    });

    it('标识错误信息', function (done) {
        let xml = '<dip_command><command>marked_apply_error</command><command_data><group>group_1</group><component_name>apply_2</component_name><location><offset></offset></location></command_data></dip_command>';

        xmlParserAttr.parseString(xml, function (error, result) {
            if (error) {
                console.error(error);
            } else {
                err.marked_apply_error(result.dip_command.command_data).then(function (result) {

                    console.log('====', result);
                    expect(result).to.be.empty;
                    done();
                }, function (err) {
                    console.error(err);
                });
            }
        });
    });

    it('导出错误信息到excel表格', function (done) {
        let xml = '<dip_command><command>download_error_file</command><command_data><group>group_1</group><component_name>apply_2</component_name></command_data></dip_command>';

        xmlParserAttr.parseString(xml, function (error, result) {
            if (error) {
                console.error(error);
            } else {
                err.download_error_file(result.dip_command.command_data).then(function (result) {

                    console.log('====', result);
                    expect(result).to.be.an('object');
                    expect(result).to.include.keys('file_path');
                    expect(path.extname(result.file_path)).to.be.equal('.csv');
                    done();
                }, function (err) {
                    console.error(err);
                });
            }
        });
    });

    it('导出错误信息到.gz', function () {
        let req = {
            body: {
                request: {}
            }
        };

        req.body.md5 = md5(JSON.stringify(req.body.request));

        return err.exp_err(req).then(function (result) {
            console.log('====', result);
            expect(result).to.be.an('object');
            expect(result).to.include.keys('filename');
            expect(path.extname(result.filename)).to.be.equal('.gz');
        });
    });
});

