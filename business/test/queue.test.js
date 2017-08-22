/**
 * Created by cagej on 2017/8/3.
 */
const queue = require('../main/queue');
const expect = require('chai').expect;
const md5 = require('md5');
const xml2js = require('xml2js');
const xmlParserAttr = new xml2js.Parser({explicitArray: false, ignoreAttrs: true}); // xml -> json
describe('queue 接口的测试', function() {
    const res = {
        json: function (data) {
            return data;
        }
    };
    let projectId = '',groupId = 'group_270',dbComponentId = 'database_319', componentId = 'queue_321';
    // before(function() {
    //     // global.share = {
    //     //     projectId: '',
    //     //     groupId : ''
    //     // };
    // });
    describe('# 队列保存/修改测试', function () {
        it('save_queue_info 正确执行返回component_id', function() {
            let request = {"group_id": groupId,"component_name":"que2","queue_type":"file","size":128,"statis":"no","queue_save_hour":48,"component_id": componentId};
            let body ={"md5": md5(JSON.stringify(request)),"request": request};
            return queue.save_queue_info(body, res).then(function (result) {
                console.debug(result);
                expect(result.component_id).to.equal(componentId);
            });
        });
        it('query_queue_info 正确执行返回component_id', function() {
            let request = {"group_id": groupId,"component_id": componentId};
            let body ={"md5": md5(JSON.stringify(request)),"request": request};
            return queue.query_queue_info(body, res).then(function (result) {
                console.debug(result);
                if(!result) {
                    expect(result).to.be.an('array');
                }else {
                    expect(result).to.be.an('object');
                }
            });
        });
    });
    describe('# 队列统计测试', function () {
        it('query_queue_statis 正确执行返回undefined或者包含list的对象', function(done) {
            let body = `<dip_command><command>query_queue_statis</command><command_data><group>${groupId}</group><component_name>${componentId}</component_name>
                <full>yes</full><owner></owner><table></table><start_time>2007-01-01 00:00:00</start_time><end_time>2017-08-03 16:56:39</end_time><minute>no</minute> 
                <hour>no</hour><day>no</day><month>no</month><year>yes</year><object_type></object_type><sql_type></sql_type><interval>1</interval></command_data></dip_command>`;
            return xmlParserAttr.parseString(body, function (err, data) {
                if (err) {
                    console.error(err);
                } else {
                    return queue.query_queue_statis(data.dip_command.command_data, res).then(function (result) {
                        console.debug('mocha query_queue_statis resolve----');
                        console.debug(result);
                        if (!result) {
                            expect(result).to.be.undefined;
                        } else{
                            expect(result).to.have.property('list');
                        }
                        done();
                    });
                }
            });

        });

        it('query_queue_pkg 应该返回一个对象{page_num:string,list:array}', function (done) {
            let body = `<dip_command><command>query_queue_pkg</command><command_data><group>${groupId}</group><component_name>${componentId}</component_name>
                       <page_num>0</page_num><start_time></start_time><end_time></end_time><xid></xid></command_data></dip_command>`;
            return xmlParserAttr.parseString(body, function (err, data) {
                if (err) {
                    console.error(err);
                } else {
                    return queue.query_queue_pkg(data.dip_command.command_data, res).then(function (result) {
                        console.debug('mocha query_queue_statis resolve----');
                        console.debug(result);
                        expect(result).to.have.property('page_num');
                        expect(result).to.have.property('list');
                        done();
                    });
                }
            });
        });
        // 下面两个方法无实际测试数据
        it('delete_queue_pkg_statis 正确执行应该返回SUCCESS', function () {
            let request = {group_id: groupId,component_id: componentId, end_time: '2017-08-03', flag: true};
            let body ={"md5": md5(JSON.stringify(request)),"request": request};
            return queue.delete_queue_pkg_statis(body, res).then(function (result) {
                console.debug(result);
                expect(result).to.equal('SUCCESS');
            });
        });
        it('delete_queue_pkg_xid 正确执行应该返回SUCCESS', function (done) {
            let body = `<dip_command><command>delete_queue_pkg_xid</command><command_data><group>${groupId}</group><component_name>${componentId}</component_name>
                  <xid>1</xid></command_data></dip_command>`;
            xmlParserAttr.parseString(body, function (err, data) {
                if (err) {
                    console.error(err);
                } else {
                    return queue.delete_queue_pkg_xid(data.dip_command.command_data, res).then(function (result) {
                        console.debug(result);
                        expect(result).to.equal('SUCCESS');
                        done();
                    });
                }
            });
        });
    });
});