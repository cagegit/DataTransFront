/**
 * Created by cage on 2016/9/9.
 */
'use strict';
var myapp = angular.module("myApp.service",['toastr','angular-md5']);
myapp.config(function (toastrConfig) {
    angular.extend(toastrConfig, {
        positionClass: 'toast-top-center',
        progressBar:true,
        timeOut:2000
    })
});
// register csrf
myapp.run(['$http', function($http) {
    $http.defaults.headers.common = {"X-XSRF-TOKEN": $.cookie('XSRF-TOKEN')};
}]);
myapp.service("httpService",['$location','$http','$q','$window','toastr','$filter',function($location,$http,$q,$window,toastr,$filter){
        var getHttp= function (url,data,timeout) {
            timeout = timeout===0?0:6000;
            var deffer=$q.defer();
            $http({
                method:"get",
                url:url,
                data:data,
                responseType:'json',
                timeout:timeout
            }).then(function (response) {
                deffer.resolve(response.data,response.status,response.headers,response.config);
            }).catch(function (response) {
                deffer.reject(response.data,response.status,response.headers,response.config);
            });
            return deffer.promise;
        };
        var postHttp= function (url,data,timeout) {
            timeout = timeout===0?0:60000;
            var deffer=$q.defer();
            $http({
                method:"post",
                url:url,
                data:data,
                responseType:'json',
                timeout:timeout
            }).then(function (response) {
                deffer.resolve(response.data,response.status,response.headers,response.config);
            }).catch(function (response) {
                // if(response.status===-1){
                //     if(BootstrapDialog.dialogs && $.isEmptyObject(BootstrapDialog.dialogs)){
                //         BootstrapDialog.alert({
                //             title: $filter('translate')('TIP'),//Dip 提示
                //             message: '网络已经断开，请检查后台服务是否停止！',//网络已经断开，请检查后台服务是否停止！
                //             type: BootstrapDialog.TYPE_WARNING,
                //             closable: false,
                //             buttonLabel: $filter('translate')('OK'),//确定
                //             callback: function() {
                //                 $window.location.href='/logout';
                //             }
                //         });
                //     }
                //     return;
                // }else
                if(response.status===301){
                    if(BootstrapDialog.dialogs && $.isEmptyObject(BootstrapDialog.dialogs)){
                        BootstrapDialog.alert({
                            title: $filter('translate')('TIP'),//Dip 提示
                            message: $filter('translate')('Se_yjcs'),//Session已经超时，请重新登录......
                            type: BootstrapDialog.TYPE_WARNING,
                            closable: false,
                            buttonLabel: $filter('translate')('OK'),//确定
                            callback: function() {
                                $window.location.href='/logout';
                            }
                        });
                    }
                }
                deffer.reject(response.data,response.status,response.headers,response.config);
            });
            return deffer.promise;
        };
        return {
            getDataList:getHttp,
            postDataList:postHttp
        }
    }]);
