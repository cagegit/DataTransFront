/**
 * Created by zcf on 2017/7/25.
 */

let grp = require('../main/group');
let expect = require('chai').expect;
let md5 = require('md5');

describe('组操作相关测试', function () {
    let group;
    let projectId = global.projectId || '';
    let groupName = 'group1_test_auto';
    global.groupName = groupName;

    const res = {
        json: function (data) {
            return data;
        }
    };

    it('组的创建', function () {
        let req = {
            body: {
                request: {
                    auth: "super_admin",
                    description: "test",
                    group: groupName,
                    log_save_hour: 48,
                    projectid: projectId,
                    users: "admin"
                }
            }
        };

        req.body.md5 = md5(JSON.stringify(req.body.request));
        return grp.add_group(req, res)
            .then(function (result) {
                console.log(result);
                expect(result).to.be.an('object');
                expect(result).to.include.keys('group_id');
                group = result.group_id;
                global.groupId = group;
            });
    });

    it('组的修改', function () {
        let req = {
            body: {
                request: {
                    group: groupName, new_group: 'new' + groupName, description: "test", log_save_hour: 48, group_id: group
                }
            }
        }

        req.body.md5 = md5(JSON.stringify(req.body.request));
        return grp.modify_group(req, res)
            .then(function (result) {
                expect(result).to.be.empty;
            })
    });

    it('组的重置', function () {
        let req = {
            body: {
                request: {
                    group: group,
                    clean_all: 'yes'
                }
            }
        }

        req.body.md5 = md5(JSON.stringify(req.body.request));
        return grp.reset_group(req, res)
            .then(function (result) {
                expect(result).to.be.empty;
            })
    });

    it('组查询', function () {
        let req = {
            body: {
                request: {
                    auth: "super_admin",
                    projectid: projectId,
                    users: "admin"
                }
            }
        }

        req.body.md5 = md5(JSON.stringify(req.body.request));
        return grp.fetch_all_groups(req, res)
            .then(function (result) {
                expect(result).to.be.an('object');
                expect(result).to.include.keys('group');
                console.log('-------------------');
                console.log(result);
                console.log('-------------------');
            })
    });

    it('组的删除', function () {
        let req = {
            body: {
                request: {
                    group: group
                }
            }
        };

        console.log('###delete ', group);
        req.body.md5 = md5(JSON.stringify(req.body.request));
        return grp.delete_group(req, res)
            .then(function (result) {
                expect(result).to.be.empty;
            })
    });
})
