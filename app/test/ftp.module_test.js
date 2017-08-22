/**
 * Created by cagej on 2017/5/10.
 */
'use strict';

describe('myApp.ftp_view', function() {

    beforeEach(module('ui.router','pascalprecht.translate','toastr','myApp','myApp.service','myApp.ftp_view'));
    describe('myApp.ftpView',function () {
        var stateS='/.ftp_view.status';
        var stateP='/.ftp_view.property';
        var $state,$rootScope,$httpBackend,$location;
        beforeEach(function () {
            inject(function (_$state_,_$rootScope_,_$location_,_$httpBackend_) {
                $state= _$state_;
                // $state.transitionTo('/');
                $rootScope=_$rootScope_;
                $httpBackend=_$httpBackend_;
                $location=_$location_;
                $state.go('/');
                console.log($state.current);
                $rootScope.$apply();
            })
        });
        it('ftpView should be ready',function () {
            console.log($state.go(stateS,{gn:'abc',cn:'cc',id:'10',cid:'g_1'}));
            // $state.go('/');
            console.log($state.get(stateS));
            // $httpBackend.flush();

            //$state.go(stateS,{gn:'abc',cn:'cc',id:'10',cid:'g_1'});
            // Run a digest cycle to update the $state object
            // you can also run it with $state.$digest();
            $rootScope.$apply();

            // TEST EXPECTATION
            expect($state.current.name).toBe('someState');
        });
    });

    describe('myApp.ftpView ftpService', function(){
        it('ftpService function should be fun...', inject(function(ftpService,md5Service,$httpBackend) {
            //spec body
            expect(ftpService).toBeDefined();
            var comInfo={gn:'ddd',cid:'dd'};
            //模拟返回数据
            var value=JSON.stringify({mm:'bbb'});
            var value1=md5Service.md5Data({mm:'bbb'}).md5;
            var valid_respond = '{"status":true,"md5":"'+value1+'","response":'+value+'}';
            $httpBackend.whenPOST('/dipserver/query_apply_config').respond(valid_respond);

            var value2=JSON.stringify({component_id:'bbb'});
            var value3=md5Service.md5Data({component_id:'bbb'}).md5;
            var valid_save='{"status":true,"md5":"'+value3+'","response":'+value2+'}';
            var ftp ={component_name:'aaa'};
            $httpBackend.whenPOST('/dipserver/add_apply_config').respond(valid_save);
            var ftpRes,saveRes;
            ftpService.getFtpInfo(comInfo).then(function(data){
                console.log(data);
                ftpRes = data;
            },function (err) {
                console.log(err);
            }).finally(angular.loop);
            ftpService.saveFtpInfo(comInfo,ftp).then(function(data){
                console.log(data);
                saveRes = data;
            },function (err) {
                console.log(err);
            }).finally(angular.loop);
            $httpBackend.flush();
            // $rootScope.$apply();

            //测试判断ftpRes是否为{mm:'bbb'}
            expect(ftpRes).toEqual({mm:'bbb'});
            //测试判断saveRes是否为{component_id:'bbb'}
            expect(saveRes).toEqual({res:true,comId:'bbb'});
        }));
    });

    describe('myApp.ftpView ftpComponent', function () {
        var controller;
        var scope;
        beforeEach(inject(function($rootScope, $componentController){
            scope = $rootScope.$new();
            var dl ={type:'qrecv',ip:'172.16.1.1'};
            controller = $componentController('ftpProperty', {$scope: scope}, {dl: dl});
            scope.$digest();
        }));

        it('should have dl bound', function() {
            expect(controller.dl).toBeDefined();
            expect(controller.dl).toEqual({type:'qrecv',ip:'172.16.1.1'});
        });

        it('should expose property', function() {
            expect(controller.property).toBeDefined();
            expect(controller.property).toEqual({save_time:1,wait:60,type:'qsend'});
            controller.$onInit();
            console.log('onInit-----');
            expect(controller.property).toEqual({save_time:1,wait:60,type:'qrecv',ip:'172.16.1.1',component_name: undefined, user_name: undefined, passwd: undefined, ftp_path: undefined, ftp_filename: undefined });
        });
    });
});