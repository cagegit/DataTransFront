/**
 * Created by cagej on 2017/6/16.
 */
const apply = require('../main/apply');
const expect = require('chai').expect;
const md5 = require('md5');

describe('apply/loader 接口测试', function() {
    const res = {
        json: function (data) {
            return data;
        }
    };
    let projectId = '', groupId = 'group_270', dbComponentId = 'database_319', componentId = 'apply_325';
    // before(function() {
    //     // global.share = {
    //     //     projectId: '',
    //     //     groupId : ''
    //     // };
    // });
   describe('#保存修改apply', function () {
       it('add_apply_property 高级选项应该返回component_id', function () {
           let request = {"group_id":groupId,"component_id":componentId,"parameter":{"tag_skip":"no","error_auto":"yes","check_old_image":"yes","ddl_skip":"no","batch_commit":"yes",
               "set_tag":"no","lob_skip":"no","restart":"no","source_nchar_charset":"AL16UTF16","source_clob_charset":"AL16UTF16","source_nclob_charset":"AL16UTF16","source_metadata_charset":"",
               "dip_nchar_charset":"ZHS16GBK","dip_nls_lang":"AMERICAN_AMERICA.ZHS16GBK","exclude_table":"no","unknown_error":"skip","execute_one":"no","idle_connect_seconds":0,"use_merge_sql":"no"}};
           let body ={"md5": md5(JSON.stringify(request)),"request": request};
           return apply.add_apply_property(body, res).then(function (result) {
               console.debug(result);
               expect(result.component_id).to.equal(componentId);
           });
       });
       it('add_apply_config 保存loader应该返回component_id', function () {
           let request = {"group_id":groupId,"db_component_id":dbComponentId,"component_name":"ld","type":"oracle","filters":{"filter":[{"filter_type":"INCLUDE",
               "schema":[{"name":"ND_TEST_01","object_type":[{"name":"INDEX","object":[]},{"name":"TABLE","object":[]},{"name":"VIEW","object":[]},{"name":"SEQUENCE","object":[]},
                   {"name":"PROCEDURE","object":[]},{"name":"FUNCTION","object":[]},{"name":"PACKAGE","object":[]},{"name":"PACKAGE_BODY","object":[]},{"name":"TRIGGER","object":[]},
                   {"name":"TYPE","object":[]},{"name":"TYPE_BODY","object":[]}]}]},{"filter_type":"EXCLUDE","schema":[]}]},"parameter":{"tag_skip":"no","error_auto":"yes","check_old_image":"yes",
               "ddl_skip":"no","batch_commit":"yes","set_tag":"no","lob_skip":"no","restart":"no","source_nchar_charset":"AL16UTF16","source_clob_charset":"AL16UTF16",
               "source_nclob_charset":"AL16UTF16","source_metadata_charset":"","dip_nchar_charset":"ZHS16GBK","dip_nls_lang":"AMERICAN_AMERICA.ZHS16GBK","exclude_table":"no","unknown_error":"skip",
               "execute_one":"no","idle_connect_seconds":0,"use_merge_sql":"no"},"component_id":componentId};
           let body ={"md5": md5(JSON.stringify(request)),"request": request};
           return apply.add_apply_config(body, res).then(function (result) {
               console.debug(result);
               expect(result.component_id).to.equal(componentId);
           });
       });
       it('query_apply_config 应该返回一个对象', function () {
           let request = {"group_id":groupId,"component_id":componentId,"db_component_id":dbComponentId,"db_type":"oracle","type":"oracle","component_name":"ld","capture_id":"capture_320"};
           let body ={"md5": md5(JSON.stringify(request)),"request": request};
           return apply.query_apply_config(body, res).then(function (result) {
               console.debug(result);
               expect(result).to.have.property('objects');
               expect(result).to.have.property('parameter');
               expect(result).to.have.property('filters');
           });
       });
   });

   describe('#保存其他loader数据', function () {
       it.skip('query_apply_sourcedb_object 返回一个数据', function () {
           let request = {group_id: groupId, type: 'oracle',db_component_id: dbComponentId,object_type:treeNode.name,owner:owner};
           let body ={"md5": md5(JSON.stringify(request)),"request": request};
           return apply.query_apply_sourcedb_object(body, res).then(function (result) {
               console.debug(result);
               expect(result.objects.object).to.be.an('array');
           });
       });
       it.skip('query_apply_exclude_table 返回total数字、list数组', function () {
           let request = {group: groupId,component_name: 'que', type: 'queue',component_id: componentId};
           let body ={"md5": md5(JSON.stringify(request)),"request": request};
           return apply.query_apply_exclude_table(body, res).then(function (result) {
               console.debug(result);
               expect(result.total).to.be.exist;
               expect(result.list).to.be.an('array');
           });
       });
       it.skip('delete_exclude_table 成功执行返回SUCCESS', function () {
           let request = {group: groupId,component_name: 'que', type: 'queue',component_id: componentId};
           let body ={"md5": md5(JSON.stringify(request)),"request": request};
           return apply.delete_exclude_table(body, res).then(function (result) {
               console.debug(result);
               expect(result).to.equal('SUCCESS');
           });
       });
   });
});