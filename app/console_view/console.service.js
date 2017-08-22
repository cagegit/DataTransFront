/**
 * Created by cagej on 2017/4/26.
 */
(function () {
    'use strict';
    angular.module('myApp.consoleService',[])
        .service('csService',csService);
    csService.$inject=['httpService','tipsService','md5Service','$filter','$q','$window'];
    function csService(httpSer,dipT,md5Ser,$filter,$window) {
        /*
        * 查询capture状态 xml manager
        * */
        this.getCaptureStatus=function (comInfo) {
            var args="<dip_command><command>query_capture_status</command><command_data><group>"+comInfo.gn+"</group><component_name>"+comInfo.cn+"</component_name></command_data></dip_command>";
            var url="/dipserver/query_capture_status",result={res:false,data:null};
            return httpSer.postDataList(url,{xmlDoc:args}).then(function (data) {
                if(data.command_return === "ERROR"){
                    var err = data.error_message || (data.return_data && data.return_data.error_message);
                    result.res=false;
                    result.data=err;
                }else {
                    result.res=true;
                    result.data=data.return_data;
                }
                return result;
            },function () {
                // dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        /*
        * 查询实时日志及错误列表 xml manager
        * */
        this.getConsoleErrorDetail=function (comInfo,serverInfo) {
            var args = "<dip_command><command>query_error_detail</command><command_data><group>"+comInfo.gn+"</group>"
                + "<component_name>"+comInfo.cn+"</component_name><type>"+serverInfo.type+"</type><thread>"+serverInfo.thread+"</thread><pid>"+serverInfo.pid+"</pid>"
                + "<offset>" + serverInfo.off_set + "</offset></command_data></dip_command>";
            var url="/dipserver/query_error_detail",resData={status:1,msg:'',data:null};
            return httpSer.postDataList(url,{xmlDoc:args}).then(function (data) {
                if(data.command_return === "ERROR"){
                    var err = data.error_message || (data.return_data && data.return_data.error_message);
                    resData.status=1;
                    resData.msg=err;
                }else{
                    var res = data.return_data,arr=[];
                    if(res){
                        if(res.errors){
                            if(angular.isArray(res.errors.error)){
                                arr=res.errors.error;
                            }else if(angular.isObject(res.errors.error)){
                                arr.push(res.errors.error);
                            }
                        }
                        resData.data={errors:arr,logs:'',fileName:'',off_set:''};
                        if(res.log){
                            var info = res.log;
                            resData.data.logs =info.latest_log;
                            resData.data.fileName =info.filename;
                            resData.data.off_set=info.offset;
                        }
                        resData.status=3;
                    }else{
                        resData.status=2;
                    }
                }
                return resData;
            },function () {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        /*
        * 查询queue的状态信息 xml manager
        * */
        this.getQueueStatus=function (comInfo) {
            var args = "<dip_command><command>query_queue_info</command><command_data><group>"+comInfo.gn+"</group><component_name>"+comInfo.cn+"</component_name></command_data></dip_command>";
            var url = "/dipserver/query_queue_info_status",result={res:false,data:null,tab:'tab1'};
            return httpSer.postDataList(url,{xmlDoc:args}).then(function (data) {
                if(data.command_return === 'ERROR'){
                    var err = data.return_data.error_message || data.return_data.error_msg;
                    dipT.error(err);
                }else{
                    result.res=true;
                    result.data=data.return_data;
                }
                return result;
            },function () {
                dipT.error($filter('translate')('Co_tip10'));//'获取队列状态信息失败!'
            });
        };
        /*
        * 查询队列展示信息 xml manager
        * */
        this.getQueueDisplayList=function (comInfo,pnum,stime,etime,xid) {
            var url="/dipserver/query_queue_pkg",result={res:false,list:[],total:1,tab:'tab3'};
            var args="<dip_command><command>query_queue_pkg</command><command_data><group>"+comInfo.gn+"</group><component_name>"+comInfo.cn+"</component_name>"+
                "<page_num>"+pnum+"</page_num><start_time>"+stime+"</start_time><end_time>"+etime+"</end_time><xid>"+xid+"</xid></command_data></dip_command>";
            return httpSer.postDataList(url,{xmlDoc:args}).then(function (data) {
                if(data.command_return==='ERROR'){
                    var err = data.return_data.error_message || data.return_data.error_msg;
                    dipT.error(err);
                }else{
                    result.res=true;
                    if(data.return_data){
                        if(data.return_data.list){
                            if(angular.isArray(data.return_data.list)){
                                result.list= data.return_data.list;
                            }else{
                                result.list.push(data.return_data.list);
                            }
                        }
                        result.total=parseInt(data.return_data.page_num)?parseInt(data.return_data.page_num):1;
                    }
                }
                return result;
            },function () {
                dipT.error($filter('translate')('Co_tip11'));//获取队列展示信息失败！
            });
        };
        /*
        * 根据XID查询对应的sql语句 xml manager
        * */
        this.getSqlInfoByXid=function (comInfo,rec_oft,qno,oft) {
            var url="/dipserver/query_queue_sql",result=null;
            var args="<dip_command><command>query_queue_sql</command><command_data><group>"+comInfo.gn+"</group><component_name>"+comInfo.cn+"</component_name>"+
                "<rec_oft>"+rec_oft+"</rec_oft><qno>"+qno+"</qno><oft>"+oft+"</oft></command_data></dip_command>";
            return httpSer.postDataList(url,{xmlDoc:args}).then(function (data) {
                if(data.command_return === 'ERROR'){
                    var err = data.error_message || data.return_data.error_message;
                    dipT.error(err);
                }else{
                    result=data.return_data;
                }
                return result;
            },function (err) {
                dipT.error($filter('translate')('Co_tip12'));//获取Sql详情信息失败！
            });
        };
        /*
        * 初始化队列用户列表树结构数据
        * */
        this.initQueueUserTree=function (comInfo) {
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
                return {
                    data:tree,
                    tab:'tab2'
                };
            },function () {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        /*
        * 查询队列详情信息 xml manager
        * */
        this.getQueueDetailList=function (comInfo,cnum,xid,opc,uname,tname,scn) {
            var url="/dipserver/query_queue_rec",result={res:false,list:[],total:1};
            var args="<dip_command><command>query_queue_rec</command><command_data><group>"+comInfo.gn+"</group><component_name>"+comInfo.cn+"</component_name>"+
                "<page_num>"+cnum+"</page_num><xid>"+xid+"</xid><opc>"+opc+"</opc><owner>"+uname+"</owner><table>"+tname+"</table><scn>"+scn+"</scn></command_data></dip_command>";
            return httpSer.postDataList(url,{xmlDoc:args}).then(function (data) {
                if(data.command_return === 'ERROR'){
                    var err = data.return_data.error_message || data.return_data.error_msg;
                    dipT.error(err);
                }else{
                    result.res=true;
                    if(data.return_data){
                        if(data.return_data.list){
                            if(angular.isArray(data.return_data.list)){
                                result.list= data.return_data.list;
                            }else{
                                result.list.push(data.return_data.list);
                            }
                        }
                        result.total=parseInt(data.return_data.page_num)?parseInt(data.return_data.page_num):1;
                    }
                }
                return result;
            },function () {
                dipT.error($filter('translate')('Co_hqdlsb'));//获取队列详情信息失败！
            });
        };
        /*
        * 删除队列pkd选中xid  xml manager
        * */
        this.deleteQueuePkgXid=function (comInfo,xList) {
            var url="/dipserver/delete_queue_pkg_xid",result=false;
            var args="<dip_command><command>delete_queue_pkg_xid</command><command_data>"
                + "<group>"+comInfo.gn+"</group><component_name>"+comInfo.cn+"</component_name>"+xList+"</command_data></dip_command>";
            return httpSer.postDataList(url,{xmlDoc:args}).then(function (data) {
                if(data.command_return === 'ERROR'){
                    var err = data.return_data.error_message || data.return_data.error_msg;
                    dipT.error(err);
                }else{
                    result=true;
                }
                return result;
            },function () {
                dipT.error($filter('translate')('Co_qcsb'));//清除选中数据失败！
            });
        };
        /*
         * 查询队列统计信息 xml manager
         * */
        this.queryQueueTj=function (comInfo,full,owner,table,st,et,mm,hh,dd,mo,yy,ut,sql) {
            var url="/dipserver/query_queue_statis";
            var args="<dip_command>"+
                "<command>query_queue_statis</command>"+
                "<command_data>"+
                "<group>"+comInfo.gn+"</group>"+
                "<component_name>"+comInfo.cn+"</component_name>"+
                "<full>"+full+"</full>"+
                "<owner>"+owner+"</owner>"+
                "<table>"+table+"</table>"+
                "<start_time>"+st+"</start_time>"+
                "<end_time>"+et+"</end_time>"+
                "<minute>"+mm+"</minute>"+
                "<hour>"+hh+"</hour>"+
                "<day>"+dd+"</day>"+
                "<month>"+mo+"</month>"+
                "<year>"+yy+"</year>"+
                "<object_type>"+ut+"</object_type>"+
                "<sql_type>"+sql+"</sql_type>"+
                "<interval>1</interval>"+
                "</command_data>"+
                "</dip_command>";
            return httpSer.postDataList(url,{xmlDoc:args});
        };

        ////////////////////////// apply service //////////////////////////////
        /*
        * 查询全同步错误列表 xml manager
        * */
        this.queryApplyFullErrors=function (comInfo,uname,uobj,handle,pnum,has_read,stime,etime) {
            var xml = '<dip_command><command>query_apply_full_error</command>' +
                '<command_data><group>' + comInfo.gn + '</group><component_name>' + comInfo.cn + '</component_name>' +
                '<owner>' + uname + '</owner><object>' + uobj + '</object><action>' + handle + '</action><page_num>' + pnum + '</page_num>' +
                '<mark_flag>' + has_read + '</mark_flag><start_time>' + stime + '</start_time><end_time>' + etime + '</end_time>' +
                '</command_data></dip_command>';
            var url = "/dipserver/query_apply_full_error",result={res:false,list:[],total:0};
            return httpSer.postDataList(url,{xmlDoc:xml}).then(function (data) {
                if(data.command_return === "ERROR"){
                    // var err = data.return_data.error_message || data.return_data.error_msg;
                    // dipT.error(err);
                }else{
                    var res = data.return_data;
                    if(res){
                        var arr = [];
                        if(angular.isArray(res.history)){
                            arr= res.history;
                        }else{
                            arr.push(res.history);
                        }
                        angular.forEach(arr,function (val) {
                            val.flag =false;
                        });
                        result.res=true;
                        result.list=arr;
                        result.total=parseInt(res.all_num) ? parseInt(res.all_num) : 1;
                    }
                }
                return result;
            },function () {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        /*
        * 导出Excel表格 xml manager
        * */
        this.exportExcelErrorFile=function (comInfo) {
            var args = '<dip_command><command>download_error_file</command><command_data><group>'+comInfo.gn+'</group><component_name>'+comInfo.cn+'</component_name></command_data></dip_command>';
            var url = "/dipserver/download_error_file";
            httpSer.postDataList(url,{xmlDoc:args}).then(function (data) {
                if(data.command_return === "ERROR"){
                    var err = data.return_data.error_message || data.return_data.error_msg;
                    dipT.error(err);
                }else{
                    var res = data.return_data;
                    if(res && typeof(res.file_path)==='string'){
                        $window.open('/download/'+res.file_path);
                    }
                }
            },function () {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        /*
        * 标记loader错误为已读 xml manager
        * */
        this.markedApplyError=function (comInfo,locations) {
            var args = '<dip_command><command>marked_apply_error</command><command_data><group>'+comInfo.gn+'</group><component_name>'+comInfo.cn+'</component_name>'+locations+'</command_data></dip_command>';
            var url = "/dipserver/marked_apply_error",result=false;
            return httpSer.postDataList(url,{xmlDoc:args}).then(function (data) {
                if(data.command_return === "ERROR"){
                    var err = data.return_data.error_message || data.return_data.error_msg;
                    dipT.error(err);
                }else{
                    result=true;
                }
                return result;
            },function () {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        /*
        * 清除错误日志 xml manager
        * */
        this.clearErrorLogs=function (comInfo) {
            var args = '<dip_command><command>trunc_apply_error_record</command><command_data><group>'+comInfo.gn+'</group><component_name>'
                + comInfo.cn + '</component_name></command_data></dip_command>';
            var url = "/dipserver/trunc_apply_error_record",result=false;
            return httpSer.postDataList(url,{xmlDoc:args}).then(function (data) {
                if(data.command_return === "ERROR"){
                    var err = data.return_data.error_message || data.return_data.error_msg;
                    dipT.error(err);
                }else{
                    result=true;
                }
                return result;
            },function () {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        /*
        * 获取loader错误统计信息 xml manager
        * */
        this.getErrorStatList=function (comInfo) {
            var args = '<dip_command><command>query_apply_error_statistics</command><command_data><group>'+comInfo.gn+'</group><component_name>'
                +comInfo.cn+'</component_name><offset>0</offset><clicktype>start</clicktype></command_data></dip_command>';
            var url = "/dipserver/query_apply_error_statistics",result={res:false,list:[]};
            return httpSer.postDataList(url,{xmlDoc:args}).then(function (data) {
                if(data.command_return === "SUCCESS"){
                    var res =data.return_data,arr=[];
                    if(res && res.record){
                        if(angular.isArray(res.record)){
                            arr = res.record;
                        }else if(angular.isObject(res.record)){
                            arr.push(res.record);
                        }
                        result.list=arr;
                    }
                    result.res=true;
                }else{
                    // var err = data.return_data.error_message || data.return_data.error_msg;
                    // dipT.error(err);
                }
                return result;
            },function () {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        /*
        * 排除选中表 xml manager
        * */
        this.excludeSelectTable=function (comInfo,records) {
            var args = '<dip_command><command>exclude_select_table</command><command_data><group>' + comInfo.gn + '</group><component_name>'
                + comInfo.cn + '</component_name>' + records + '</command_data></dip_command>';
            var url = "/dipserver/exclude_select_table",result=false;
            return httpSer.postDataList(url,{xmlDoc:args}).then(function (data) {
                if(data.command_return === "ERROR"){
                    var err = data.return_data.error_message || data.return_data.error_msg;
                    dipT.error(err);
                }else{
                    result=true;
                }
                return result;
            },function () {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        /*
        * 重新同步选中表 xml manager
        * */
        this.syncTablePart=function (comInfo,records) {
            var args = '<dip_command><command>sync_table_part</command><command_data><group>' + comInfo.gn + '</group><component_name>'
                + comInfo.cn + '</component_name><record>' + records + '</record></command_data></dip_command>';
            var url = "/dipserver/sync_table_part",result=true;
            return httpSer.postDataList(url,{xmlDoc:args}).then(function (data) {
                if(data.command_return === "ERROR"){
                    var err = data.return_data.error_message || data.return_data.error_msg;
                    dipT.error(err);
                }else{
                    result=true;
                }
                return result;
            },function () {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        /*
        * 手动处理错误 xml manager
        * */
        this.handleError=function (comInfo,urlStr) {
            var args = '<dip_command><command>'+urlStr+'</command><command_data><group>'+comInfo.gn+'</group><component_name>'+comInfo.cn+'</component_name></command_data></dip_command>';
            var url = "/dipserver/"+ urlStr,result={res:false,msg:''};
            return httpSer.postDataList(url,{xmlDoc:args},0).then(function (data) {
                if(data.command_return === "ERROR"){
                    result.res=false;
                    result.msg=data.return_data.error_message || data.return_data.error_msg;
                }else{
                    result.res=true;
                }
                return result;
            },function () {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        /*
        * 获取loader当前错误 xml manager
        * */
        this.getLoaderCurrentError=function (comInfo) {
            var args = '<dip_command><command>query_apply_current_error</command><command_data><group>' + comInfo.gn + '</group><component_name>'
                + comInfo.cn + '</component_name></command_data></dip_command>';
            var url = "/dipserver/query_apply_current_error",result={res:false,data:null};
            return httpSer.postDataList(url,{xmlDoc:args}).then(function (data) {
                if(data.command_return === "ERROR"){
                    // var err = data.return_data.error_message || data.return_data.error_msg;
                    // dipT.error(err);
                }else{
                    result.res=true;
                    result.data=data.return_data || {};
                }
                return result;
            },function () {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        /*
        * 获取loader状态信息  xml manager
        * */
        this.getLoaderStatus=function (comInfo) {
            var xml = '<dip_command><command>query_apply_status</command><command_data><group>'+comInfo.gn+'</group><component_name>'+comInfo.cn+'</component_name></command_data></dip_command>';
            var url = '/dipserver/query_capture_status',result={res:false,msg:'',data:null};
            return httpSer.postDataList(url,{xmlDoc:xml}).then(function (data) {
                if(data.command_return === "ERROR"){
                    result.res=false;
                    result.msg=data.error_message || (data.return_data && data.return_data.error_message);
                }else{
                    result.res=true;
                    result.data=data.return_data || {};
                }
                return result;
            },function () {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        /*
         * 获取loader排除表列表
         * */
        this.getLoaderPcbList=function (comInfo,num) {
            var args={group_id:comInfo.gn,component_id:comInfo.cn,page_num:num};
            var url="/dipserver/query_apply_exclude_table",result={list:[],total:1};
            args=md5Ser.md5Data(args);
            return httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status){
                        var res=data.response;
                        if(res && angular.isArray(res.list)){
                            angular.forEach(res.list,function (vv) {
                                vv.checked=false;
                                result.list.push(vv);
                            });
                            result.total=parseInt(res.total)?parseInt(res.total):1;
                        }
                    }else{
                        dipT.error(data.response.error_msg);
                    }
                }
                return result;
            },function () {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
        /*
         * 删除选中排除表
         * @parma list {Array}
         * */
        this.deletePcbList=function (comInfo,list) {
            var args={group_id:comInfo.gn,component_id:comInfo.cn,object:list};
            var url="/dipserver/delete_exclude_table",result=false;
            args=md5Ser.md5Data(args);
            return httpSer.postDataList(url,args).then(function (data) {
                if(md5Ser.equalMd5Data(data)){
                    if(data.status && data.response==='SUCCESS'){
                        result=true;
                    }
                }
                return result;
            },function () {
                dipT.error($filter('translate')('Wlcw'));//网络错误！
            });
        };
    }
})();