/**
 * Created by zcf on 2017/8/2.
 */

let expect = require('chai').expect;
let etl = require('../etl');
let md5 = require('md5');
let util = require('util');

describe('etl相关操作测试', function () {
const res = {
        json: function (data) {
            return data;
        }
    };

    it('查询etl配置 query_etl_config', function () {
        let req = {
            body: {
                "request": {
                    "group": "group_270",
                    "component_name": "etl",
                    "db_type": "oracle",
                    "db_component_name": "database_319",
                    "component_id": "etl_322"
                }
            }
        };

        req.body.md5 = md5(JSON.stringify(req.body.request));
        return etl.query_etl_config(req.body)
            .then(function (result) {
                console.log('===', result);
                expect(result).to.be.an('object');
                expect(result).to.include.keys('cset');
                expect(result).to.include.keys('ncset');
                expect(result).to.include.keys('cbset');
                expect(result).to.include.keys('ncbset');
                expect(result).to.include.keys('tset');
                expect(result).to.include.keys('interval');
                expect(result).to.include.keys('full_string');
            });
    });

    it('etl schema信息查询 query_etl_user', function () {
        let req = {
            body: {
                "request": {"group": "group_270", "db_type": "oracle", "db_component_name": "database_319"}
            }
        };

        req.body.md5 = md5(JSON.stringify(req.body.request));
        return etl.query_etl_user(req.body)
            .then(function (result) {
                console.log('===', result);
                expect(result).to.be.an('object');
                expect(result).to.include.keys('user');
            });
    });

    it('etl table信息查询 query_etl_table', function () {
        let req = {
            body: {
                "request": {
                    "group": "group_270",
                    "db_type": "oracle",
                    "db_component_name": "database_319",
                    "user": "CR_TEST_01"
                }
            }
        };

        req.body.md5 = md5(JSON.stringify(req.body.request));
        return etl.query_etl_table(req.body)
            .then(function (result) {
                console.log('===', result);
                expect(result).to.be.an('object');
                expect(result).to.include.keys('tables');
            });
    });

    it('etl查询表列信息 query_column_list', function () {
        let req = {
            body: {
                "request": {
                    "group": "group_270",
                    "component_name": "etl_322",
                    "user": "CR_TEST_01",
                    "table": "渔政记录_9",
                    "db_type": "oracle",
                    "db_component_name": "database_319",
                    "exist_list": []
                }
            }
        };

        req.body.md5 = md5(JSON.stringify(req.body.request));
        return etl.query_column_list(req.body)
            .then(function (result) {
                console.log('===', result);
                expect(result).to.be.an('object');
                expect(result).to.include.keys('list');
            });
    });

    it('etl表达式合法性检查 legal_check_expression', function () {
        let req = {
            body: {
                "request": {
                    "group": "group_270",
                    "db_type": "oracle",
                    "db_component_name": "database_319",
                    "user": "CR_TEST_01",
                    "table": "渔政记录_9",
                    "connect_db": "yes",
                    "expression": "c3Vic3RyKDpVU0VSTkFNRSwxLDMp"
                }
            }
        };

        req.body.md5 = md5(JSON.stringify(req.body.request));
        return etl.legal_check_expression(req.body)
            .then(function (result) {
                console.log('===', result);
                expect(result).to.be.an('object');
                expect(result).to.include.keys('column_name');
            });
    });

    describe('etl增加列规则测试', function () {
        it.only('etl增加列规则保存 save_etl_add_config', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "component_name": "etl_322",
                        "db_type": "oracle",
                        "db_component_name": "database_319",
                        "user": "CR_TEST_01",
                        "table": "渔政记录_9",
                        "other_tables": [],
                        "map_db_component_name": "",
                        "map_db_type": "",
                        "map_user": "",
                        "map_table": "",
                        "list": [{
                            "column_name": "col",
                            "data_type": "string",
                            "column_value": "hello",
                            "bind_name": []
                        }, {
                            "column_name": "col2",
                            "data_type": "sysdata",
                            "column_value": "scn",
                            "bind_name": []
                        }, {
                            "column_name": "col3",
                            "data_type": "expression",
                            "expression": "c3Vic3RyKDpVU0VSTkFNRSwxLDMp",
                            "connect_db": "yes",
                            "bind_name": ["USERNAME"],
                            "db_info": {}
                        }]
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.save_etl_add_config(req.body, res)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.a('string');
                    expect(result).to.contains('SUCCESS');
                });
        });

        it('etl增加列信息查询 query_etl_add_config', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "component_name": "etl_322",
                        "user": "CR_TEST_01",
                        "table": "渔政记录_9"
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.query_etl_add_config(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.an('object');
                    expect(result).to.include.keys('database');
                    expect(result).to.include.keys('list');
                });
        });

        it('etl增加列规则删除 save_etl_table_rule', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "component_name": "etl_322",
                        "user": "CR_TEST_01",
                        "table": "渔政记录_9",
                        "rules": [],
                        "del_rule": "add_column"
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.save_etl_table_rule(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.a('string');
                    expect(result).to.contains('SUCCESS');
                });
        });
    });

    describe('etl删除列规则测试', function () {
        it('etl删除列规则保存 save_etl_delete_config', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "component_name": "etl_322",
                        "db_type": "oracle",
                        "db_component_name": "database_319",
                        "user": "CR_TEST_01",
                        "table": "渔政记录_9",
                        "other_tables": [],
                        "list": [{"column_name": "APPLYTIME", "column_type": "VARCHAR2"}, {
                            "column_name": "MOBILEPHONE",
                            "column_type": "VARCHAR2"
                        }, {"column_name": "REPORTNAME", "column_type": "VARCHAR2"}]
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.save_etl_delete_config(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.a('string');
                    expect(result).to.contains('SUCCESS');
                });
        });

        it('etl删除列规则查询 query_etl_delete_config', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "component_name": "etl_322",
                        "user": "CR_TEST_01",
                        "table": "渔政记录_9"
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.query_etl_delete_config(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.an('object');
                    expect(result).to.include.keys('list');
                });
        });

        it('etl删除列规则删除 save_etl_table_rule', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "component_name": "etl_322",
                        "user": "CR_TEST_01",
                        "table": "渔政记录_9",
                        "rules": [],
                        "del_rule": "delete_column"
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.save_etl_table_rule(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.a('string');
                    expect(result).to.contains('SUCCESS');
                });
        });
    });

    describe('etl映射列规则测试', function () {
        it('etl映射列规则查询 query_etl_map_config', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "component_name": "etl_322",
                        "user": "CR_TEST_01",
                        "table": "渔政记录_9"
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.query_etl_map_config(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.an('object');
                    expect(result).to.include.keys('database');
                    expect(result).to.include.keys('list');
                    expect(result).to.include.keys('select_tab');
                });
        });

        it('etl映射列规则保存 save_etl_map_config', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "component_name": "etl_322",
                        "db_type": "oracle",
                        "db_component_name": "database_319",
                        "user": "CR_TEST_01",
                        "table": "渔政记录_9",
                        "other_tables": [],
                        "map_db_type": "oracle",
                        "map_user": "CR_TEST_01",
                        "map_table": "渔政记录_8",
                        "list": [{
                            "column_name": "MOBILEPHONE",
                            "column_type": "VARCHAR2",
                            "map_name": "APPLYID",
                            "map_type": "VARCHAR2",
                            "expression": "",
                            "connect_db": "no",
                            "bind_name": [],
                            "db_info": {}
                        }, {
                            "column_name": "SOURCE_ID",
                            "column_type": "VARCHAR2",
                            "map_name": "表名",
                            "map_type": "VARCHAR2",
                            "expression": "",
                            "connect_db": "no",
                            "bind_name": [],
                            "db_info": {}
                        }]
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.save_etl_map_config(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.a('string');
                    expect(result).to.contains('SUCCESS');
                });
        });

        it('etl映射列规则删除 save_etl_table_rule', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "component_name": "etl_322",
                        "user": "CR_TEST_01",
                        "table": "渔政记录_9",
                        "rules": [],
                        "del_rule": "column_mapping"
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.save_etl_table_rule(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.a('string');
                    expect(result).to.contains('SUCCESS');
                });
        });
    });

    describe('etl记录过滤规则测试', function () {
        it('etl记录过滤规则保存 save_etl_condition_config', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "component_name": "etl_322",
                        "db_type": "oracle",
                        "db_component_name": "database_319",
                        "user": "CR_TEST_01",
                        "table": "渔政记录_9",
                        "other_tables": [],
                        "list": [{
                            "option": "yes",
                            "expression": "e0FQUExZSUR9PSdhYmMn",
                            "connect_db": "no",
                            "bind_name": ["APPLYID"],
                            "db_info": {}
                        }]
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.save_etl_condition_config(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.a('string');
                    expect(result).to.contains('SUCCESS');
                });
        });

        it('etl记录过滤规则查询 query_etl_condition_config', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "component_name": "etl_322",
                        "user": "CR_TEST_01",
                        "table": "渔政记录_9"
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.query_etl_condition_config(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.an('object');
                    expect(result).to.include.keys('list');
                    expect(result).to.include.keys('select_tab');
                });
        });

        it('etl记录过滤规则删除 save_etl_table_rule', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "component_name": "etl_322",
                        "user": "CR_TEST_01",
                        "table": "渔政记录_9",
                        "rules": [],
                        "del_rule": "record_filter"
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.save_etl_table_rule(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.a('string');
                    expect(result).to.contains('SUCCESS');
                });
        });
    });

    describe('etl表审计规则测试', function () {
        it('etl表审计规则保存 save_etl_transform_config', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "component_name": "etl_322",
                        "db_type": "oracle",
                        "db_component_name": "database_319",
                        "user": "CR_TEST_01",
                        "table": "渔政记录_9",
                        "other_tables": [],
                        "map_db_component_name": "",
                        "map_db_type": "",
                        "map_user": "",
                        "map_table": "",
                        "table_prefix": "pre",
                        "table_suffix": "sufix",
                        "keep_copy": "no",
                        "list": [{
                            "column_name": "flag",
                            "data_type": "string",
                            "column_value": "标识",
                            "bind_name": []
                        }, {
                            "column_name": "opra",
                            "data_type": "sysdata",
                            "column_value": "operation",
                            "bind_name": []
                        }]
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.save_etl_transform_config(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.a('string');
                    expect(result).to.contains('SUCCESS');
                });
        });

        it('etl表审计规则查询 query_etl_transform_config', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "component_name": "etl_322",
                        "user": "CR_TEST_01",
                        "table": "渔政记录_9"
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.query_etl_transform_config(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.an('object');
                    expect(result).to.include.keys('database');
                    expect(result).to.include.keys('list');
                    expect(result).to.include.keys('table_prefix');
                    expect(result).to.include.keys('table_suffix');
                    expect(result).to.include.keys('keep_copy');
                    expect(result).to.include.keys('select_tab');
                });
        });

        it('etl表审计规则删除 save_etl_table_rule', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "component_name": "etl_322",
                        "user": "CR_TEST_01",
                        "table": "渔政记录_9",
                        "rules": [],
                        "del_rule": "table_audit"
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.save_etl_table_rule(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.a('string');
                    expect(result).to.contains('SUCCESS');
                });
        });
    });


    describe('etl操作转换测试', function () {
        it('insert_to_update规则保存 save_etl_convert', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "component_name": "etl_322",
                        "db_type": "oracle",
                        "db_component_name": "database_319",
                        "user": "CR_TEST_01",
                        "table": "渔政记录_9",
                        "operation": {
                            "oper_type": "inserttoupdate",
                            "expression": "OkFQUExZSUQ94oCYMTIz4oCZ",
                            "connect_db": "yes",
                            "bind_name": ["APPLYID"],
                            "db_info": {}
                        }
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.save_etl_convert(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.a('string');
                    expect(result).to.contains('SUCCESS');
                });
        });

        it('insert_to_update规则查询 query_etl_convert', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "component_name": "etl_322",
                        "user": "CR_TEST_01",
                        "table": "渔政记录_9",
                        "oper_type": "inserttoupdate"
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.query_etl_convert(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.an('object');
                    expect(result).to.include.keys('expression');
                    expect(result).to.include.keys('connect_db');
                    expect(result).to.include.keys('db_name');
                    expect(result).to.include.keys('bind_name');
                });
        });

        it('update_to_insert/delete规则保存 save_etl_convert', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "component_name": "etl_322",
                        "db_type": "oracle",
                        "db_component_name": "database_319",
                        "user": "CR_TEST_01",
                        "table": "渔政记录_9",
                        "operation": {
                            "oper_type": "updatetoinsert",
                            "expression": "e0lEfT0xMDAw",
                            "connect_db": "no",
                            "bind_name": ["ID"],
                            "db_info": {}
                        }
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.save_etl_convert(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.a('string');
                    expect(result).to.contains('SUCCESS');
                });
        });

        it('update_to_insert/delete规则查询 query_etl_convert', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "component_name": "etl_322",
                        "user": "CR_TEST_01",
                        "table": "渔政记录_9",
                        "oper_type": "updatetoinsert"
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.query_etl_convert(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.an('object');
                    expect(result).to.include.keys('expression');
                    expect(result).to.include.keys('connect_db');
                    expect(result).to.include.keys('db_name');
                    expect(result).to.include.keys('bind_name');
                });
        });

        it('delete_to_update规则保存 save_etl_convert', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "component_name": "etl_322",
                        "db_type": "oracle",
                        "db_component_name": "database_319",
                        "user": "CR_TEST_01",
                        "table": "渔政记录_9",
                        "operation": {
                            "oper_type": "deletetoupdate",
                            "expression": "e0FQUExZSUR9PSd4eXon",
                            "connect_db": "no",
                            "bind_name": ["APPLYID"],
                            "db_info": {}
                        },
                        "reserve_all": "no",
                        "add_column": [{"name": "flag", "type": "string", "source": "string", "value": "D"}],
                        "reserve_column": [{"name": "APPLYID", "type": "VARCHAR2"}, {
                            "name": "APPLYTIME",
                            "type": "VARCHAR2"
                        }, {"name": "USERNAME", "type": "VARCHAR2"}, {
                            "name": "表名",
                            "type": "VARCHAR2"
                        }, {"name": "工程编号", "type": "VARCHAR2"}, {"name": "工程名称", "type": "VARCHAR2"}, {
                            "name": "省会",
                            "type": "VARCHAR2"
                        }]
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.save_etl_convert(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.a('string');
                    expect(result).to.contains('SUCCESS');
                });
        });

        it('delete_to_update规则查询 query_etl_convert', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "component_name": "etl_322",
                        "user": "CR_TEST_01",
                        "table": "渔政记录_9",
                        "oper_type": "deletetoupdate"
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.query_etl_convert(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.an('object');
                    expect(result).to.include.keys('expression');
                    expect(result).to.include.keys('connect_db');
                    expect(result).to.include.keys('db_name');
                    expect(result).to.include.keys('bind_name');
                    expect(result).to.include.keys('add_column');
                    expect(result).to.include.keys('reserve_all');
                    expect(result).to.include.keys('column');
                });
        });

        it('etl操作转换规则删除 save_etl_table_rule', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "component_name": "etl_322",
                        "user": "CR_TEST_01",
                        "table": "渔政记录_9",
                        "rules": [],
                        "del_rule": "operation_transform"
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.save_etl_table_rule(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.a('string');
                    expect(result).to.contains('SUCCESS');
                });
        });
    });

    it('etl表规则查询 query_etl_table_rule', function () {
        let req = {
            body: {
                "request": {"group": "group_270", "component_name": "etl_322", "user": "CR_TEST_01", "table": "渔政记录_9"}
            }
        };

        req.body.md5 = md5(JSON.stringify(req.body.request));
        return etl.query_etl_table_rule(req.body)
            .then(function (result) {
                console.log('===', result);
                expect(result).to.be.an('array');
            });
    });

    describe('etl批量规则测试', function () {
        it('etl批量过滤规则保存 save_batch_rule', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "db_component_name": "database_319",
                        "db_type": "oracle",
                        "rule_type": "filter",
                        "batch_name": "bat_filter",
                        "rules": [{
                            "id": 0,
                            "checked": true,
                            "coder": "code",
                            "resered": "yes",
                            "expression": "OkFQUExZSUQ9JyVzJw==",
                            "value": ":APPLYID='...",
                            "bdList": ["APPLYID"],
                            "dbInfo": {},
                            "list": [{"user": "CR_TEST_01", "list": ["渔政记录_9"]}],
                            "connect_db": "yes"
                        }]
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.save_batch_rule(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.a('string');
                    expect(result).to.include('SUCCESS');
                });

        });

        it('etl批量过滤值绑定 save_batch_codevalue', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "db_component_name": "database_319",
                        "db_type": "oracle",
                        "component_name": "etl_322",
                        "rule_type": "filter",
                        "batchRules": [{
                            "name": "bat_filter",
                            "checked": true,
                            "codes": [{"code": "code", "value": "'abc'", "id": 0, "checked": true}]
                        }]
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.save_batch_codevalue(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.a('string');
                    expect(result).to.include('SUCCESS');
                });

        });


        it('etl操作转换规则保存 save_batch_rule', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "db_component_name": "database_319",
                        "db_type": "oracle",
                        "rule_type": "transform",
                        "batch_name": "trans_bat",
                        "rules": [{
                            "id": 0,
                            "checked": true,
                            "coder": "code2",
                            "resered": "yes",
                            "expression": "e0lEfT0nJXMn",
                            "value": "{ID}='%s'",
                            "bdList": ["ID"],
                            "dbInfo": {},
                            "list": [{"user": "CR_TEST_01", "list": ["渔政记录_9"]}],
                            "connect_db": "no"
                        }]
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.save_batch_rule(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.a('string');
                    expect(result).to.include('SUCCESS');
                });

        });

        it('etl批量转换值绑定 save_batch_codevalue', function () {
            let req = {
                body: {
                    "request": {
                        "group": "group_270",
                        "db_component_name": "database_319",
                        "db_type": "oracle",
                        "component_name": "etl_322",
                        "rule_type": "update",
                        "batchRules": [{
                            "name": "trans_bat",
                            "checked": true,
                            "codes": [{"code": "code2", "value": "'123'", "id": 0, "checked": true}]
                        }]
                    }
                }
            };

            req.body.md5 = md5(JSON.stringify(req.body.request));
            return etl.save_batch_codevalue(req.body)
                .then(function (result) {
                    console.log('===', result);
                    expect(result).to.be.a('string');
                    expect(result).to.include('SUCCESS');
                });

        });
    });


})
