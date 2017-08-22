/**
 * Created by cagej on 2017/8/4.
 */
describe('项目整体测试', function () {
    require('./project.test');
    require('./group.test');
    require('./database.test');
// require('./capture.test');
// require('./apply.test');
    after(function() {
        console.log('Mocha test result:/----------------------------/-------------------------------/--------------------');
        console.log('projectId:',global.projectId);
        console.log('projectName:',global.projectName);
        console.log('groupId:',global.groupId);
        console.log('groupName:',global.groupName);
        console.log('databaseId:',global.databaseId);
        console.log('databaseName:',global.databaseName);
        console.log('Mocha test result:--------------------/-----------------------------/------------------------------/');
    });
});