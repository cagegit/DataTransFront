/**
 * Created by cagej on 2017/3/16.
 */
(function () {
    'use strict';
    angular.module('myApp.etlService',[])
        .config(['$qProvider',function ($qProvider) {
            $qProvider.errorOnUnhandledRejections(false);
        }])
        .service('etlService',['httpService','tipsService','md5Service','$filter','graphicService','$q','tDes',function (httpSer,dipT,md5Ser,$filter,gSer,$q,tDes) {
            /*
             * 查询elt的配置信息
             * @param {Object} 参数
             * */
            this.fetchEtlConfig=function (comInfo) {
                var result={init:true};
                if(comInfo.gn && comInfo.pn && comInfo.pt){
                    var cname = comInfo.cn==='unnamed'?'':comInfo.cn;
                    var args={group:comInfo.gn,component_name:cname,db_type:comInfo.pt,db_component_name:comInfo.pn,component_id:comInfo.cid};
                    args=md5Ser.md5Data(args);
                    var url = "/dipserver/query_etl_config";
                    return httpSer.postDataList(url,args).then(function (data) {
                        if(md5Ser.equalMd5Data(data)){
                            if(data.status){
                                result.init=false;
                                result.data= data.response;
                                result.etl_id=comInfo.cid?comInfo.cid:'';
                                result.etl_name=cname;
                            }else{
                                dipT.error(data.response.error_msg);
                            }
                        }
                        return result;
                    },function (err) {
                        dipT.error('网络错误！');//网络错误！
                        return result;
                    });
                }
                return result;
            };
            /*
             * 保存etl的配置信息
             * @param {Object} comInfo
             * @param {Object} etl
             * @param {Object} $state
             * */
            this.saveEtlConfig =function (comInfo,etl,$state) {
                if(etl.etl_name==='unnamed'){
                    dipT.error('Etl名称不能为unnamed！');//Etl名称不能为unnamed！
                    return;
                }
                var etl_conf={
                    charset:etl.etl_char,
                    ncharset:etl.etl_nchar,
                    clobset:etl.etl_clob,
                    nclobset:etl.etl_nclob,
                    full_string:etl.etl_gs,
                    interval:etl.etl_jg
                };
                if(etl.etl_gs==='yes'){
                    etl_conf.tar_set=etl.etl_zh;
                }
                var args = {group_id:comInfo.gn,component_name:etl.etl_name,type:'etl',db_component_id:comInfo.pn,etl_config:etl_conf,component_id:comInfo.cid};
                args = md5Ser.md5Data(args);
                var url = "/dipserver/add_apply_config";
                var dialog = new BootstrapDialog({
                    title:'Dip Tip',
                    type:'type-primary',
                    size:'size-small',
                    message:'保存中......',
                    closable: false
                });
                var closeAlert=function (s,msg) {
                    if(s){
                        dialog.setType('type-success');
                        dialog.getModalBody().html('保存成功！');
                        setTimeout(function () {
                            dialog.close();
                        },300);
                    }else{
                        dialog.setType('type-danger');
                        if(msg){
                            dialog.getModalBody().html(msg);
                        }else{
                            dialog.getModalBody().html('保存失败！');
                        }
                    }
                    dialog.setClosable(true);
                };
                dialog.open();
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            // dipT.success("保存成功！");//保存成功！
                            var node = $("#" + comInfo.id);
                            node.find(".dragPoint").text(etl.etl_name);
                            node.attr("name", etl.etl_name);
                            node.attr("realid", data.response.component_id);
                            node.attr("type", comInfo.pt);
                            gSer.save_graphics_no_alert(comInfo.gn).finally(function () {
                                closeAlert(true);
                            });
                            $state.go('/');
                        }else{
                            // dipT.error(data.response.error_msg);
                            closeAlert(false,data.response.error_msg);
                        }
                    }
                },function () {
                    // dipT.error('保存失败！');//保存失败！
                    closeAlert(false);
                });
            };
            /*
             * 获取etl 用户列表
             * @params {Object} comInfo 组件信息对象
             * @return {Array}
             * */
            this.fetchEtlUser=function (comInfo) {
                var args={group:comInfo.gn,db_type:comInfo.pt,db_component_name:comInfo.pn};
                var url="/dipserver/query_etl_user",result=[];
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            result=data.response.user;
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                    return result;
                });
            };
            /*
             * 获取etl 用户列表
             * @params {Object} comInfo 组件信息对象
             * @return {Array}
             * */
            this.fetchEtlTable=function (comInfo,uname) {
                var args={group:comInfo.gn,db_type:comInfo.pt,db_component_name:comInfo.pn,user:uname};
                var url="/dipserver/query_etl_table",result=[];
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status && data.response){
                            result=data.response.tables;
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                    return result;
                });
            };
            /*
             * 获取当前表的已配置规则
             * @params {Object} comInfo
             * @return {Object}
             * */
            this.getRuleByName=function (comInfo,uname,tname) {
                var args={group:comInfo.gn,component_name:comInfo.cid,user:uname,table:tname};
                var url="/dipserver/query_etl_table_rule",result=[];
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status && angular.isArray(data.response)){
                            angular.forEach(data.response,function (val) {
                                if(val==='add_column'){
                                    result.push({name:'add_column',title:'增加列'});
                                }else if(val==='delete_column'){
                                    result.push({name:'delete_column',title:'删除列'});
                                }else if(val==='column_mapping'){
                                    result.push({name:'column_mapping',title:'映射列'});
                                }else if(val==='record_filter'){
                                    result.push({name:'record_filter',title:'记录过滤'});
                                }else if(val==='table_audit'){
                                    result.push({name:'table_audit',title:'审计表'});
                                }else if(val==='operation_transform'){
                                    result.push({name:'operation_transform',title:'操作转换'});
                                }
                            })
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                    return result;
                });
            };
            /*
             * 保存Etl规则
             * @params {Object} comInfo
             * @params {Object} etl{uname:String,tname:String,sel:Array}
             * */
            this.saveEtlRules=function (comInfo,etl) {
                var args={group:comInfo.gn,component_name:comInfo.cid,user:etl.uname,table:etl.tname,rules:etl.sel,del_rule:etl.del};
                var url="/dipserver/save_etl_table_rule",result=[];
                args=md5Ser.md5Data(args);
                httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            dipT.success('保存成功！');//保存成功！
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                    return result;
                });
            };

            ////etlAddConfig
            /*
             * 查询新增规则的配置信息
             * @params {String} uname
             * @params {String} tname
             * @return {Promise} result
             * */
            this.fetchEtlAddConfig=function (comInfo,uname,tname) {
                var args={group:comInfo.gn,component_name:comInfo.cid,user:uname,table:tname};
                var url="/dipserver/query_etl_add_config",result={};
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            var res=data.response;
                            result.dbs=[];//{db_name:'',db_type:''}
                            result.addList=[];//已添加列表
                            result.bdList=[];//表达式绑定列表
                            result.dbInfo={};//配置数据库的值
                            if(res){
                                result.dbs=angular.isArray(res.database)?res.database:[];
                                if(angular.isArray(res.list)){
                                    angular.forEach(res.list,function (v,i) {
                                        var item={};
                                        item.id=i;
                                        item.name=v.column_name;
                                        item.names=[v.column_name];
                                        item.type=v.data_type;
                                        if(item.type==='string'){
                                            item.value=v.column_value;
                                            item.desc='固定字符串';
                                        }else if(item.type==='sysdata'){
                                            item.value=v.column_value;
                                            item.desc='系统变量';
                                        }else if(item.type==='expression'){
                                            item.expression='';
                                            if(v.expression){
                                                item.expression=Base64.decode(v.expression);
                                            }
                                            if(typeof(item.expression)==='string' && item.expression.length>20){
                                                item.value=item.expression.substring(0,20)+'...';
                                            }else{
                                                item.value= item.expression;
                                            }
                                            item.connect_db = v.connect_db;
                                            item.desc='表达式';
                                        }
                                        item.checked=false;
                                        item.bdList=[];
                                        item.dbInfo={};
                                        if(angular.isArray(v.bind_name)){
                                            item.bdList=v.bind_name;
                                        }
                                        if(v.db_info && angular.isObject(v.db_info)){
                                            item.dbInfo = v.db_info;
                                        }
                                        result.addList.push(item);
                                    });
                                }
                                result.selectTab=[];
                                if(res.select_tab &&  res.select_tab.length>0){
                                    result.selectTab=res.select_tab;
                                }
                            }
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                    return result;
                });
            };
            /*
             * 查询源端字段列表
             * @params {String} uname
             * @params {String} tname
             * @return {Promise} result
             * */
            this.fetchEtlYdzdList=function (comInfo,uname,tname,excList) {
                excList=angular.isArray(excList)?excList:[];
                var args={group:comInfo.gn,component_name:comInfo.cid,user:uname,table:tname,db_type:comInfo.pt,db_component_name:comInfo.pn,exist_list:excList};
                var url="/dipserver/query_column_list",result=[];
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            var res=data.response;
                            if(res && angular.isArray(res.list)){
                                result=res.list;
                            }
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                    return result;
                });
            };
            /*
             * 生成目标库列表ztree JSON
             * @params {string} gn  组id
             * @params {Array} gn  库列表
             * @params {string} gn  库名
             * @params {string} gn  库类型
             * @return {Promise}
             * */
            this.getTargetDbs=function (gn,dbs) {
                var num=0,deferred=$q.defer(),json=[];
                if(dbs && angular.isArray(dbs)){
                    var promises = [];
                    angular.forEach(dbs,function (v,i) {
                        var pp =$q.defer(),isOpen=false;
                        var args={group:gn,db_type:v.db_type,db_component_name:v.db_name};
                        isOpen = num <= 0;
                        var level={id:i,name:v.db_name,open:isOpen,isParent:true,children:[]};
                        var url="/dipserver/query_etl_user";
                        args=md5Ser.md5Data(args);
                        httpSer.postDataList(url,args).then(function (data) {
                            if(md5Ser.equalMd5Data(data)){
                                if(data.status){
                                    var res=data.response;
                                    if(res && angular.isArray(res.user)){
                                        angular.forEach(res.user,function (vv,ii) {
                                            var user={id:ii,name:vv,pt:v.db_type,pn:v.db_name,open:false,isParent:true,children:[]};
                                            level.children.push(user);
                                        });
                                    }
                                }
                            }
                            pp.resolve(level);
                        },function (err) {
                            pp.reject(err);
                        });
                        promises.push(pp.promise);
                        num++;
                    });
                    $q.all(promises).then(function (datas) {
                        angular.forEach(datas,function (level) {
                            json.push(level);
                        });
                        deferred.resolve(json);
                    });
                    return deferred.promise;
                }else{
                    deferred.resolve([]);
                    return deferred.promise;
                }
            };
            /*
             * 表达式检查
             * @params {Object} comInfo 通用参数
             * @params {String} uname 当前用户名
             * @params {String} tname 当前表名
             * @params {Object} con_db 数据库信息
             * @params {String} express 表达式
             * @return {Array} 包含字段列表
             * */
            this.expressionCheck=function (comInfo,uname,tname, con_db, express) {
                var args={group:comInfo.gn,db_type:comInfo.pt,db_component_name:comInfo.pn,user:uname,table:tname,connect_db:con_db,expression:express};
                var url="/dipserver/legal_check_expression",result=[];
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            var res=data.response;
                            if(res && angular.isArray(res.column_name)){
                                result=res.column_name;
                            }
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                    return result;
                });
            };
            /*
             * 保存etl 增加规则信息
             *
             * */
            this.saveEtlAddConfig=function (comInfo,ct,rows,otabs,map) {
                var args={group:comInfo.gn,component_name:comInfo.cid,db_type:comInfo.pt,db_component_name:comInfo.pn,user:ct.uname,table:ct.tname};
                if(otabs && angular.isArray(otabs)){
                    args.other_tables=otabs;//应用到其他表
                }else{
                    args.other_tables=[];
                }
                args.map_db_component_name='';
                args.map_db_type='';
                args.map_user='';
                args.map_table='';
                if(map && !$.isEmptyObject(map)){
                    args.map_db_component_name=map.map_db_component_name;
                    args.map_db_type=map.map_db_type;
                    args.map_user=map.map_user;
                    args.map_table=map.map_table;
                }
                args.list=[];
                angular.forEach(rows,function (v) {
                    var item={};
                    item.column_name=v.name;
                    item.data_type=v.type;
                    if(v.type==='expression'){
                        item.expression=Base64.encode(v.expression);
                        item.connect_db=v.connect_db;
                    }else{
                        item.column_value=v.value;
                    }
                    item.bind_name=[];
                    angular.forEach(v.bdList, function (v1) {
                        if(v1){
                            item.bind_name.push(v1);
                        }
                    });
                    item.db_info=v.dbInfo;
                    args.list.push(item);
                });
                var url="/dipserver/save_etl_add_config",result=[];
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            dipT.success('保存成功！');//保存成功！
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                    return result;
                });
            };
            /*
             * 查询etl审计表信息
             * @params {Object} comInfo 通用参数
             * @params {String} uname 用户民
             * @params {String} tname 表名
             * @return {Promise} result
             * */
            this.fetchEtlTransformConfig=function (comInfo,uname,tname) {
                var args={group:comInfo.gn,component_name:comInfo.cid,user:uname,table:tname};
                var url="/dipserver/query_etl_transform_config",result=[];
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            var res=data.response;
                            result.dbs=[];//{db_name:'',db_type:''}
                            result.addList=[];//已添加列表
                            if(res){
                                result.dbs=angular.isArray(res.database)?res.database:[];
                                if(res.list && angular.isArray(res.list)){
                                    angular.forEach(res.list,function (v,i) {
                                        var item={};
                                        item.id=i;
                                        item.name=v.column_name;
                                        item.names=[v.column_name];
                                        item.type=v.data_type;
                                        if(item.type==='string'){
                                            item.value=v.column_value;
                                            item.desc='固定字符串';
                                        }else if(item.type==='sysdata'){
                                            item.value=v.column_value;
                                            item.desc='系统变量';
                                        }
                                        item.checked=false;
                                        result.addList.push(item);
                                    });
                                }
                                result.selectTab=[];
                                if(res.select_tab &&  res.select_tab.length>0){
                                    result.selectTab=res.select_tab;
                                }
                                result.table_prefix=res.table_prefix?res.table_prefix:'';
                                result.table_suffix=res.table_suffix?res.table_suffix:'';
                                result.keep_copy=res.keep_copy?res.keep_copy:'no';
                            }
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                    return result;
                });
            };
            /*
             * 保存etl审计表规则
             *
             * */
            this.saveEtlTransformConfig=function (comInfo,ct,rows,otabs,map,transInfo) {
                var args={group:comInfo.gn,component_name:comInfo.cid,db_type:comInfo.pt,db_component_name:comInfo.pn,user:ct.uname,table:ct.tname};
                if(otabs && angular.isArray(otabs)){
                    args.other_tables=otabs;//应用到其他表
                }else{
                    args.other_tables=[];
                }
                args.map_db_component_name='';
                args.map_db_type='';
                args.map_user='';
                args.map_table='';
                if(map && !$.isEmptyObject(map)){
                    args.map_db_component_name=map.map_db_component_name;
                    args.map_db_type=map.map_db_type;
                    args.map_user=map.map_user;
                    args.map_table=map.map_table;
                }
                args.table_prefix='';
                args.table_suffix='';
                args.keep_copy='';
                if(transInfo && !$.isEmptyObject(transInfo)){
                    args.table_prefix=transInfo.table_prefix;
                    args.table_suffix=transInfo.table_suffix;
                    args.keep_copy=transInfo.keep_copy;
                }
                args.list=[];
                angular.forEach(rows,function (v) {
                    var item={};
                    item.column_name=v.name;
                    item.data_type=v.type;
                    if(v.type==='expression'){
                        item.expression=Base64.encode(v.expression);
                        item.connect_db=v.connect_db;
                    }else{
                        item.column_value=v.value;
                    }
                    item.bind_name=[];
                    angular.forEach(v.bdList, function (v1) {
                        if(v1){
                            item.bind_name.push(v1);
                        }
                    });
                    item.db_info=v.dbInfo;
                    args.list.push(item);
                });
                var url="/dipserver/save_etl_transform_config",result=[];
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            dipT.success('保存成功！');//保存成功！
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                    return result;
                });
            };
            /*
             * 查询etl记录过滤表信息
             * @params {Object} comInfo 通用参数
             * @params {String} uname 用户民
             * @params {String} tname 表名
             * @return {Promise} result
             * */
            this.fetchEtlConditionConfig=function (comInfo, uname, tname) {
                var args={group:comInfo.gn,component_name:comInfo.cid,user:uname,table:tname};
                var url="/dipserver/query_etl_condition_config",result={};
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            var res=data.response;
                            result.addList=[];//已添加列表
                            if(res){
                                if(res.list && angular.isArray(res.list)){
                                    angular.forEach(res.list,function (v,i) {
                                        var item={};
                                        item.id=i;
                                        item.option=v.option?v.option:'no';
                                        item.expression=Base64.decode(v.expression);
                                        if(typeof(item.expression)==='string' && item.expression.length>30){
                                            item.value=item.expression.substring(0,30)+'...';
                                        }else{
                                            item.value= item.expression;
                                        }
                                        item.connect_db = v.connect_db;

                                        item.checked=false;
                                        item.bdList=[];
                                        item.dbInfo={};
                                        if(angular.isArray(v.bind_name)){
                                            item.bdList=v.bind_name;
                                        }
                                        if(v.db_info && angular.isObject(v.db_info)){
                                            item.dbInfo = v.db_info;
                                        }
                                        result.addList.push(item);
                                    });
                                }
                                result.selectTab=[];
                                if(res.select_tab &&  res.select_tab.length>0){
                                    result.selectTab=res.select_tab;
                                }
                            }
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                    return result;
                });
            };
            /*
             * 保存etl记录过滤信息
             * */
            this.saveEtlConditionConfig=function (comInfo,ct,rows,otabs) {
                var args={group:comInfo.gn,component_name:comInfo.cid,db_type:comInfo.pt,db_component_name:comInfo.pn,user:ct.uname,table:ct.tname};
                if(otabs && angular.isArray(otabs)){
                    args.other_tables=otabs;//应用到其他表
                }else{
                    args.other_tables=[];
                }
                args.list=[];
                angular.forEach(rows,function (v) {
                    var item={};
                    item.option=v.option;
                    item.expression=Base64.encode(v.expression);
                    item.connect_db=v.connect_db;
                    item.bind_name=[];
                    angular.forEach(v.bdList, function (v1) {
                        if(v1){
                            item.bind_name.push(v1);
                        }
                    });
                    item.db_info=v.dbInfo;
                    args.list.push(item);
                });
                var url="/dipserver/save_etl_condition_config",result=[];
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            dipT.success('保存成功！');//保存成功！
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                    return result;
                });
            };
            /*
             * 查询删除列信息
             * @params {Object} comInfo 通用参数
             * @params {String} uname 用户民
             * @params {String} tname 表名
             * @return {Promise} result
             * */
            this.fetchEtlDeleteConfig=function (comInfo, uname, tname) {
                var args={group:comInfo.gn,component_name:comInfo.cid,user:uname,table:tname};
                var url="/dipserver/query_etl_delete_config",result={};
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            var res=data.response;
                            result.addList=[];//已添加列表
                            if(res){
                                if(res.list && angular.isArray(res.list)){
                                    angular.forEach(res.list,function (v,i) {
                                        var item={};
                                        item.id=i;
                                        item.name=v.column_name;
                                        item.type=v.column_type;
                                        result.addList.push(item);
                                    });
                                }
                                result.selectTab=[];
                                if(res.select_tab &&  res.select_tab.length>0){
                                    result.selectTab=res.select_tab;
                                }
                            }
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                    return result;
                });
            };
            /*
             * 保存etl删除列信息
             * */
            this.saveEtlDeleteConfig=function (comInfo,ct,rows,otabs) {
                var args={group:comInfo.gn,component_name:comInfo.cid,db_type:comInfo.pt,db_component_name:comInfo.pn,user:ct.uname,table:ct.tname};
                if(otabs && angular.isArray(otabs)){
                    args.other_tables=otabs;//应用到其他表
                }else{
                    args.other_tables=[];
                }
                args.list=[];
                angular.forEach(rows,function (v) {
                    var item={};
                    item.column_name=v.name;
                    item.column_type=v.type;
                    args.list.push(item);
                });
                var url="/dipserver/save_etl_delete_config",result=[];
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            dipT.success('保存成功！');//保存成功！
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function () {
                    dipT.error('网络错误！');//网络错误！
                });
            };
            /*
             * 查询映射列信息
             * @params {Object} comInfo 通用参数
             * @params {String} uname 用户民
             * @params {String} tname 表名
             * @return {Promise} result
             * */
            this.fetchEtlMapConfig=function (comInfo, uname, tname) {
                var args={group:comInfo.gn,component_name:comInfo.cid,user:uname,table:tname};
                var url="/dipserver/query_etl_map_config",result={};
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            var res=data.response;
                            result.addList=[];//已添加列表
                            result.dbs=[];//{db_name:'',db_type:''}
                            if(res){
                                result.dbs=angular.isArray(res.database)?res.database:[];
                                if(res.list && angular.isArray(res.list)){
                                    angular.forEach(res.list,function (v) {
                                        var item={};
                                        item.name=v.column_name;
                                        item.type=v.column_type;
                                        item.map=v.map_name;
                                        item.mapType=v.column_type;
                                        item.value='';
                                        item.expression='';
                                        if(v.expression){
                                            item.expression=Base64.decode(v.expression);
                                        }
                                        if(typeof(item.expression)==='string' && item.expression.length>30){
                                            item.value=item.expression.substring(0,30)+'...';
                                        }else{
                                            item.value= item.expression;
                                        }
                                        item.connect_db=v.connect_db?v.connect_db:'no';
                                        item.bdList=[];
                                        item.dbInfo={};
                                        if(v.bind_name && angular.isArray(v.bind_name)){
                                            item.bdList=v.bind_name;
                                        }
                                        if(v.db_info && angular.isObject(v.db_info)){
                                            item.dbInfo = v.db_info;
                                        }
                                        result.addList.push(item);
                                    });
                                }
                                result.selectTab=[];
                                if(res.select_tab &&  res.select_tab.length>0){
                                    result.selectTab=res.select_tab;
                                }
                            }
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                    return result;
                });
            };
            /*
             * 保存etl映射列
             * */
            this.saveEtlMapConfig=function (comInfo,ct,rows,otabs,map) {
                var args={group:comInfo.gn,component_name:comInfo.cid,db_type:comInfo.pt,db_component_name:comInfo.pn,user:ct.uname,table:ct.tname};
                if(otabs && angular.isArray(otabs)){
                    args.other_tables=otabs;//应用到其他表
                }else{
                    args.other_tables=[];
                }
                args.map_db_component_name='';
                args.map_db_type='';
                args.map_user='';
                args.map_table='';
                if(map && !$.isEmptyObject(map)){
                    args.map_db_component_name=map.map_db_component_name;
                    args.map_db_type=map.map_db_type;
                    args.map_user=map.map_user;
                    args.map_table=map.map_table;
                }
                args.list=[];
                angular.forEach(rows,function (v) {
                    var item={};
                    item.column_name=v.name;
                    item.column_type=v.type;
                    item.map_name=v.map;
                    item.map_type=v.type;
                    item.expression=Base64.encode(v.expression);
                    item.connect_db=v.connect_db;
                    item.bind_name=[];
                    angular.forEach(v.bdList, function (v1) {
                        if(v1){
                            item.bind_name.push(v1);
                        }
                    });
                    item.db_info=v.dbInfo;
                    args.list.push(item);
                });
                var url="/dipserver/save_etl_map_config",result=[];
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            dipT.success('保存成功！');//保存成功！
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                    return result;
                });
            };
            /*
             * 测试数据库连接
             * @params {Object} model 数据库信息
             * @return {Object} promise {Boolean}
             * */
            this.testDbConnect=function (model) {
                var url='/dipserver/test_db_connection';
                var args=angular.copy(model),isPass=false;
                if(args.db_password){
                    args.db_password=tDes.en_des(args.db_password);
                }
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args,0).then(function (data) {//取消测试数据连接超时
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            dipT.success('数据库连接测试成功！');
                            isPass=true;
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return isPass;
                });
            };
            /*
             * 获取操作转换配置信息
             * */
            this.getEtlOperationConfig=function (comInfo,tt,type) {
                var args={group:comInfo.gn,component_name:comInfo.cid,user:tt.uname,table:tt.tname,oper_type:type};
                var url="/dipserver/query_etl_convert",result={};
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            var res=data.response;
                            if(res){
                                result.expression='';
                                if(res.expression){
                                    result.expression=Base64.decode(res.expression);
                                }
                                result.connect_db=res.connect_db?res.connect_db:'no';
                                result.bdList=[];
                                result.dbInfo={};
                                if(res.bind_name && angular.isArray(res.bind_name)){
                                    result.bdList=res.bind_name;
                                }
                                if(res.db_info && angular.isObject(res.db_info)){
                                    result.dbInfo = res.db_info;
                                }
                                result.flags=[];
                                if(res.add_column && angular.isArray(res.add_column)){
                                    angular.forEach(res.add_column,function (v,i) {
                                        result.flags.push({id:i,checked:false,name:v.name,value:v.value});
                                    });
                                }
                                result.selList=[];
                                if(res.column && angular.isArray(res.column)){
                                    angular.forEach(res.column,function (v) {
                                        result.selList.push(v.name);
                                    });
                                }
                            }
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function () {
                    dipT.error('网络错误！');//网络错误！
                    return result;
                });
            };
            /*
             * 保存操作转换配置信息
             * @params {Object} 通用参数
             * @params {Object} 当前库表信息
             * @params {Object} operation 对象信息
             * */
            this.saveEtlOperationConfig=function (comInfo,ct,v) {
                var args={group:comInfo.gn,component_name:comInfo.cid,db_type:comInfo.pt,db_component_name:comInfo.pn,user:ct.uname,table:ct.tname};
                args.operation={};
                args.operation.oper_type=v.oper_type;
                args.operation.expression=Base64.encode(v.expression);
                args.operation.connect_db=v.connect_db;
                args.operation.bind_name=[];
                angular.forEach(v.bdList, function (v1) {
                    if(v1){
                        args.operation.bind_name.push(v1);
                    }
                });
                args.operation.db_info=v.dbInfo;
                if(args.operation.oper_type==='deletetoupdate'){
                    args.reserve_all=v.reserve_all;
                    args.add_column=[];
                    angular.forEach(v.flags,function (v1) {
                        args.add_column.push({name:v1.name,type:'string',source:'string',value:v1.value});
                    });
                    if(args.reserve_all!=='yes'){
                        args.reserve_column=v.newList;
                    }
                }
                var url="/dipserver/save_etl_convert";
                args=md5Ser.md5Data(args);
                httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            dipT.success('保存成功！');//保存成功！
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                });
            };
            /*
             * 获取表过滤列表
             * */
            this.getEtlBglList=function (comInfo,uname) {
                var args={group:comInfo.gn,db_component_name:comInfo.pn,db_type:comInfo.pt,component_name:comInfo.cid,user:uname};
                var url="/dipserver/query_etl_table_filter",result={};
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            var res=data.response;
                            if(res){
                                result.list =res.list;
                                result.flag=(res.flag && typeof(res.flag)==='string')?res.flag.toLowerCase():'include';
                                result.tables=res.tables?res.tables:[];
                            }
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                    return result;
                });
            };
            /*
             * 保存etl表过滤规则
             * */
            this.saveEltBglRule=function (comInfo,list) {
                var args={group:comInfo.gn,component_name:comInfo.cid,list:list};
                var url="/dipserver/save_etl_table_filter";
                args=md5Ser.md5Data(args);
                httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            dipT.success('保存成功！');//保存成功！
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                });
            };
            /*
             * 获取etl操作过滤规则
             * @return {Promise}{Array}
             * */
            this.getEtlCzglList=function (comInfo,uname) {
                var args={group:comInfo.gn,db_component_name:comInfo.pn,db_type:comInfo.pt,component_name:comInfo.cid,user:uname};
                var url="/dipserver/query_etl_operation_filter",result={};
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            var res=data.response;
                            if(res && res.list){
                                result.list=[];
                                if(angular.isArray(res.list)){
                                    angular.forEach(res.list,function (v,i) {
                                        var item={};
                                        item.id=i;
                                        item.name=v.tab_name;
                                        item.tab_ins=v.tab_ins;
                                        item.tab_del=v.tab_del;
                                        item.tab_upt=v.tab_upt;
                                        item.expression=v.expression?Base64.decode(v.expression):'';
                                        item.connect_db=v.connect_db?v.connect_db:'no';
                                        item.bdList=[];
                                        item.dbInfo={};
                                        if(v.bdList && angular.isArray(v.bdList)){
                                            item.bdList=v.bdList;
                                        }
                                        if(v.dbInfo && angular.isObject(v.dbInfo)){
                                            item.dbInfo = v.dbInfo;
                                        }
                                        result.list.push(item);
                                    });
                                }
                            }
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                    return result;
                });
            };
            /*
             * 保存操作过滤规则
             * */
            this.saveEtlCzglRule=function (comInfo,list) {
                var arr=[],newList=angular.copy(list);
                angular.forEach(newList,function (v) {
                    angular.forEach(v.list,function (v1) {
                        if(v1.expression){
                            v1.expression=Base64.encode(v1.expression);
                        }
                    });
                    arr.push({user:v.user,list:v.list});
                });
                var args={group:comInfo.gn,db_component_name:comInfo.pn,db_type:comInfo.pt,component_name:comInfo.cid,list:arr};
                var url="/dipserver/save_etl_operation_filter";
                args=md5Ser.md5Data(args);
                httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            dipT.success('保存成功！');//保存成功！
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                });
            };
            /*
             * 获取批量配置规则
             * */
            this.getBatchRules=function (comInfo,rule) {
                var args={group:comInfo.gn,db_component_name:comInfo.pn,db_type:comInfo.pt,rule_type:rule.rule_type,batch_name:rule.batch_name};
                var url="/dipserver/query_batch_rule",result=[];
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            var res=data.response;
                            if(res && res.rules){
                                if(angular.isArray(res.rules)){
                                    angular.forEach(res.rules,function (v,i) {
                                        var item ={};
                                        item.list=[];
                                        if(v.list && angular.isArray(v.list)){
                                            item.list=v.list;
                                        }
                                        item.id=i;
                                        item.coder=v.coder;
                                        item.checked=false;
                                        item.resered=v.resered?v.resered:'yes';
                                        item.expression=v.expression?Base64.decode(v.expression):'';
                                        item.value=v.value?v.value:'';
                                        item.connect_db=v.connect_db?v.connect_db:'no';
                                        item.bdList=[];
                                        item.dbInfo={};
                                        if(v.bdList && angular.isArray(v.bdList)){
                                            item.bdList=v.bdList;
                                        }
                                        if(v.db_info && angular.isObject(v.db_info)){
                                            item.dbInfo = v.db_info;
                                        }
                                        result.push(item);
                                    });
                                }
                            }
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                    return result;
                });
            };
            /*
             * 保存批量配置规则
             * */
            this.saveBatchRules=function (comInfo,rule_type,batch_name,rules) {
                var args={group:comInfo.gn,db_component_name:comInfo.pn,db_type:comInfo.pt,rule_type:rule_type,batch_name:batch_name,rules:rules};
                var url="/dipserver/save_batch_rule";
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            dipT.success('保存成功！');//保存成功！
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                });
            };
            /*
             * 查询已配置规则名列表
             * */
            this.fetchBatchs=function (comInfo,type) {
                var args={group:comInfo.gn,db_component_name:comInfo.pn,db_type:comInfo.pt,rule_type:type};
                var url="/dipserver/query_batch",result=[];
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            var res=data.response;
                            if(res){
                                if(res.batch_name && angular.isArray(res.batch_name)){
                                    result=res.batch_name;
                                }
                            }
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                    return result;
                });
            };
            /*
             * 查询已配置etl规则
             * */
            this.fetchSettingRule=function (comInfo,type) {
                var args={group:comInfo.gn,db_component_name:comInfo.pn,db_type:comInfo.pt,component_name:comInfo.cid,rule_type:type};
                var url="/dipserver/query_etl_rule_ptable",result=[];
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            var res=data.response;
                            if(type==='table_filter'){
                                if(res && angular.isArray(res.include) && angular.isArray(res.exclude)){
                                    angular.forEach(res.include,function (v) {
                                        result.push({user:v.user,table:v.table,type:'include'});
                                    });
                                    angular.forEach(res.exclude,function (v) {
                                        result.push({user:v.user,table:v.table,type:'exclude'});
                                    });
                                }
                            }else{
                                if(res && res.list){
                                    if(angular.isArray(res.list)){
                                        result=res.list;
                                    }
                                }
                            }
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                    return result;
                });
            };
            /*
             * 获取被选中规则集 etl批量配置规则使用模块
             * */
            this.getBatchCheckedList=function (comInfo,ruleType) {
                var args={group:comInfo.gn,db_component_name:comInfo.pn,db_type:comInfo.pt,component_name:comInfo.cid,rule_type:ruleType};
                var url="/dipserver/query_batch_checked",result=[];
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            var res=data.response;
                            if(res && res.list){
                                if(angular.isArray(res.list)){
                                    angular.forEach(res.list,function (v) {
                                        var item = {};
                                        item.name=v.name?v.name:'';
                                        item.checked=typeof(v.checked==='boolean')?v.checked:false;
                                        item.codes=[];
                                        if(v.codes && angular.isArray(v.codes)){
                                            var arr =angular.extend(v.codes);
                                            angular.forEach(arr,function (v1,i) {
                                                v1.id=i;
                                                v1.checked=false;
                                            });
                                            item.codes=arr;
                                        }
                                        result.push(item);
                                    });
                                }
                            }
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                    return result;
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                    return result;
                });
            };
            /*
             * 保存batch信息 etl批量配置规则使用模块
             * */
            this.saveBatchInfo=function (comInfo,ruleType,list) {
                var newList=[];
                angular.forEach(list,function (v) {
                    if(v.checked){
                        newList.push(v);
                    }
                });
                var args={group:comInfo.gn,db_component_name:comInfo.pn,db_type:comInfo.pt,component_name:comInfo.cid,rule_type:ruleType,batchRules:newList};
                var url="/dipserver/save_batch_codevalue";
                args=md5Ser.md5Data(args);
                httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            dipT.success('保存成功！');//保存成功！
                        }else{
                            dipT.error(data.response.error_msg);
                        }
                    }
                },function (err) {
                    dipT.error('网络错误！');//网络错误！
                });
            };
            /*
             * 获取源端用户列表Tree
             * */
            this.getSourceUserTree=function (comInfo) {
                var args={group:comInfo.gn,db_component_name:comInfo.pn,db_type:comInfo.pt};
                var url="/dipserver/query_etl_user",tree=[];
                args=md5Ser.md5Data(args);
                return httpSer.postDataList(url,args).then(function (data) {
                    if(md5Ser.equalMd5Data(data)){
                        if(data.status){
                            var res=data.response;
                            if(res && angular.isArray(res.user)){
                                angular.forEach(res.user,function (vv,ii) {
                                    var user={id:ii,name:vv,pt:comInfo.pt,pn:comInfo.pn,open:false,isParent:true,children:[]};
                                    tree.push(user);
                                });
                            }
                        }
                    }
                    return tree;
                },function () {
                    return tree;
                });
            };
        }]);
})();