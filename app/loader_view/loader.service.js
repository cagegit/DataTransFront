/**
 * Created by cagej on 2017/4/25.
 */
(function () {
    'use strict';
    angular.module('myApp.loaderService',[])
        .service('ldService',ldService);
    ldService.$inject=['httpService','tipsService','md5Service','$filter'];
    function ldService(httpSer,dipT,md5Ser,$filter) {
        /*
        * 获取loader配置信息
        * */
        this.getLoaderInfo=function (comInfo) {
            var cname =comInfo.cn === 'unnamed' ? '' : comInfo.cn;
            var url = "/dipserver/query_apply_config";
            var args={group_id:comInfo.gn,component_id:comInfo.cid,db_component_id:comInfo.sn,db_type:comInfo.st,type:comInfo.tt,component_name:cname,capture_id:comInfo.cpid},result=null;
            args=md5Ser.md5Data(args);
            return httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        result=data.response;
                    }else{
                        dipT.error((data.response &&　data.response.error_msg));
                    }
                }
                return result;
            });
        };
        /*
        * 生成Xml树需要的数据格式，返回全部列表、包含列表、排除列表
        * */
        this.createApplyTreeList=function(data) {
            var allList = [], inc = [], exc = [],bj = '/img/ico/';
            var createAll = function (uList) {
                var all_arr = [], users = [];
                if (angular.isArray(uList)) {
                    users = uList;
                } else {
                    users.push(uList);
                }
                angular.forEach(users, function (val) {
                    var obj = {};
                    obj.name = val.name;
                    obj.checked = false;
                    obj.type = "user";
                    obj.icon = bj + "schema.png";
                    obj.children = [];
                    all_arr[all_arr.length] = obj;
                    var ary = obj.children;
                    if (!val.object_type) {
                        return;
                    }
                    var tabs = [];
                    if (angular.isArray(val.object_type)) {
                        tabs = val.object_type;
                    } else {
                        tabs.push(val.object_type);
                    }
                    angular.forEach(tabs, function (v) {
                        var ob = {};
                        ob.name = v.name;
                        ob.checked = false;
                        ob.type = "object_type";
                        ob.children = [];
                        ob.icon = bj + "object_type.png";
                        ary[ary.length] = ob;
                        var ary1 = ob.children;
                        if (!v.object) {
                            return;
                        }
                        var ts = [];
                        if (angular.isArray(v.object)) {
                            ts = v.object;
                        } else {
                            ts.push(v.object);
                        }
                        angular.forEach(ts, function (v1) {
                            var o = {};
                            o.name = v1.name;
                            o.checked = false;
                            o.type = "object";
                            o.icon = bj + "object.png";
                            ary1[ary1.length] = o;
                        });
                    });
                });
                return all_arr;
            };
            allList = createAll(data.objects.user);

            var createArr = function (val) {
                var exArr=[];
                if (!val.schema) {
                    return;
                }
                var schemaArr = [];//获取schema列表
                if (angular.isArray(val.schema)) {
                    schemaArr = val.schema;
                } else {
                    schemaArr.push(val.schema);
                }
                angular.forEach(schemaArr, function (v) {
                    var ary = [], obj;
                    var name = v.name;
                    var rname = v.mapping_name;
                    //添加一级到数组
                    if (!rname) {
                        obj = {};
                        obj.name = name;
                        obj.checked = true;
                        obj.replace_schema = null;
                        obj.type = "user";
                        obj.icon = bj + "schema.png";
                        obj.children = [];
                        exArr[exArr.length] = obj;
                        ary = obj.children;
                    } else {
                        obj = {};
                        obj.name = name;
                        obj.checked = true;
                        obj.replace_schema = rname;
                        obj.type = "user";
                        obj.icon = bj + "replace_schema.png";
                        obj.children = [];
                        exArr[exArr.length] = obj;
                        ary = obj.children;
                    }
                    //添加Schema的子元素到数组
                    if (!v.object_type) {
                        return;
                    }
                    var users = [];//添加二级列表到数组
                    if (angular.isArray(v.object_type)) {
                        users = v.object_type;
                    } else {
                        users.push(v.object_type);
                    }
                    angular.forEach(users, function (v1) {
                        var ob = {};
                        ob.name = v1.name;
                        ob.checked = true;
                        ob.type = "object_type";
                        ob.icon = bj + "object_type.png";
                        ob.children = [];
                        ary[ary.length] = ob;
                        var ary2 = ob.children;
                        if (!v1.object) {
                            return;
                        }
                        var tabs = [];//添加三级到数组
                        if (angular.isArray(v1.object)) {
                            tabs = v1.object;
                        } else {
                            tabs.push(v1.object);
                        }
                        angular.forEach(tabs, function (v2) {
                            var o = {}, name = v2.name, rname = v2.mapping_name;
                            //添加Schema到数组
                            if (!rname) {
                                o.name = name;
                                o.checked = true;
                                o.replace_object = null;
                                o.type = "object";
                                o.icon = bj + "object.png";
                                ary2[ary2.length] = o;
                            } else {
                                o.name = name;
                                o.checked = true;
                                o.replace_object = rname;
                                o.type = "object";
                                o.icon = bj + "replace_object.png";
                                ary2[ary2.length] = o;
                            }
                        });
                    });
                });
                return exArr;
            };
            angular.forEach(data.filters.filter,function (val) {
                if(val.filter_type === 'INCLUDE'){
                    inc = createArr(val);
                }else if(val.filter_type === 'EXCLUDE'){
                    exc = createArr(val);
                }
            });
            return {
                all: allList,
                include: inc,
                exclude: exc
            }
        };
        /*
        * 获取对象列表
        * */
        this.getObjectDataList=function (comInfo,treeNode,owner) {
            var url = "/dipserver/query_apply_sourcedb_object";
            var args={group_id:comInfo.gn,type:comInfo.st,db_component_id:comInfo.sn,object_type:treeNode.name,owner:owner},result={res:false,newArr:[],oldArr:[]};
            args=md5Ser.md5Data(args);
            var cval = [];
            return httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        if(!data.response || !data.response.objects){
                            return result;
                        }
                        var ary = [],s = treeNode.manual.isall;
                        var obList = data.response.objects.object;
                        if(angular.isArray(obList)){
                            ary = obList;
                        }else{
                            ary.push(obList);
                        }
                        if(s===true){
                            angular.forEach(ary, function (val) {
                                cval[cval.length] = {name:val,checked:false,replace_object:null};
                            });
                        }else{
                            angular.forEach(ary, function (val) {
                                var obj = null;
                                angular.forEach(treeNode.manual.children, function (vl) {
                                    if (val === vl.name) {
                                        obj = vl;
                                    }
                                });
                                if (obj !== null) {
                                    cval[cval.length] = {name: obj.name, checked: obj.checked, replace_object: obj.replace_object};
                                } else {
                                    cval[cval.length] = {name: val,checked: false,replace_object:null};
                                }
                            });
                        }
                        //正序排序
                        // cval.sort(function(a, b){ return a.name > b.name ? 1 : -1;});
                        //给界面列表赋值
                        var oldArr=[];
                        if(treeNode.manual &&　angular.isArray(treeNode.manual.children)){
                            oldArr=treeNode.manual.children;
                        }
                        result.res=true;
                        result.newArr=cval;
                        result.oldArr=oldArr;
                    }else{
                        dipT.error(data.response.error_msg);
                    }
                }
                return result;
            },function (err) {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        /*
        * 保存loader信息
        * */
        this.saveLoaderInfo=function (comInfo,loaderName,filterArr,params) {
            var url = '/dipserver/add_apply_config';
            var args ={group_id:comInfo.gn,db_component_id:comInfo.sn,component_name:loaderName,type:comInfo.st,filters:{filter:filterArr},parameter:params,component_id:comInfo.cid},result={res:false,comId:'',msg:''};
            args = md5Ser.md5Data(args);
            return httpSer.postDataList(url,args,0).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        result.res=true;
                        result.comId=(data.response && data.response.component_id) || '';
                    }else{
                        // dipT.error((data.response &&　data.response.error_msg));
                        result.msg=data.response.error_msg;
                    }
                }
                return result;
            });
        };
        /*
        * 保存loader高级选项
        * */
        this.saveLoaderSuperProperty=function (comInfo,params) {
            var args={group_id:comInfo.gn,component_id:comInfo.cid,parameter:params},result=false;
            args = md5Ser.md5Data(args);
            var url = '/dipserver/add_apply_property';
            return httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        dipT.success($filter('translate')('Bccg'));//保存成功!
                        result=true;
                    }else{
                        dipT.error(data.response.error_msg);
                    }
                }
                return result;
            },function (err) {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
    }
})();