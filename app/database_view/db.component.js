/**
 * Created by cagej on 2017/4/24.
 */
(function () {
    'use strict';
    angular.module("myApp.dbComponent",['ngSanitize'])
    .component("dbStatus",{
        templateUrl:'database_view/status.component.html',
        bindings:{
            dl: '<'
        },
        controller:['$stateParams','tipsService','$filter','$state','dbService',function ($stateParams,dipT,$filter,$state,dbService) {
             var $ctrl=this;
            $ctrl.data={
                cb:"all",
                testing:false,
                dbTestInfo:$filter('translate')('Db_cszsqy'),//测试数据库连接信息测试展示区域
                gd:{
                    status:"",
                    message:""
                },
                dbv:{
                    status:"",
                    message:""
                },
                auth:{
                    status:"",
                    message:""
                },
                dbms:{
                    status:"",
                    message:""
                },
                bcrz:{
                    status:"",
                    message:""
                }
            };
            $ctrl.real={
                comId:'',
                yes:$filter('translate')('YES'),
                no:$filter('translate')('NO')
            };
            $ctrl.property = {};
             $ctrl.$onInit =function () {
                 if($ctrl.dl && angular.isObject($ctrl.dl)){
                     $ctrl.property = $ctrl.dl;
                     $ctrl.real.comId=$stateParams.cid;
                 }else{
                     $state.go('/');
                 }
             };
            $ctrl.isTesting=false;
            $ctrl.testDbInfo = function () {
                var pro = $ctrl.property;
                if(!pro.dbName || !pro.dbType || !pro.serviceName || !pro.ipAddress || !pro.port || !pro.uName || !pro.uPwd ){
                    dipT.error($filter('translate')('Db_pzxx'));//您的数据库配置信息尚未完善！
                    return ;
                }
                $ctrl.isTesting=true;
                $ctrl.data.testing=false;
                $ctrl.data.dbTestInfo=$filter('translate')('Db_zzcs');//正在测试数据库环境...
                dbService.testDbConnection(pro).then(function (res) {
                    if(res){
                        testDatabaseEnv(pro).finally(function () {
                            $ctrl.isTesting=false;
                        });
                    }else{
                        $ctrl.isTesting=false;
                        $ctrl.data.dbTestInfo='<p class="db-test-danger">'+$filter('translate')('Db_cssb')+'</p>';//测试数据库环境失败，请检查您的配置信息是否正确！
                    }
                },function () {
                    $ctrl.isTesting=false;
                    $ctrl.data.dbTestInfo='<p class="db-test-danger">'+$filter('translate')('Db_cssb')+'</p>';//测试数据库环境失败，请检查您的配置信息是否正确！
                });
            };
            function testDatabaseEnv(pro) {
                return dbService.testDbSourceEnv(pro).then(function (result) {
                    if(result.res){
                        $ctrl.data.testing=true;
                        var info = result.info;
                        $ctrl.data.gd = info.archive_mode;
                        $ctrl.data.dbv = info.version;
                        $ctrl.data.auth = info.user_priv;
                        $ctrl.data.dbms = info.dbms_priv;
                        $ctrl.data.bcrz = info.spmt_log;
                    }else{
                        $ctrl.data.dbTestInfo=$filter('translate')('Db_cssb');//测试数据库环境失败，请检查您的配置信息是否正确！
                    }
                });
            }
            $ctrl.changeBc = function () {}
        }]
    })
    .component("dbProperty",{
        templateUrl:'database_view/property.component.html',
        bindings:{
            dl: '<'
        },
        controller:['$stateParams','$state','tipsService','graphicService','$filter','$rootScope','dbService',function ($stateParams,$state,dipT,gSer,$filter,$rootScope,dbService) {
            var $ctrl=this;
            var comInfo = $stateParams;
            $ctrl.number =0;
            $ctrl.data={
                cb:"all",
                scripts:"",
                testing:false,
                dbTestInfo:$filter('translate')('Db_cszsqy'),//测试数据库连接信息测试展示区域
                gd:{
                    status:"",
                    message:""
                },
                dbv:{
                    status:"",
                    message:""
                },
                auth:{
                    status:"",
                    message:""
                },
                dbms:{
                    status:"",
                    message:""
                },
                bcrz:{
                    status:"",
                    message:""
                }
            };
            $ctrl.params={};
            $ctrl.property={
                bh:'no',
                port:1521,
                dbType:'oracle'
            };
            $ctrl.model={
                modelCk:'',
                isModel:'no',
                mdName:'',
                modelList:[]
            };
            //Dip支持的数据库类型
            $ctrl.allowDbs=['oracle','db2','sqlserver','gbase-8a','mysql','informix','sybase','altibase','postgresql','oscar','dameng','kingbase','vertica','dbone','kdb'];
            //组件名只读
            $ctrl.real={
                comId:''
            };
            $ctrl.isSaving=false;//正在保存
            var saveTxt=$filter('translate')('SAVE');
            var savingTxt=$filter('translate')('SAVING');
            $ctrl.saveBtnTxt=saveTxt;
            $ctrl.$onInit =function () {
                if($ctrl.dl===null){
                    $state.go('/');
                }else{
                    if($ctrl.dl && $ctrl.dl!=='init'){
                        $ctrl.property=$ctrl.dl;
                        if(!$ctrl.property.bh)$ctrl.property.bh='no';
                        $ctrl.real.comId=comInfo.cid;
                    }
                    $ctrl.getDbModels();
                }
            };
            // $scope.$emit("statusChange", "property");
            //获取模板列表
            $ctrl.getDbModels = function () {
                dbService.getModelList().then(function (list) {
                    $ctrl.model.modelList=list;
                });
            };
            var dbTree ={
                dbTreeObj:null,
                zTreeNodes:[],
                setting: {
                    isSimpleData: false,
                    showLine: true,
                    check: {
                        enable: true
                    },
                    callback: {
                        onClick: function () {}
                    }
                }
            };
            //是否保存模板的切换
            $ctrl.modelIsCheck = function () {
                if($ctrl.model.isModel==='no'){
                    $ctrl.model.mdName='';
                }
            };
            //保存数据库信息
            $ctrl.saveDbInfo = function () {
                var n_com_name = $ctrl.property.dbName;
                if(n_com_name==='unnamed'){
                    dipT.error($filter('translate')('Db_mcbnk'));//数据库名称不能为unnamed！
                    return;
                }
                var db_type = this.property.dbType;
                var arr = $ctrl.model.modelList,flag=false;
                if($ctrl.model.isModel==='yes' && !$ctrl.model.mdName){
                    dipT.error($filter('translate')('Db_tip23'));//模板名称不能为空
                    return;
                }else if($ctrl.model.isModel==='yes' && $ctrl.model.mdName){
                    angular.forEach(arr,function (val) {
                        if(val.db_name===$ctrl.model.mdName){
                            flag=true;
                        }
                    });
                }
                if(flag && $ctrl.model.isModel==='yes'){
                    dipT.error($filter('translate')('Db_mbmccf'));//模板名称重复，请使用其他模板名称！
                    return;
                }
                $ctrl.isSaving=true;
                $ctrl.saveBtnTxt=savingTxt;
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
                dbService.saveDbInfo(comInfo,db_type,$ctrl.property).then(function (result) {
                     if(result.res){
                         // dipT.success($filter('translate')('Bccg'));//保存成功！
                         $ctrl.real.comId=result.comId;
                         var node = $("#" + comInfo.id);
                         node.attr("realid", $ctrl.real.comId);
                         node.attr("type", db_type);
                         node.find(".dragPoint").text(n_com_name);
                         node.attr("name", n_com_name);
                         node.attr("title", db_type);
                         gSer.save_graphics_no_alert(comInfo.gn).finally(function () {
                             closeAlert(true);
                         });
                         if($ctrl.model.isModel==='yes' && $ctrl.model.mdName){
                             saveToModel();
                         }
                         $state.go('/');
                     }else{
                         closeAlert(false,result.msg);
                     }
                }).catch(function () {
                    closeAlert(false);
                }).finally(function () {
                    $ctrl.isSaving=false;
                    $ctrl.saveBtnTxt=saveTxt;
                });
            };
            $ctrl.isTesting=false;
            $ctrl.testDbInfo = function () {
                var pro = $ctrl.property;
                if(!pro.dbType || !pro.serviceName || !pro.ipAddress || !pro.port || !pro.uName || !pro.uPwd ){
                    dipT.error($filter('translate')('Db_pzxx'));//您的数据库配置信息尚未完善！
                    return ;
                }
                $ctrl.isTesting=true;
                $ctrl.data.testing=false;
                $ctrl.data.dbTestInfo=$filter('translate')('Db_zzcs');//正在测试数据库环境...
                dbService.testDbConnection(pro).then(function (res) {
                    if(res){
                        testDatabaseEnv(pro).finally(function () {
                            $ctrl.isTesting=false;
                        });
                    }else{
                        $ctrl.isTesting=false;
                        $ctrl.data.dbTestInfo='<p class="db-test-danger">'+$filter('translate')('Db_cssb')+'</p>';//测试数据库环境失败，请检查您的配置信息是否正确！
                    }
                },function () {
                    $ctrl.isTesting=false;
                    $ctrl.data.dbTestInfo='<p class="db-test-danger">'+$filter('translate')('Db_cssb')+'</p>';//测试数据库环境失败，请检查您的配置信息是否正确！
                });
            };
            function testDatabaseEnv(pro) {
                return dbService.testDbSourceEnv(pro).then(function (result) {
                      if(result.res){
                          $ctrl.data.testing=true;
                          var info = result.info;
                          $ctrl.data.gd = info.archive_mode;
                          $ctrl.data.dbv = info.version;
                          $ctrl.data.auth = info.user_priv;
                          $ctrl.data.dbms = info.dbms_priv;
                          $ctrl.data.bcrz = info.spmt_log;
                      }else{
                          $ctrl.data.dbTestInfo=$filter('translate')('Db_cssb');//测试数据库环境失败，请检查您的配置信息是否正确!
                      }
                });
            }
            //预处理脚本
            $ctrl.createScript = function () {
                createScripts(dbTree.dbTreeObj);
            };
            //获取单选按钮切换事件
            $ctrl.changeBc = function () {
                createDbTree(dbTree);
            };
            //切换数据库模板
            $ctrl.changeMb = function () {
                var db=$ctrl.model.modelCk;
                if(db && db.db_name){
                    angular.forEach($ctrl.model.modelList,function (val) {
                        if(val.db_name===db.db_name){
                            $ctrl.property.dbType=val.db_type;
                            $ctrl.property.ipAddress=val.db_ip;
                            $ctrl.property.port=val.db_port;
                            $ctrl.property.uName=val.db_user;
                            $ctrl.property.uPwd=val.db_password;
                            $ctrl.property.serviceName=val.db_id;
                        }
                    });
                }else{
                    $ctrl.property.ipAddress='';
                    $ctrl.property.port='1521';
                    $ctrl.property.uName='';
                    $ctrl.property.uPwd='';
                    $ctrl.property.serviceName='';
                    $ctrl.property.bh='no';
                }
            };

            function createScripts(dbTreeObj) {
                var txt = "";
                var item = $ctrl.data.cb;
                if (item === 'all') {
                    txt = 'Alter database add supplemental log data  (primary key,unique index) columns;';
                } else if (item === 'table') {
                    if (dbTreeObj === null) {
                        return;
                    }
                    txt = "";
                    var dat = dbTreeObj.getCheckedNodes();
                    angular.forEach(dat, function (val) {
                        if (val.level === 0) {
                            var u_name = val.name;
                            angular.forEach(val.children, function (val1) {
                                if (val1.checked === true) {
                                    txt += 'alter table ' + u_name + '.' + val1.name + ' add supplemental log data  (primary key,unique index) columns;\n';
                                }
                            });
                        }
                    });
                }
                $ctrl.data.scripts = txt;
            }

            function createDbTree(dbTree) {
                var item = $ctrl.data.cb,objTree = $("#objTree"),pro=$ctrl.property;
                if (item === "all") {
                    objTree.hide();
                } else if (item === "table") {
                    if (dbTree.dbTreeObj === null) {
                        if(!pro.dbType || !pro.ipAddress || !pro.port || !pro.uName || !pro.uPwd || !pro.serviceName){
                            return;
                        }
                        dbService.fetchYclTable(pro).then(function (nd) {
                            objTree.empty();
                            dbTree.zTreeNodes = nd;
                            dbTree.dbTreeObj = $.fn.zTree.init(objTree, dbTree.setting, dbTree.zTreeNodes);
                            objTree.show();
                        });
                    }else{
                        objTree.show();
                    }
                }
            }
            //保存为模板指令
            function saveToModel() {
                dbService.saveModelInfo($ctrl.model,$ctrl.property).then(function (res) {
                    if(res){
                        var pro =$ctrl.property,obj={};
                        obj.db_name=$ctrl.model.mdName;
                        obj.db_type=pro.dbType;
                        obj.db_ip=pro.ipAddress;
                        obj.db_port=pro.port;
                        obj.db_user=pro.uName;
                        obj.db_password=pro.uPwd;
                        obj.db_id=pro.serviceName;
                        obj.as_source_db='yes';
                        $rootScope.$emit("createModel",obj);
                    }
                });
            }
            $ctrl.changeDbType=function () {
                var item =$ctrl.property.dbType;
                if(item!=='sqlserver'){
                    $ctrl.sqlEnv.isSqlSer=false;
                }
                if(item!=='oracle'){
                    $ctrl.sqlEnv.isOracle=false;
                }
                switch (item) {
                    case "oracle":
                        $ctrl.property.port='1521';
                        break;
                    case "sqlserver":
                        $ctrl.property.port='1433';
                        break;
                    case "db2":
                        $ctrl.property.port='60000';
                        break;
                    case "gbase-8a":
                        $ctrl.property.port='5258';
                        break;
                    case "mysql":
                        $ctrl.property.port='3306';
                        break;
                    case "informix":
                        $ctrl.property.port='1000';
                        break;
                    case "sybase":
                        $ctrl.property.port='1000';
                        break;
                    case "altibase":
                        $ctrl.property.port='20300';
                        break;
                    case "postgresql":
                        $ctrl.property.port='5432';
                        break;
                    case "oscar":
                        $ctrl.property.port='1000';
                        break;
                    case "dameng":
                        $ctrl.property.port='5236';
                        break;
                    case "kingbase":
                        $ctrl.property.port='1000';
                        break;
                    case "vertica":
                        $ctrl.property.port='5433';
                        break;
                    case "dbone":
                        $ctrl.property.port='9001';
                        break;
                    case "kdb":
                        $ctrl.property.port='1000';
                        break;
                    default:
                        $ctrl.property.port='1521';
                }
            };
            $ctrl.sqlEnv ={
                logHf:{
                    status:'简单',
                    isDone:false
                },
                bgbh:{
                    status:'未启用',
                    isDone:false
                },
                bypz:{
                    status:'未完成',
                    isDone:false
                },
                reset:true,
                isSqlSer:false,
                isOracle:false
            };
            var sqlArgs=null;//sqlserver 必要环境准备的其他参数
            $ctrl.toSqlEfg=function () {
                if($ctrl.property.dbType==='oracle'){
                    $ctrl.sqlEnv.isOracle=!$ctrl.sqlEnv.isOracle;
                }else if($ctrl.property.dbType==='sqlserver'){
                    $ctrl.sqlEnv.isSqlSer=!$ctrl.sqlEnv.isSqlSer;
                    if($ctrl.sqlEnv.isSqlSer){
                        $ctrl.sqlEnvCfg();
                    }
                }
            };
            //sqlServer 必要环境准备
            $ctrl.sqlEnvCfg= function () {
                dbService.sqlCfgEnv(comInfo,$ctrl.property).then(function (result) {
                    if(result.res){
                        var res=result.data;
                        if(res.recover_status==='yes'){
                            $ctrl.sqlEnv.logHf.status='完整';
                            $ctrl.sqlEnv.logHf.isDone=true;
                        }else{
                            $ctrl.sqlEnv.logHf.status='简单';
                            $ctrl.sqlEnv.logHf.isDone=false;
                        }
                        if(res.cdc_status==='yes'){
                            $ctrl.sqlEnv.bgbh.status='已启用';
                            $ctrl.sqlEnv.bgbh.isDone=true;
                        }else{
                            $ctrl.sqlEnv.bgbh.status='未启用';
                            $ctrl.sqlEnv.bgbh.isDone=false;
                        }
                        if(res.r7_status==='yes'){
                            $ctrl.sqlEnv.bypz.status='已完成';
                            $ctrl.sqlEnv.bypz.isDone=true;
                        }else{
                            $ctrl.sqlEnv.bypz.status='未完成';
                            $ctrl.sqlEnv.bypz.isDone=false;
                        }
                        //重置按钮是否可用
                        $ctrl.sqlEnv.reset=res.rollback==="no";
                        //其他返回值赋值
                        sqlArgs=res.r7;
                    }
                });
            };
            //日志恢复模式 启用变更捕获 R7必要配置
            $ctrl.start_sql_log = function () {
                $ctrl.sqlEnv.logHf.status='操作中...';
                dbService.startRecoverMode(comInfo,$ctrl.property).then(function (res) {
                    if(res){
                        $ctrl.sqlEnv.logHf.status='已启用';
                        $ctrl.sqlEnv.logHf.isDone=true;
                    }else{
                        $ctrl.sqlEnv.logHf.status='操作失败';
                    }
                },function () {
                    $ctrl.sqlEnv.logHf.status='操作失败';
                });
            };
            $ctrl.start_sql_cdc = function () {
                $ctrl.sqlEnv.bgbh.status='操作中...';
                dbService.startCdc(comInfo,$ctrl.property).then(function (res) {
                    if(res){
                        $ctrl.sqlEnv.bgbh.status='完整';
                        $ctrl.sqlEnv.bgbh.isDone=true;
                    }else{
                        $ctrl.sqlEnv.bgbh.status='操作失败';
                    }
                },function () {
                    $ctrl.sqlEnv.bgbh.status='操作失败';
                });
            };
            $ctrl.start_sql_r7 = function () {
                var r7Args=sqlArgs?sqlArgs:{r7_table:'',r7_pro:'',r7_tri:'',r7_ms_tri:'',r7_cap:'',r7_clean:''};
                $ctrl.sqlEnv.bypz.status='操作中...';
                dbService.addR7Cdc(comInfo,$ctrl.property,r7Args).then(function (res) {
                    if(res){
                        $ctrl.sqlEnv.bypz.status='已完成';
                        $ctrl.sqlEnv.bypz.isDone=true;
                    }else{
                        $ctrl.sqlEnv.bypz.status='操作失败';
                    } 
                },function () {
                    $ctrl.sqlEnv.bypz.status='操作失败';
                });
            };
            //重置sqlserver环境配置
            $ctrl.resetSqlCfg=function () {
                BootstrapDialog.confirm({
                    title: 'Dip 提示',//Dip 提示
                    message: '确认要重置sqlServer必要环境吗？',//确认要重置sqlServer必要环境吗？
                    type: BootstrapDialog.TYPE_WARNING,
                    btnCancelLabel: '取消',//取消
                    btnOKLabel: '确认',//确认
                    btnOKClass: 'btn-warning',
                    callback: function(result) {
                        if(result){
                            dbService.sqlCfgRollback($ctrl.property).then(function (res) {
                                if(res){
                                    $ctrl.sqlEnvCfg();
                                }
                            });
                        }
                    }
                });
            };
        }]
    })
    .component('dbModel',{
        templateUrl:'database_view/dbModel.component.html',
        controller:['$stateParams','tipsService','$filter','$state','dbService','$rootScope',function ($stateParams,dipT,$filter,$state,dbService,$rootScope) {
            var $ctrl=this;
            $ctrl.menu = {
                dialog:true,
                mc:1
            };
            $ctrl.property={};
            $ctrl.$onInit =function () {
                var val =$stateParams.model;
                if(val){
                    $ctrl.property=val;
                }else{
                    $state.go('/');
                }
            };
            $ctrl.redirectTo = function (url) {
                $state.go(url);
            };
            //删除数据源
            $ctrl.deleteModelDb = function () {
                var deleteCom = function () {
                    dbService.deleteDbModel($ctrl.property.db_name).then(function (res) {
                        if(res){
                            $rootScope.$emit("deleteModel",{});
                            dipT.success($filter('translate')('Bccg'));//删除成功！
                            $state.go('/');
                        }
                    });
                };
                BootstrapDialog.confirm({
                    title: $filter('translate')('TIP'),//Dip 提示
                    message: $filter('translate')('Db_qrscmb'),//确认要删除该数据库模板吗？
                    type: BootstrapDialog.TYPE_WARNING,
                    closable: false,
                    btnCancelLabel: $filter('translate')('CANCEL'),//取消
                    btnOKLabel: $filter('translate')('OK'),//确认
                    btnOKClass: 'btn-warning',
                    callback: function(result) {
                        if(result) {
                            deleteCom();
                        }
                    }
                });
            };
        }]
    });
}());