//系统整体提示控件封装
myapp.service('tipsService',['toastr','$filter','$translate',function (toastr,$filter,$translate) {
    var tt={};
    $translate('TIP').then(function (tip) {
        tt.txt=tip;
    });
    function tipsErr(msg, title, position) {
        msg = msg || "";
        title = title || tt.txt;//Dip 提示
        position = position || {positionClass:"toast-top-center"};
        toastr.error(msg,title);
    }
    function tipsWarning(msg, title, position) {
        msg = msg || "";
        title = title || tt.txt;//Dip 提示
        position = position || {positionClass:"toast-top-center"};
        toastr.warning(msg,title);
    }
    function tipsSuccess(msg, title, position) {
        msg = msg || "";
        title = title || tt.txt;//Dip 提示
        position = position || {positionClass:"toast-top-center"};
        toastr.success(msg,title);
    }
    function tipsInfo(msg, title, position) {
        msg = msg || "";
        title = title || tt.txt;//Dip 提示
        position = position || {positionClass:"toast-top-center"};
        toastr.info(msg,title);
    }
    return {
        error:tipsErr,
        warning:tipsWarning,
        success:tipsSuccess,
        info:tipsInfo
    };
}]);
myapp.service("comService",['httpService',function (httpSer) {
        var comData = null;//控件的属性存储，控件的配置信息
        var comCanvasData = {
            node_id:"",
            com_name:"unnamed",
            db_type:"",
            group_name:""
        };//控件的关键信息，包含：node_id,com_name,group_name
        var session_id = null;
        function setData(data) {
            comData = data;
        }
        function getData() {
            return comData;
        }
        function setCanvasData(data) {
            comCanvasData = data;
        }
        function getCanvasData() {
            return comCanvasData;
        }

        function setSessionId(data) {
            session_id = data;
        }
        function getSessionId() {
            return session_id;
        }
        var dbInfo = null;
        function setP(d) {
            dbInfo = d;
        }
        function getP(d) {
            return dbInfo;
        }
        //保存
        return {
            getComData:getData,
            setComData:setData,
            setCanvasData:setCanvasData,
            getCanvasData:getCanvasData,
            setSessionId:setSessionId,
            getSessionId:getSessionId,
            getP:getP,
            setP:setP
        }
}]);
myapp.service('currentGroupService',function () {
      var groupList=[];
      var curG = null;
      var comInfo= null;//用于存储当前组件信息
      var curGroup = {};
      var curId = '';
      return {
          curGroupName:curG,
          groupList:groupList,
          comInfo: comInfo,
          curGroup:curGroup,
          curId:curId
      }
});
myapp.service('md5Service',['md5','tipsService',function (md5,dipT) {
    this.md5Data = function (data) {
        try {
            var str =JSON.stringify(data);
        }catch(e){
            return null;
        }
        var md5_str= md5.createHash(str);
        return {
            md5:md5_str,
            request:data
        };
    };
    this.equalMd5Data = function (data) {
        try{
            var res='',ck=false;
            if(data.response && (angular.isArray(data.response) || angular.isObject(data.response))){
                res =JSON.stringify(data.response);
            }else if(data.response && angular.isString(data.response)){
                res=data.response;
            }
        }catch(e){
            dipT.error('check md5 error!');
            return false;
        }
        var md_test = md5.createHash(res);
        if(data.md5===md_test){
            return true;
        }else{
            dipT.error('md5 check fail!');
            return false;
        }
    };
}]);
myapp.service('graphicService',['tipsService','md5Service','$filter','httpService',function (dipT,md5Ser,$filter,httpSer) {
    //查找该控件的上一级控件
    function fetch_which_component_connection_to_me(node_id) {
        var obj=null,i=0,cons=r7Plumb.instance.getAllConnections();
        $.each(cons, function (idx, con) {
            if (con.targetId === node_id) {
                var source = $("#" + con.sourceId);
                obj = {};
                obj.type = source.attr("type");
                obj.cname = source.attr("name");
                obj.name = source.attr("realid");
                obj.rtype = source.attr("rtype");
                obj.id = con.sourceId;
                i++;
                if (i >= 2) {
                    return null;
                }
            }
        });
        return obj;
    }
    
    function fetch_apply_source_db(node_id) {
        var obj=null,i=0,k=1,cons=r7Plumb.instance.getAllConnections(),n_start = node_id,num=cons.length;
        while (k) {
            if(num<=0){
                break;
            }
            num--;
            i = 0;
            $.each(cons,function (idx, con) {
                if (con.targetId === n_start) {
                    n_start = con.sourceId;
                    var node = $("#" + con.sourceId);
                    if (node.attr("rtype") === 'database') {
                        obj = {};
                        obj.type = node.attr("type");
                        obj.cname = node.attr("name");
                        obj.name = node.attr("realid");
                        obj.rtype = node.attr("rtype");
                        obj.id = con.sourceId;
                        k = 0;
                    }
                    i = 1;
                }
            });
            if (i === 0) {
                k = 0;
            }
        }
        if (obj === null) {
        }
        return obj;
    }

    function fetch_which_component_connection_from_me(node_id) {
        var obj=null,i = 0;
        var cons = r7Plumb.instance.getAllConnections();
        $.each(cons,function (idx, con) {
            if (con.sourceId === node_id) {
                var node = $("#" + con.targetId);
                obj={};
                obj.id = con.targetId;
                obj.type = node.attr("type");
                obj.cname = node.attr("name");
                obj.name = node.attr("realid");
                obj.rtype = node.attr("rtype");
                i++;
                if (i >= 2) {
                    obj=null;
                }
            }
        });
        return obj;
    }

    function find_relationship() {
        var cons = r7Plumb.instance.getAllConnections(),json_cs={},com;
        var getRelationShip = function (node_id) {
            var obj = {Source:{},Target:{}},source;
            $.each(cons,function (idx, con) {
                //以node_id为源端的控件
                if (con.sourceId === node_id) {
                    obj.Source.to = con.targetId;
                    source = $("#" + con.targetId);
                    obj.Source.type = source.attr("type");
                    obj.Source.name = source.attr("name");
                    obj.Source.rtype = source.attr("rtype");
                    obj.Source.rid = source.attr("realid");
                }
                //以node_id为目标的控件
                if (con.targetId === node_id) {
                    obj.Target.start = con.sourceId;
                    source = $("#" + con.sourceId);
                    obj.Target.type = source.attr("type");
                    obj.Target.name = source.attr("name");
                    obj.Target.rtype = source.attr("rtype");
                    obj.Target.rid = source.attr("realid");
                }
            });
            return obj;
        };
        $('#flowbox').find('.component').each(function (index, val) {
            var node=$(val),type=node.attr("rtype"),obj,relation,node_id=node.attr("id");
            com={
                name:node.attr("name"),
                rid: node.attr("realid"),
                siblings:[]
            };
            var fz = function (obj,type) {
                com.siblings.push({name:obj.name,io_status:type,rid:obj.rid,type:obj.rtype});
            };
            if (type === "apply") {
                if(!json_cs.apply){
                    json_cs.apply=[];
                }
                relation = getRelationShip(node_id);
                obj = relation.Target;
                if (obj && obj.name) {
                    fz(obj,"input");
                }
                obj = relation.Source;
                if (obj && obj.name) {
                    fz(obj,"output");
                }
                json_cs.apply.push(com);
            } else if (type === "capture") {
                if(!json_cs.capture){
                    json_cs.capture=[];
                }
                relation = getRelationShip(node_id);
                obj = relation.Target;
                if (obj && obj.name) {
                    fz(obj,"input");
                }
                obj = relation.Source;
                if (obj && obj.name) {
                    fz(obj,"output");
                }
                json_cs.capture.push(com);
            } else if (type === "etl") {
                if(!json_cs.etlapply){
                    json_cs.etlapply=[];
                }
                relation = getRelationShip(node_id);
                obj = relation.Target;
                if (obj && obj.name) {
                    fz(obj,"input");
                }
                obj = relation.Source;
                if (obj && obj.name) {
                    fz(obj,"output");
                }
                json_cs.etlapply.push(com);
            } else if (type === "mqapply") {
                if(!json_cs.mqapply){
                    json_cs.mqapply=[];
                }
                relation = getRelationShip(node_id);
                obj = relation.Target;
                if (obj && obj.name) {
                    fz(obj,"input");
                }
                obj = relation.Source;
                if (obj && obj.name) {
                    fz(obj,"output");
                }
                json_cs.mqapply.push(com);
            } else if (type === "mq") {
                if(!json_cs.mqpublisher){
                    json_cs.mqpublisher=[];
                }
                relation = getRelationShip(node_id);
                obj = relation.Target;
                if (obj && obj.name) {
                    fz(obj,"input");
                }
                obj = relation.Source;
                if (obj && obj.name) {
                    fz(obj,"output");
                }
                json_cs.mqpublisher.push(com);
            } else if (type === "transfer") {
                if(!json_cs.transfer){
                    json_cs.transfer=[];
                }
                relation = getRelationShip(node_id);
                obj = relation.Target;
                if (obj && obj.name) {
                    fz(obj,"input");
                }
                obj = relation.Source;
                if (obj && obj.name) {
                    fz(obj,"output");
                }
                json_cs.transfer.push(com);
            } else if (type === "ftp") {
                if(!json_cs.transftp){
                    json_cs.transftp=[];
                }
                relation = getRelationShip(node_id);
                obj = relation.Target;
                if (obj && obj.name) {
                    fz(obj,"input");
                }
                obj = relation.Source;
                if (obj && obj.name) {
                    fz(obj,"output");
                }
                json_cs.transftp.push(com);
            } else if (type === "file_load") {
                if(!json_cs.file_load){
                    json_cs.file_load=[];
                }
                relation = getRelationShip(node_id);
                obj = relation.Target;
                if (obj && obj.name) {
                    fz(obj,"input");
                }
                obj = relation.Source;
                if (obj && obj.name) {
                    fz(obj,"output");
                }
                json_cs.file_load.push(com);
            }
        });
        return json_cs;
    }
    //保存视图，有提示
    function Save_Graphics_Alert(groupName) {
        var grapStr =r7Plumb.graphicToStr(),lines = grapStr.json_lines,blocks = grapStr.json_blocks,indexs = grapStr.indexs;
        var relations = find_relationship();
        var url = "/dipserver/add_graphic";
        var graphics={global_index:indexs,line_object:lines,graphic_content:blocks};
        var args ={group:groupName,relation_shape:relations,graphic:graphics};
        args=md5Ser.md5Data(args);
        var initRealId= function (resArr) {
            if(angular.isArray(resArr) && resArr.length>0){
                var coms = $('#flowbox').find('.component');
                angular.forEach(coms,function (vl) {
                    var node =$(vl);
                    angular.forEach(resArr,function (v) {
                        if(node.attr('id')===v.cid){
                            node.attr('realid',v.rid);
                        }
                    });
                });
            }
        };
        return httpSer.postDataList(url,args,0).then(function (data) {
            var res=false;
            if(md5Ser.equalMd5Data(data)){
                if(data.status){
                    dipT.success($filter('translate')('Bccg'));//保存成功！
                    initRealId(data.response);
                    res= true;
                }else{
                    dipT.error(data.response.error_msg);
                    res= false;
                }
            }
            return res;
        },function (err) {
            return false;
        });
    }
    //保存视图，无提示
    function Save_Graphics_No_Alert(groupName) {
        var grapStr =r7Plumb.graphicToStr(),lines = grapStr.json_lines,blocks = grapStr.json_blocks,indexs = grapStr.indexs;
        var relations = find_relationship();
        var url = "/dipserver/add_graphic";
        var graphics={global_index:indexs,line_object:lines,graphic_content:blocks};
        var args ={group:groupName,relation_shape:relations,graphic:graphics};
        args=md5Ser.md5Data(args);
        var initRealId= function (resArr) {
            if(angular.isArray(resArr) && resArr.length>0){
                var coms = $('#flowbox').find('.component');
                angular.forEach(coms,function (vl) {
                    var node =$(vl);
                    angular.forEach(resArr,function (v) {
                        if(node.attr('id')===v.cid){
                            node.attr('realid',v.rid);
                        }
                    });
                });
            }
        };
        return httpSer.postDataList(url,args).then(function (data) {
            initRealId(data.response);
            return data.status;
        },function () {
            return false;
        });
    }
    //获取视图的loader组件信息
    function getLoadersArray() {
        var loaders=[],allComs = $('#flowbox').find('.component');
        angular.forEach(allComs,function (vl) {
            var node = $(vl),loader={};
            if(node.attr('rtype')==='apply' && node.attr('name')!=='unnamed'){
                var obj = fetch_apply_source_db(node.attr('id'));
                if(obj===null || !obj.type || !obj.name){
                    return;
                }
                loader.name = node.attr('realid');
                loader.cname = node.attr('name');
                loader.st =obj.type;
                loader.sn= obj.name;
                loader.cid=node.attr('id');
                loaders.push(loader);
            }
        });
        return loaders;
    }
    function mapToList() {
        var arr =[],coms = $('#flowbox').find('.component');
        angular.forEach(coms,function (vl) {
             var node = $(vl),obj = {id:node.attr('id'),name:node.attr('name'),type:node.attr('rtype'),status:'-',st:'-',temp:'-',scn:'-',insert:'-',update:'-',delete:'-',ddl:'-'};
             arr.push(obj);
        });
        return arr;
    }
    //获取当前组组件名知否有重复
    function checkComsName(newName) {
        if(newName==='unnamed'){
            return false;
        }
        var isNone =false,coms=$('#flowbox').find('.component');
        angular.forEach(coms,function (vl) {
            if($(vl).attr('name')!=='unnamed' && $(vl).attr('name')===newName){
                isNone=true;
            }
        });
        return isNone;
    }
    function getRealIdBySourceId(nodeId, comType) {
        var result = [];
        var appendData = function (tid) {
            if($('#'+tid).attr('rtype') === comType) {
                var readId = $('#'+tid).attr('realid');
                if(readId && readId !== 'undefined') {
                    result.push(readId);
                }
            }
        };
        var bbc = function(beginId) {
            var bb = true;
            var tid = beginId;
            appendData(tid);
            while(bb){
                var newArr = r7Plumb.instance.getConnections({source: tid});
                if(newArr.length>0) {
                    tid = newArr[0].targetId;
                    appendData(tid);
                    angular.forEach(newArr, function(v) {
                        if(v.targetId && v.targetId !== tid) {
                            bbc(v.targetId);
                        }
                    });
                } else {
                    bb = false;
                }
            }
        };
        bbc(nodeId);
        return result;
    }
    return {
        getParent:fetch_which_component_connection_to_me,
        getChild:fetch_which_component_connection_from_me,
        fetch_relations:find_relationship,
        getSource:fetch_apply_source_db,
        save_graphics_alert:Save_Graphics_Alert,
        save_graphics_no_alert:Save_Graphics_No_Alert,
        getLoaders:getLoadersArray,
        getMapList:mapToList,
        checkNames:checkComsName,
        getRealIdBySourceId:getRealIdBySourceId
    };
}]);
myapp.factory('tDes',function () {
    var des ={};
    des.en_des=function(new_pwd) {
        var key = 'a819709ff2d8c096166b1d8b';
        var iv = 'a819709f';
        key = CryptoJS.enc.Utf8.parse(key);
        iv = CryptoJS.enc.Utf8.parse(iv);
        var encrypted=CryptoJS.TripleDES.encrypt(new_pwd, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        return encrypted.toString();
    };
    des.de_des=function (str) {
        var key = 'a819709ff2d8c096166b1d8b';
        var iv = 'a819709f';
        key = CryptoJS.enc.Utf8.parse(key);
        iv = CryptoJS.enc.Utf8.parse(iv);
        var encrypted = CryptoJS.TripleDES.decrypt(str, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        return encrypted.toString(CryptoJS.enc.Utf8) || str;
    };
    return des;
});