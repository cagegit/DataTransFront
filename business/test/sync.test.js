/**
 * Created by zcf on 2017/7/28.
 */

'use strict';

let expect = require('chai').expect;
let md5 = require('md5');
let util = require('util');
let sync = require('../main/sync');

describe('全同步相关接口测试', function () {
    it.skip('查询全同步表清单query_full_sync_filter', function () {
        let req = {
            body: {
                request: {group: "group_269", db_component_id: "database_275", db_type: "oracle", comp_id: "apply_279"}
            }
        };

        req.body.md5 = md5(JSON.stringify(req.body.request));

        return sync.query_full_sync_filter(req).then(function (result) {
            console.debug('====', util.inspect(result, null));
            expect(result).to.be.an('object');
            expect(result).to.include.keys('list');
        })
    });


    it('记录全同步配置信息create_sync_cfg', function () {
        let req = {
            body: {
                "request": {
                    "group": "group_269",
                    "comp_id": "apply_279",
                    "exp": {
                        "exp_source_tab": "0",
                        "exp_dict_only": "0",
                        "exp_mode": "0",
                        "exp_schema": [{
                            "name": "CR_TEST_01",
                            "object": [{"checked": true, "name": "AA", "clause": ""}, {
                                "checked": true,
                                "name": "AAAAAA",
                                "clause": ""
                            }, {"checked": true, "name": "C_T_TABLE_1", "clause": ""}, {
                                "checked": true,
                                "name": "C_T_TABLE_2",
                                "clause": ""
                            }]
                        }],
                        "file_size": "32",
                        "exp_simu": "1",
                        "exp_tab_simu": "1",
                        "exp_string": "0",
                        "exp_scn": "",
                        "exp_nls_lang": "ZHS16GBK",
                        "exp_use_etl": "0",
                        "exp_create_table": "0",
                        "exp_create_index": "0",
                        "exp_create_object": "0"
                    },
                    "imp": {
                        "imp_mmap_id": "",
                        "imp_mode": "1",
                        "imp_dict_only": "0",
                        "imp_schema": [],
                        "imp_ora_op": "1",
                        "imp_write_log": "0",
                        "table_space": [],
                        "imp_simu": "1",
                        "imp_tab_simu": "1",
                        "imp_rebuild_tab": "1",
                        "imp_nls_lang": "ASCII",
                        "imp_truncate_tab": "1",
                        "imp_rebuild_ind": "1",
                        "imp_rebuild_object": "1",
                        "imp_backup_file": "0",
                        "imp_use_tabs_map": "0"
                    }
                }
            }
        };

        req.body.md5 = md5(JSON.stringify(req.body.request));

        return sync.create_sync_cfg(req).then(function (result) {
            console.debug('====', util.inspect(result, null));
            expect(result).to.be.an('object');
            expect(result).to.include.keys('sync_id');
        })
    });

    it('获取map文件列表query_map_list', function () {
        let req = {
            body: {
                request: {}
            }
        }
        req.body.md5 = md5(JSON.stringify(req.body.request));

        return sync.query_map_list(req).then(function (result) {
            console.debug('====', result);
            expect(result).to.be.an('object');
            expect(result).to.include.keys('list');
        })
    });


    it('获取表空间query_db_tablespaces', function () {
        let req = {
            body: {
                "request": {"group": "group_269", "db_type": "oracle", "comp_id": "database_275"}
            }
        }
        req.body.md5 = md5(JSON.stringify(req.body.request));

        return sync.query_db_tablespaces(req).then(function (result) {
            console.debug('====', result);
            expect(result).to.be.an('object');
            expect(result).to.include.keys('table_space');
        })
    });


    it('查看全同步历史信息query_full_sync_history', function () {
        let req = {
            body: {
                "request":{"group":"group_269","comp_id":"apply_279"}
            }
        }
        req.body.md5 = md5(JSON.stringify(req.body.request));

        return sync.query_full_sync_history(req).then(function (result) {
            console.debug('====', result);
            expect(result).to.be.an('object');
        })
    });
})


