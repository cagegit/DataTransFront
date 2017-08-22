/**
 * Created by cagej on 2017/8/3.
 */
const transfer = require('../main/transfer');
const expect = require('chai').expect;
const md5 = require('md5');
const Pub = require('../common/public');
describe('transfer 接口测试', function() {
    const res = {
        json: function (data) {
            return data;
        }
    };
    let projectId = '', groupId = 'group_270', dbComponentId = 'database_319', componentId = 'queue_321';
    // before(function() {
    //     // global.share = {
    //     //     projectId: '',
    //     //     groupId : ''
    //     // };
    // });
    
    describe('#tserver/tclient 检测', function () {
        it('query_qrecv_config 正确执行返回undefined或者对象 #1', function () {
            let request = {group_id: groupId,component_id: componentId};
            let body ={"md5": md5(JSON.stringify(request)),"request": request};
            return transfer.query_qrecv_config(body, res).then(function (result) {
                console.debug(result);
                if (result) {
                    expect(result).to.be.an('object');
                } else{
                    expect(result).to.be.undefined;
                }
            });
        });

        it('query_tserver_config 正确执行返回undefined或者对象 #2', function () {
            let body ={"md5": md5(JSON.stringify({})),"request": {}};
            return transfer.query_tserver_config(body, res).then(function (result) {
                console.debug(result);
                if (result) {
                    expect(result.server_config.user).to.be.an('array');
                } else{
                    expect(result).to.be.undefined;
                }
            });
        });

        it('add_tserver_config 正确执行返回SUCCESS #3', function () {
            let cfg = {
                user:{
                    name: 'admin',
                    passwd: Pub.tdes('123456'),
                    pri:{
                        all_que:'yes'
                    }
                }
            };
            let request = {server_config: cfg};
            let body ={"md5": md5(JSON.stringify(request)),"request": request};
            return transfer.add_tserver_config(body, res).then(function (result) {
                console.debug(result);
                expect(result).to.be.equal('SUCCESS');
            });
        });
    });
});