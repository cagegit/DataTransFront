/**
 * Created by cagej on 2017/8/3.
 */
const component = require('../main/component');
const expect = require('chai').expect;
const md5 = require('md5');
describe('component 接口的测试', function() {
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
    // 只能单个测试
    it.skip('delete_component 删除组件成功应该返回SUCCESS', function () {
        let request = {group: groupId,component_name: 'que', type: 'queue',component_id: componentId};
        let body ={"md5": md5(JSON.stringify(request)),"request": request};
        return component.delete_component(body, res).then(function (result) {
            console.debug(result);
            expect(result).to.equal('SUCCESS');
        });
    });
});