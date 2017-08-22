/**
 * Created by cagej on 2017/4/24.
 */
(function () {
    'use strict';
    angular.module("myApp.dbService",[])
        .service("dbService",dbService);
    dbService.$inject=['httpService','tipsService','md5Service','$filter','tDes'];
    function dbService(httpSer,dipT,md5Ser,$filter,tDes) {
          /*
          * 查询database配置信息
          * */
          this.getDbInfo=function (comInfo) {
              var args={group:comInfo.gn,component_id:comInfo.cid},url = "/dipserver/query_db_info",result=null;
              args=md5Ser.md5Data(args);
              return httpSer.postDataList(url,args).then(function (data) {
                  if(md5Ser.equalMd5Data(data)){
                      if(data.status){
                          var ms = {},res=data.response;
                          ms.dbName=res.component_name;
                          ms.bh=res.as_source_db;
                          ms.dbType=res.db_type;
                          ms.serviceName=res.db_id;
                          ms.ipAddress=res.db_ip;
                          ms.port=res.db_port;
                          ms.uName=res.db_user;
                          ms.uPwd=tDes.de_des(res.db_password);
                          result=ms;
                      }else{
                          data.response && dipT.error(data.response.error_msg);
                      }
                  }
                  return result;
              },function () {
                  dipT.error($filter('translate')('Wlcw'));////网络错误！
              });
          };
          /*
          * 测试数据库连接
          * */
          this.testDbConnection=function (pro) {
              var url='/dipserver/test_db_connection';
              var args={db_type:pro.dbType,db_ip:pro.ipAddress,db_port:pro.port,db_user:pro.uName,db_password:tDes.en_des(pro.uPwd),db_id:pro.serviceName},result=false;
              console.log(args);
              args=md5Ser.md5Data(args);
              return httpSer.postDataList(url,args,0).then(function (data) {
                  if(md5Ser.equalMd5Data(data)){
                      if(data.status){
                          result=true;
                      }else{
                          // dipT.error(data.response.error_msg);
                          console.log(data.response.error_msg);
                      }
                  }
                  return result;
              });
          };
        /*
         * 测试数据库环境
         * */
          this.testDbSourceEnv=function (pro) {
            var envUrl = "/dipserver/check_sourcedb_env";
            var envArgs={db_is_source:pro.bh,db_type:pro.dbType,db_ip:pro.ipAddress,db_port:pro.port,db_user:pro.uName,db_password:tDes.en_des(pro.uPwd),db_id:pro.serviceName}
            ,result={res:false,info:{}};
            envArgs=md5Ser.md5Data(envArgs);
            return httpSer.postDataList(envUrl,envArgs).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        result.res=true;
                        result.info=data.response || {};
                    }else{
                        // dipT.error(data.response.error_msg);
                        console.log(data.response.error_msg);
                    }
                }
                return result;
            });
        };
        /*
         * 查询模板列表
         * */
          this.getModelList=function () {
            var args=md5Ser.md5Data({});
            var url = "/dipserver/query_fav_db",result=[];
            return httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        var res = data.response;
                        if(res && res.fav_dbs){
                            var dbs = res.fav_dbs.db,arr =[];
                            if(angular.isArray(dbs)){
                                arr =dbs;
                            }else if(angular.isObject(dbs)){
                                arr.push(dbs);
                            }
                            angular.forEach(arr,function (v) {
                                if(v.db_password){
                                    v.db_password=tDes.de_des(v.db_password);
                                }
                            });
                            arr.unshift({db_name:'',db_type:''});
                            result=arr;
                        }
                    }
                }
                return result;
            });
        };
         /*
         * 保存数据库信息
         * */
          this.saveDbInfo=function (comInfo,db_type,property) {
              var args = {group:comInfo.gn,component_name:property.dbName,db_type:db_type,db_ip:property.ipAddress
                  ,db_port:property.port,db_user:property.uName,db_password:tDes.en_des(property.uPwd),db_id:property.serviceName,as_source_db:property.bh,component_id:comInfo.cid};
              args = md5Ser.md5Data(args);
              var url = "/dipserver/save_db_info",result={res:false,comId:'',msg:''};
              return httpSer.postDataList(url,args).then(function (data) {
                  if(md5Ser.equalMd5Data(data)){
                      if(data.status){
                          result.res=true;
                          if(data.response){
                              result.comId=data.response.component_id;
                          }
                      }else{
                          // dipT.error((data.response && data.response.error_msg));
                          result.msg=data.response.error_msg;
                      }
                  }
                  return result;
              });
          };
          /*
          * 保存模板信息
          * */
          this.saveModelInfo=function (model,property) {
              var args ={db_name:model.mdName,db_type:property.dbType,db_ip:property.ipAddress,db_port:property.port,db_user:property.uName,db_password:tDes.en_des(property.uPwd),db_id:property.serviceName,as_source_db:'yes'};
              args=md5Ser.md5Data(args);
              var url = "/dipserver/add_fav_db",result=false;
              return httpSer.postDataList(url,args).then(function (data) {
                  if(md5Ser.equalMd5Data(data)){
                      if(data.status){
                          result=true;
                      }
                  }
                  return result;
              });
          };
        /*
         * 获取预处理表格
         * @param{Object} pro 数据库属性
         * @return{Promise} Angular.promise => data:Array
         * */
          this.fetchYclTable=function(pro) {
            var args={db_type:pro.dbType,db_ip:pro.ipAddress,db_port:pro.port,db_user:pro.uName,db_password:tDes.en_des(pro.uPwd),db_id:pro.serviceName};
            args =md5Ser.md5Data(args);
            var yclArr = [],url = "/dipserver/query_db_table";
            return httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        var tabList = data.response || [];
                        var num =0;
                        angular.forEach(tabList,function (val,key) {
                            var pnode ={},flag=0;
                            pnode.name=key;
                            pnode.icon='/img/ico/schema.png';
                            pnode.children=[];
                            pnode.id=++num;
                            if(val.table && angular.isArray(val.table)){
                                angular.forEach(val.table,function (vv) {
                                    var snode={},snum=0;
                                    snode.name=vv.name;
                                    snode.checked=vv.sup_log==='yes';
                                    if(snode.checked){
                                        flag++;
                                    }
                                    snode.icon='/img/ico/object.png';
                                    snode.id=++snum;
                                    pnode.children.push(snode);
                                })
                            }
                            pnode.checked = flag > 0;
                            yclArr.push(pnode);
                        });
                    }else{
                        dipT.error((data.response && data.response.error_msg));
                    }
                }
                return yclArr;
            },function (err) {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
          /*
          * sqlserver 必要环境准备
          * */
          this.sqlCfgEnv=function (comInfo,pro) {
              var args ={group:comInfo.gn,component_name:comInfo.cid,db_type:pro.dbType,db_ip:pro.ipAddress,db_port:pro.port,db_user:pro.uName,db_password:tDes.en_des(pro.uPwd),db_id:pro.serviceName};
              var url='/dipserver/query_environment_status',result={res:false,data:null};
              args=md5Ser.md5Data(args);
              return httpSer.postDataList(url,args).then(function (data) {
                  if(md5Ser.equalMd5Data(data)){
                      if(data.status){
                          result.res=true;
                          result.data=data.response || {};
                      }else{
                          dipT.error((data.response && data.response.error_msg));
                      }
                  }
                  return result;
              },function () {
                  dipT.error($filter('translate')('Wlcw'));//网络错误！
              });
          };
          /*
          * 日志恢复模式
          * */
          this.startRecoverMode=function (comInfo,pro) {
              var args ={group:comInfo.gn,component_name:comInfo.cid,db_type:pro.dbType,db_ip:pro.ipAddress,db_port:pro.port,db_user:pro.uName,db_password:tDes.en_des(pro.uPwd),db_id:pro.serviceName},
                  url='/dipserver/start_recover_mode',result=false;
              args=md5Ser.md5Data(args);
              return httpSer.postDataList(url,args).then(function (data) {
                  if(md5Ser.equalMd5Data(data)){
                      if(data.status){
                          result=true;
                      }else{
                          dipT.error((data.response && data.response.error_msg));
                      }
                  }
                  return result;
              },function (err) {
                  dipT.error($filter('translate')('Wlcw'));//网络错误！
              });
          };
          /*
          * startCdc
          * */
          this.startCdc=function (comInfo,pro) {
              var args ={group:comInfo.gn,component_name:comInfo.cid,db_type:pro.dbType,db_ip:pro.ipAddress,db_port:pro.port,db_user:pro.uName,db_password:tDes.en_des(pro.uPwd),db_id:pro.serviceName},
                  url='/dipserver/start_cdc',result=false;
              args=md5Ser.md5Data(args);
              return httpSer.postDataList(url,args).then(function (data) {
                  if(md5Ser.equalMd5Data(data)){
                      if(data.status){
                          result=true;
                      }else{
                          dipT.error((data.response && data.response.error_msg));
                      }
                  }
                  return result;
              },function () {
                  dipT.error($filter('translate')('Wlcw'));//网络错误！
              });
          };
          /*
          * add_r7_cdc sqlserver
          * */
          this.addR7Cdc=function (comInfo,pro,r7Args) {
              var args ={group:comInfo.gn,component_name:comInfo.cid,db_type:pro.dbType,db_ip:pro.ipAddress,db_port:pro.port,db_user:pro.uName,db_password:tDes.en_des(pro.uPwd),db_id:pro.serviceName,r7:r7Args},
                  url='/dipserver/add_r7_cdc',result=false;
              args=md5Ser.md5Data(args);
              return httpSer.postDataList(url,args).then(function (data) {
                  if(md5Ser.equalMd5Data(data)){
                      if(data.status){
                          result=true;
                      }else{
                          dipT.error((data.response && data.response.error_msg));
                      }
                  }
                  return result;
              },function () {
                  dipT.error($filter('translate')('Wlcw'));//网络错误！
              });
          };
          /*
          * sql_cfg_rollback sqlserver
          * */
          this.sqlCfgRollback=function (pro) {
              var args={db_type:pro.dbType,db_ip:pro.ipAddress,db_port:pro.port,db_user:pro.uName,db_password:tDes.en_des(pro.uPwd),db_id:pro.serviceName}
                  ,url='/dipserver/dip_sqlcfg_rollback',result=false;
              args=md5Ser.md5Data(args);
              return httpSer.postDataList(url,args).then(function (data) {
                  if(md5Ser.equalMd5Data(data)){
                      if(data.status){
                          result=true;
                      }else{
                          dipT.error((data.response && data.response.error_msg));
                      }
                  }
                  return result;
              },function () {
                  dipT.error($filter('translate')('Wlcw'));////网络错误！
              });
          };
          /*
          * 删除数据库模板
          * */
          this.deleteDbModel=function (dbName) {
              var url = "/dipserver/delete_fav_db",args={db_name:dbName},result=false;
              args=md5Ser.md5Data(args);
              return httpSer.postDataList(url,args).then(function (data) {
                  if(md5Ser.equalMd5Data(data)){
                      if(data.status){
                          result=true;
                      }else{
                          dipT.error(data.response.error_msg);
                      }
                  }
                  return result;
              },function () {
                  dipT.error($filter('translate')('M_wlscsb'));//网络错误，删除失败！
              });
          }
    }
}());