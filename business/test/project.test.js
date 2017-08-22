const project = require('../main/project');
const md5 = require('md5');
const expect = require('chai').expect;
/*
* project接口里面全部方法的测试
* */
describe('project 接口 的测试', function() {
    "use strict";
    const res = {
          json: function (data) {
              return data;
          }
    };
    let project_id;
    let projet_name = 'test_pro11111_test_2017';
    let desc = 'test_pro222';
    global.projectName = projet_name;

    // 添加项目
    it('add_project 返回值project_id 不为空', function() {
        let request = {name: projet_name, create_time: "2017/07/28", desc: desc};
        let body ={ "md5":md5(JSON.stringify(request)), "request": request};
        return project.add_project(body,res).then(function (result) {
            console.error('mocha project test resolve----1');
            console.info(result);
            project_id = result.project_id;
            global.projectId = project_id;
            expect(result.project_id).to.not.be.undefined;
        });
    });
    // 查询项目
    it('query_project 添加的project_id存在于返回列表', function() {
        let body = {"md5":"99914b932bd37a50b983c5e7c90ae93b","request":{}};
        return project.query_project(body,res).then(function (result) {
            console.error('mocha project test resolve----2');
            console.log('query_project:',project_id);
            console.info(result);
            let pro_exist = false;
            if (result){
              for (let item of result){
                  if (item.id === project_id) {
                      pro_exist = true;
                  }
              }
            }
            expect(pro_exist).to.equal(true);
        });
    });
    // 删除项目
    it.skip('delete_project 删除指定project返回SUCCESS', function() {
        console.log('delete_project:',project_id);
        let req = {id: project_id};
        let body = {md5: md5(JSON.stringify(req)), request: req};
        return project.delete_project(body,res).then(function (result) {
            console.error('mocha project test resolve----3');
            expect(result).to.equal('SUCCESS');
        });
    });
});