/**
 * Created by cagej on 2017/6/7.
 */
let capture = require('../main/capture');
const expect = require('chai').expect;
const md5 = require('md5');

describe('capture 接口的测试', function() {
    const res = {
        json: function (data) {
            return data;
        }
    };
    let projectId = '',groupId = 'group_270',dbComponentId = 'database_319', componentId = 'capture_320';
    // before(function() {
    //     // global.share = {
    //     //     projectId: '',
    //     //     groupId : ''
    //     // };
    // });
    
    describe('#caputre组件测试', function () {
        it('save_parameter 返回值等于发送component_id', function() {
            let request = {"group_id":groupId,"component_id":componentId,"parameter":{"downstream":"no","nls_lang":"","capture_interval":180,"capture_heartbeat":300,
                "logminer_restart_time":300,"back_scn":10,"transaction_slot_size":"32K","internal_queue_size":"32M","scn_evaluate_time":20,"max_transaction_slot":1000,"lob_skip":"no",
                "concurrent":"no","parallel":1,"full_column_update":"no","use_online_dict":"no","capture_grant":"no"}};
            let body ={"md5": md5(JSON.stringify(request)),"request": request};
            return capture.save_parameter(body,res).then(function (result) {
                console.debug(result);
                expect(result.component_id).to.equal(componentId);
            });
        });
        it('add_capture 保存/修改capture返回值等于发送component_id', function() {
            let request = {"group_id":groupId,"component_name":"cp","db_component_id":dbComponentId,"type":"oracle","selected_users":["ND_TEST_01"],"downstream_info":"",
                "rac_info":{"instance":[]},"parameter":{"downstream":"no","nls_lang":"","capture_interval":189,"capture_heartbeat":300,"logminer_restart_time":300,"back_scn":10,
                    "transaction_slot_size":"32K","internal_queue_size":"32M","scn_evaluate_time":20,"max_transaction_slot":1000,"lob_skip":"no","concurrent":"no","parallel":1,
                    "full_column_update":"no","use_online_dict":"no","capture_grant":"no"},"component_id":componentId};
            let body ={"md5": md5(JSON.stringify(request)),"request": request};
            return capture.add_capture(body,res).then(function (result) {
                console.debug(result);
                expect(result.component_id).to.equal(componentId);
            });
        });
        it('query_capture_config 返回值不为空', function() {
            let request ={"group_id":groupId,"db_component_id":dbComponentId,"component_id":componentId,"type":"oracle","component_name":"cp"};
            let body ={"md5": md5(JSON.stringify(request)),"request": request};
            return capture.query_capture_config(body,res).then(function (result) {
                console.debug(result);
                expect(result.all_users.user).to.be.an('array');
                expect(result.selected_users.user).to.be.an('array');
                expect(result.parameter).to.be.an('object');
            });
        });
    });

   describe('#capture SqlServer方法', function () {
       it.skip('query_capture_table 返回值为一个数组', function() {
           let request = {"group": groupId, "db_component_name": dbComponentId,"component_name": componentId, "selected_users":{"user":["ND_TEST_01"]}};
           let body ={"md5": md5(JSON.stringify(request)),"request": request};
           return capture.query_capture_table(body,res).then(function (result) {
               console.debug(result);
               expect(result.all_unrepl).to.be.an('array');
               expect(result.snapshot_tables).to.be.exist;
           });
       });

       it.skip('query_extended_log_table 返回值为一个数组', function() {
           let request = {"group": groupId,"db_name": dbComponentId,"user":["ND_TEST_01"]};
           let body ={"md5": md5(JSON.stringify(request)),"request": request};
           return capture.query_extended_log_table(body,res).then(function (result) {
               console.debug(result);
               expect(result.extend_table).to.be.an('array');
           });
       });

       it.skip('change_extended_log 返回值等于SUCCESS', function() {
           let request = {"group":"group_5","db_name":"database_22","extend_table":{"user":"Person","table":"Address","status":"add"}};
           let body ={"md5": md5(JSON.stringify(request)),"request": request};
           return capture.change_extended_log(body,res).then(function (result) {
               // console.info(result);
               expect(result).to.equal('SUCCESS');
           },function (err) {
               console.log(err);
               expect(err).to.not.be.empty;
           });
       });
   });
});