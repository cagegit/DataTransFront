/**
 * Created by cage on 2016/9/12.
 */
'use strict';
var myApp = angular.module('myApp',['myApp.service','pascalprecht.translate']);
myApp.config(['$httpProvider','$translateProvider','$locationProvider',function($httpProvider,$translateProvider,$locationProvider) {
    $locationProvider.hashPrefix('');//兼容默认Hash不包含！号
    var lang = window.localStorage.lang ||'cn';
    $translateProvider.preferredLanguage(lang);
    $translateProvider.useStaticFilesLoader({
        prefix: './i18n/',
        suffix: '.json'
    });
    // Enable escaping of HTML
    $translateProvider.useSanitizeValueStrategy('escapeParameters');
}]);
myApp.run(['$rootScope','$translate',function ($rootScope,$translate) {
    $rootScope.title='';//Cf_title
    $rootScope.desc='';//Cf_content
    $translate(['Cf_title','Cf_content']).then(function (translations) {
        $rootScope.title = translations.Cf_title;
        $rootScope.desc = translations.Cf_content;
    });
}]);
myApp.controller('configCtrl',['$scope','httpService','tipsService','$window','$timeout','md5Service','$filter','$translate','tDes',function ($scope,httpSer,dipT,$window,$timeout,md5Ser,$filter,$translate,tDes) {
    // 参数说明
    $scope.params ={};
    $scope.property={
        task_identify:"1",
        monitor_ip:"",
        monitor_port:"",
        monitor_interval: "60",
        free_disk_threshold: "80",
        capture_interval_threshold: "",
        listenList:'',

        customer_name: "",
        server_port: "",
        alert_type:'all',
        mail_server:'',
        mail_port:'',
        user:'',
        password:'',
        address_list:'',
        exe_full_path:'',
        method_c:false,
        method_d:true,
        method_sms:false,
        phone_number_list:''
    };
    $scope.user={
        name:'admin',
        auth:'super'
    };
    //错误检测系统
    $scope.err_cf={
        isEdit:false,
        yes:'yes',
        no:'no',
        gly:'admin',
        cjgly:'super_admin'
    };
    $translate(['YES','NO','ADMIN','SUPER_ADMIN']).then(function (ts) {
        $scope.err_cf.yes=ts.YES;
        $scope.err_cf.no=ts.NO;
        $scope.err_cf.gly=ts.ADMIN;
        $scope.err_cf.cjgly=ts.SUPER_ADMIN;
    });
    $scope.err_cfg_edit = function () {
        $scope.err_cf.isEdit=true;
    };
    //查询错误系统
    $scope.queryErrJcxt = function () {
        var args=md5Ser.md5Data({});
        var url = "/dipserver/query_reporter_conf";
        httpSer.postDataList(url,args).then(function (data) {
            if(md5Ser.equalMd5Data(data)){
                if(data.status){
                    var res = data.response;
                    if(res){
                        var cfg = res.report_system;
                        $scope.property.task_identify=cfg.task_identify;
                        $scope.property.monitor_ip=cfg.monitor_ip;
                        $scope.property.monitor_port=cfg.monitor_port;
                        $scope.property.monitor_interval=parseInt(cfg.check_interval)?parseInt(cfg.check_interval):0;
                        $scope.property.free_disk_threshold=parseInt(cfg.free_disk_threshold)?parseInt(cfg.free_disk_threshold):0;
                        //$scope.property.capture_interval_threshold=cfg.capture_interval_threshold;
                        var gp = cfg.unmonitored_group,str ='';
                        if(gp && angular.isObject(gp) &&　gp.group){
                            var arr =[];
                            if(angular.isArray(gp.group)){
                                arr= gp.group;
                            }else if(angular.isString(gp.group)){
                                arr.push(gp.group);
                            }
                            angular.forEach(arr,function (vl,idx) {
                                str+=vl+'\n';
                            });
                        }
                        $scope.property.listenList=str;
                    }
                }else{
                    dipT.error(data.response.error_msg);
                }
            }
        });
    };
    //保存错误系统
    $scope.saveErrJcxt = function () {
        var listenList=[];
        if($scope.property.listenList){
            var arr = $scope.property.listenList.split("\n");
            angular.forEach(arr,function (val) {
                listenList.push({group:val});
            });
        }
        var report_sys={
            task_identify:$scope.property.task_identify,
            monitor_ip:$scope.property.monitor_ip,
            monitor_port:$scope.property.monitor_port,
            check_interval:$scope.property.monitor_interval,
            free_disk_threshold:$scope.property.free_disk_threshold,
            capture_interval_threshold:$scope.property.capture_interval_threshold,
            unmonitored_group:listenList
        };
        var args={report_system: report_sys};
        args=md5Ser.md5Data(args);
        var url = "/dipserver/save_reporter_conf";
        httpSer.postDataList(url,args).then(function (data) {
            if(md5Ser.equalMd5Data(data)){
                if(data.status){
                    dipT.success($filter('translate')('Bccg'));//保存成功！
                    $scope.err_cf.isEdit=false;
                    $scope.queryErrJcxt();
                }else{
                    dipT.error(data.response.error_msg);
                }
            }
        },function (err) {
            dipT.error($filter('translate')('Wlcw'));//网络错误！
        });
    };
    //错误发送系统
    $scope.err_fs={
        isEdit:false,
        backErr:false,
        backErrMsg:''
    };
    $scope.err_fs_edit = function () {
        $scope.err_fs.isEdit=true;
    };
    $scope.mcChange = function () {
        if(!this.property.method_c && !this.property.method_d){
            this.property.method_d=true;
            this.property.exe_full_path='';
            this.property.method='default';
        }else if(this.property.method_c && this.property.method_d){
            this.property.method='all';
        }else if(!this.property.method_c){
            this.property.exe_full_path='';
            this.property.method='default';
        }else{
            this.property.method='self_def';
        }
    };
    //查询错误发送系统配置
    $scope.queryErrSendInfo = function () {
        var args=md5Ser.md5Data({});
        var url = "/dipserver/query_monitor_conf";
        httpSer.postDataList(url,args).then(function (data) {
            if(md5Ser.equalMd5Data(data)){
                if(data.status){
                    var res = data.response;
                    if(res && res.monitor){
                        var mon = res.monitor;
                        $scope.property.customer_name =mon.customer_name;
                        $scope.property.server_port =mon.server_port;
                        $scope.property.alert_type =mon.alert_type;
                        var mail = mon.mail;
                        var sms = mon.sms;
                        var str,arr;
                        if(mail){
                            $scope.property.mail_server =mail.mail_server;
                            $scope.property.mail_port =mail.mail_port;
                            $scope.property.user =mail.user;
                            $scope.property.password =tDes.de_des(mail.password);
                            var clist = mail.address_list;
                            str='';
                            if(clist && clist.address){
                                arr=[];
                                if(angular.isArray(clist.address)){
                                    arr = clist.address;
                                }else if(angular.isString(clist.address)){
                                    arr.push(clist.address);
                                }
                                angular.forEach(arr,function (val) {
                                    str += val+'\n';
                                });
                            }
                            $scope.property.address_list=str;
                        }
                        if(sms && !$.isEmptyObject(sms.phone_number_list)){
                            $scope.property.method_sms=true;
                            var plist =sms.phone_number_list;
                            str='';
                            if(plist && plist.phone_number){
                                arr =[];
                                if(angular.isArray(plist.phone_number)){
                                    arr = plist.phone_number;
                                }else if(angular.isString(plist.phone_number)){
                                    arr.push(plist.phone_number);
                                }
                                angular.forEach(arr,function (val) {
                                    str += val+'\n';
                                });
                            }
                            $scope.property.phone_number_list=str;
                        }else{
                            $scope.property.method_sms=false;
                        }
                    }else{
                        $scope.property.customer_name="";
                        $scope.property.server_port="";
                        $scope.property.alert_type='all';
                        $scope.property.mail_server='';
                        $scope.property.mail_port='';
                        $scope.property.user='';
                        $scope.property.password='';
                        $scope.property.address_list='';
                        $scope.property.exe_full_path='';
                        $scope.property.method_c=false;
                        $scope.property.method_d=true;
                        $scope.property.method_sms=false;
                        $scope.property.phone_number_list='';
                    }
                }else{
                    dipT.error(data.response.error_msg);
                }
            }
        });
    };
    //保存错误发送系统
    $scope.saveErrSendInfo = function () {
        var mail_cfg = function () {
            var ms={};
            ms.mail_server=$scope.property.mail_server;
            ms.mail_port=$scope.property.mail_port;
            ms.user=$scope.property.user;
            ms.password=tDes.en_des($scope.property.password);
            ms.address_list=[];
            var lst = $scope.property.address_list.split("\n");
            angular.forEach(lst, function (val) {
                if (val) {
                    ms.address_list.push({address:val});
                }
            });
            return ms;
        };
        var sms_cfg= function () {
            var ms={};
            ms.send_method={method:'default'};
            ms.phone_number_list=[];
            var lst = $scope.property.phone_number_list.split("\n");
            angular.forEach(lst, function (val) {
                if (val) {
                    ms.phone_number_list.push({phone_number:val});
                }
            });
            return ms;
        };
        var msg_json={};
        msg_json.customer_name=$scope.property.customer_name;
        msg_json.server_port=$scope.property.server_port;
        var clear_tips = function () {
            $timeout(function () {
                $scope.err_fs.backErr=false;
            },2000);
        };
        if(!$scope.property.method_sms){
            msg_json.alert_type='mail';
            msg_json.mail=mail_cfg();
        }else{
            if($scope.property.mail_server && $scope.property.mail_port && $scope.property.user  && $scope.property.password){
                msg_json.alert_type='all';
                msg_json.sms=sms_cfg();
                msg_json.mail=mail_cfg();
                $scope.err_fs.backErr=false;
            }else{
                if(!$scope.property.method_sms){
                    $scope.err_fs.backErr=true;
                    $scope.err_fs.backErrMsg=$filter('translate')('Cf_dxbnwk');//短信列表不能为空！
                    clear_tips();
                    return;
                }else{
                    $scope.err_fs.backErr=false;
                }
                msg_json.alert_type='sms';
                msg_json.sms=sms_cfg();
            }
        }
        var args={monitor:msg_json};
        args=md5Ser.md5Data(args);
        var url = "/dipserver/save_monitor_conf";
        httpSer.postDataList(url,args).then(function (data) {
            if(md5Ser.equalMd5Data(data)){
                if(data.status){
                    dipT.success($filter('translate')('Bccg'));//保存成功！
                    $scope.err_fs.isEdit=false;
                    $scope.queryErrSendInfo();
                }else{
                    dipT.error(data.response.error_msg);
                }
            }
        },function (err) {
            dipT.error($filter('translate')('Wlcw'));//网络错误！
        });
    };
    $scope.outputErrSendInfo = function () {
        var mail_cfg = function () {
            var msg = "<mail>";
            msg += "<mail_server>" + $scope.property.mail_server + "</mail_server>";
            msg += "<mail_port>" +  $scope.property.mail_port + "</mail_port>";
            msg += "<user>" +  $scope.property.user + "</user>";
            msg += "<password>" +  tDes.en_des($scope.property.password) + "</password>";
            msg += "<address_list>";
            var lst = $scope.property.address_list.split("\n");
            angular.forEach(lst, function (val) {
                if (val) {
                    msg += "<address>" + val + "</address>";
                }
            });
            msg += "</address_list>";
            msg += "</mail>";
            return msg;
        };
        var sms_cfg= function () {
            var msg = "<sms><send_method><method>default</method></send_method><phone_number_list>";
            var lst = $scope.property.phone_number_list.split("\n");
            angular.forEach(lst, function (val) {
                if (val) {
                    msg += "<phone_number>" + val + "</phone_number>";
                }
            });
            msg += "</phone_number_list></sms>";
            return msg;
        };
        var msg = "<monitor>";
        msg += "<customer_name>" + $scope.property.customer_name + "</customer_name>";
        msg += "<server_port>" + $scope.property.server_port + "</server_port>";
        if ($scope.property.mail_server && $scope.property.mail_port && $scope.property.user  && $scope.property.password && $scope.property.phone_number_list) {
            msg += "<alert_type>all</alert_type>";
            msg += mail_cfg();
            msg += sms_cfg();
        } else if ($scope.property.mail_server && $scope.property.mail_port && $scope.property.user  && $scope.property.password && !$scope.property.phone_number_list) {
            msg += "<alert_type>mail</alert_type>";
            msg += mail_cfg();
        } else if (!$scope.property.mail_server && !$scope.property.mail_port && !$scope.property.user  && !$scope.property.password && $scope.property.phone_number_list) {
            msg += "<alert_type>sms</alert_type>";
            msg += sms_cfg();
        }
        msg += "</monitor>";
        var modelStr ='<textarea style="width: 100%;height: 200px;"><root>'+msg+'</root></textarea>';
        var dialog = new BootstrapDialog({
            title:$filter('translate')('Cf_dcxx'),//导出信息
            message: $(modelStr),
            type:'type-info',
            closable: true
        });
        dialog.open();
    };
    //文件上传
    $scope.licenseUp = {
        isEnable:true,
        file_name:$filter('translate')('Cf_xzscwj'),//请选择要上传的文件
        status:$filter('translate')('Cf_sczt'),//上传状态
        isDone:1
    };
    $scope.changeSms =function () {
        if(!this.property.method_sms){
            this.property.phone_number_list='';
        }
    };
    $scope.changeBtn = function () {
        var fileObj = null;
        var docObj = document.getElementById("file");
        if (docObj.files && docObj.files[0]) {
            fileObj = docObj.files[0].name;
        } else {
            fileObj=$filter('translate')('Cf_xzscwj');//请选择要上传的文件
        }
        $scope.licenseUp.file_name=fileObj;
        $scope.licenseUp.status =$filter('translate')('Cf_sczt');//上传状态
        $scope.licenseUp.isDone =1;
    };
    $scope.selectFile= function () {
        $('#file').click();
    };
    $scope.uploadFile = function () {
        var docObj = document.getElementById("file");
        var fileObj = null,FileController;
        if (docObj.files && docObj.files[0]) {
            $scope.licenseUp.status =$filter('translate')('Cf_scz');//上传中...
            fileObj = document.getElementById("file").files[0]; // 获取文件对象
            FileController = "/dipserver/upload_licence"; // 接收上传文件的后台地址
            // FormData 对象
            var form = new FormData();
            form.append("file", fileObj);
            // XMLHttpRequest 对象
            var xhr = new XMLHttpRequest();
            xhr.open("post", FileController, true);
            xhr.setRequestHeader('X-XSRF-TOKEN', $.cookie('XSRF-TOKEN'));
            xhr.onload = function () {
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                    var xml = null;
                    var res = JSON.parse(xhr.responseText);
                    if(res.command_return==='SUCCESS'){
                        $scope.licenseUp.status =$filter('translate')('Lcsxcg');//Licence文件上传成功！
                        $scope.licenseUp.file_name=$filter('translate')('Cf_xzscwj');//请选择要上传的文件
                        $scope.licenseUp.isDone =3;
                    }else{
                        $scope.licenseUp.status =res.error_message;
                        $scope.licenseUp.isDone =2;
                    }
                    $scope.$apply();
                } else {
                    dipT.error($filter('translate')('Cf_wlsb'));//网络错误，上传失败！
                    $scope.licenseUp.isDone =1;
                }
            };
            xhr.send(form);
        } else {
            dipT.warning($filter('translate')('Cf_xzscwj'));//请选择要上传的文件！
        }
    };
    $scope.userCfg = {
        isAdd:false,
        isEdit:false,
        panelTitle:$filter('translate')('Cf_yhlb')//用户列表
    };
    $scope.userM ={
        uname:'',
        pass:'',
        cpass:'',
        role:'super'
    };
    $scope.userE = {
        uname:'',
        pass:'',
        cpass:'',
        role:'super'
    };
    $scope.userList=[];
    $scope.addUser = function () {
        $scope.userM.uname='';
        $scope.userM.pass='';
        $scope.userM.cpass='';
        $scope.userM.role='super';
        $scope.userCfg.isAdd=true;
        $scope.userCfg.isEdit=false;
        $scope.userCfg.panelTitle=$filter('translate')('Cf_tjyh');//添加用户
    };
    $scope.saveUserInfo = function () {
        var args={
                user:$scope.userM.uname,
                passwd:tDes.en_des($scope.userM.pass),
                authority:$scope.userM.role,
                founder:'admin',
                type:'add'
            }, url = "/dipserver/dip_manuser_save_user";
        args=md5Ser.md5Data(args);
        httpSer.postDataList(url,args).then(function (data) {
            if(md5Ser.equalMd5Data(data)){
                if(data.status){
                    var index = $scope.userList.length,gly=$filter('translate')('ADMIN');//管理员
                    $scope.userList.push({user:$scope.userM.uname,passwd:$scope.userM.pass,role:$scope.userM.role,authority:gly,index:index});
                    $scope.userCfg.isAdd=false;
                    dipT.success($filter('translate')('Tjcg'));//添加成功！
                }else{
                    dipT.error(data.response.error_msg);
                }
            }
        },function (err) {
            dipT.error($filter('translate')('Wlcw'));//网络错误！
        });
    };
    $scope.saveEditUserInfo = function () {
        var args={
                user:$scope.userE.uname,
                passwd:tDes.en_des($scope.userE.pass),
                authority:$scope.userE.role,
                founder:'admin',
                type:'alter'
            },url="/dipserver/dip_manuser_save_user";
        args=md5Ser.md5Data(args);
        httpSer.postDataList(url,args).then(function (data) {
            if(md5Ser.equalMd5Data(data)){
                if(data.status){
                    $scope.userCfg.isEdit=false;
                    dipT.success($filter('translate')('Xgcg'));//修改成功！
                }else{
                    dipT.error(data.response.error_msg);
                }
            }
        },function (err) {
            dipT.error($filter('translate')('Wlcw'));//网络错误！
        });
    };
    $scope.editUser = function (item) {
        $scope.userCfg.isAdd=false;
        $scope.userCfg.isEdit=true;
        $scope.userCfg.panelTitle=$filter('translate')('Cf_xgyh');//修改用户
        $scope.userE.uname =item.user;
        $scope.userE.role =item.role;
    };
    $scope.deleteUser = function (u) {
        var deleteUser = function () {
            var args={
                    user:u.user,
                    passwd:'',
                    authority:u.role,
                    founder:'admin',
                    type:'del'
                }, url = "/dipserver/dip_manuser_save_user";
            args=md5Ser.md5Data(args);
            httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        $scope.userList.splice(u.index,1);
                        dipT.success($filter('translate')('Sccg'));//删除成功！
                    }else{
                        dipT.error(data.response.error_msg);
                    }
                }
            },function (err) {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        BootstrapDialog.confirm({
            title: $filter('translate')('TIP'),//Dip 提示
            message: $filter('translate')('Cf_qrsc',{uname:u.user}),//确认要删除用户'+u.user+'吗？
            type: BootstrapDialog.TYPE_WARNING,
            closable: false,
            btnCancelLabel: $filter('translate')('CANCEL'),//取消
            btnOKLabel: $filter('translate')('OK'),//确认
            btnOKClass: 'btn-warning',
            callback: function(result) {
                if(result) {
                    deleteUser();
                }
            }
        });
    };
    $scope.queryAllUsers = function () {
        var args=md5Ser.md5Data({founder:'admin'}),url="/dipserver/dip_manuser_query_user";
        httpSer.postDataList(url,args).then(function (data) {
            if(md5Ser.equalMd5Data(data)){
                if(data.status){
                    var res = data.response;
                    if(res && res.list){
                        var arr = [],list=res.list;
                        if(angular.isArray(list)){
                            arr = list;
                        }else if(angular.isObject(list)){
                            arr.push(list);
                        }
                        angular.forEach(arr,function (val,idx) {
                            val.role=val.authority;
                            if(val.authority==='super_admin'){
                                val.authority = $filter('translate')('SUPER_ADMIN');//超级管理员
                            }else{
                                val.authority = $filter('translate')('ADMIN');//管理员
                            }
                            val.index =idx;
                        });
                        $scope.userList = arr;
                    }
                }else{
                    dipT.error(data.response.error_msg);
                }
            }
        });
    };
    
    $scope.cancelAdd = function () {
        $scope.userCfg.isAdd=false;
        $scope.userCfg.panelTitle=$filter('translate')('Cf_yhlb');
        $scope.userM.uname='';
        $scope.userM.pass='';
        $scope.userM.cpass='';
        $scope.userForm.$setPristine()
    };
    $scope.cancelEdit = function () {
        $scope.userCfg.isEdit=false;
        $scope.userCfg.panelTitle=$filter('translate')('Cf_yhlb');
        $scope.userE.pass='';
        $scope.userE.cpass='';
        $scope.userEditForm.$setPristine();
    };
    //是否登录的校验
    var authFail = function () {
        BootstrapDialog.alert({
            title: $filter('translate')('TIP'),//Dip 提示
            message: $filter('translate')('TIMEOUT'),//此页面已过期，请重新登录！
            type: BootstrapDialog.TYPE_WARNING,
            closable: false,
            buttonLabel:$filter('translate')('SURE'),//确定
            callback: function(result) {
                $window.location.href='/login';
            }
        });
    };
    httpSer.getDataList('/isAuth',{}).then(function (res) {
        if(res.isAuth){
            $scope.queryErrJcxt();
            $scope.queryErrSendInfo();
            $scope.queryAllUsers();
            if(res.user){
                $scope.user.name=res.user.name;
            }
        }else{
            authFail();
        }
    },function (err) {
        authFail();
    });
}])
.directive('cpass', [function () {
    return {
        require: "ngModel",
        link: function (scope, ele, attrs, ctrl) {
            ctrl.$validators.cpass = function (modelValue, viewValue) {
                return viewValue===scope.userM.pass;
            }
        }
    };
}])
.directive('epass', [function () {
    return {
        require: "ngModel",
        link: function (scope, ele, attrs, ctrl) {
            ctrl.$validators.epass = function (modelValue, viewValue) {
                return viewValue===scope.userE.pass;
            }
        }
    };
}]);