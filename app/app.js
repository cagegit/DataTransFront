'use strict';
var myApp = angular.module('myApp',[
    'ui.router',
    'pascalprecht.translate',
    'ngAnimate',
    'ui.bootstrap',
    'myApp.service',
    'myApp.common_view',
    'ui.bootstrap.contextMenu',
    'myApp.main_view',
    'myApp.db_view',
    'myApp.console_view',
    'myApp.group_view',
    'myApp.cp_view',
    'myApp.queue_view',
    'myApp.loader_view',
    'myApp.ful_syc_view',
    'myApp.tclient_view',
    'myApp.tserver_view',
    'myApp.etl_view',
    'myApp.ftp_view'
]);
myApp.config(['$urlRouterProvider','$stateProvider','$translateProvider','$locationProvider','$urlServiceProvider',function($urlRouterProvider, $stateProvider,$translateProvider,$locationProvider,$urlServiceProvider) {
    $locationProvider.hashPrefix('');//兼容默认Hash不包含！号
    $stateProvider.state('/',{
        url:'/main',
        template:'<main></main><div id="mainDialogUi" ui-view ></div>'//main directive指令
    });
    // $urlServiceProvider.rules.otherwise({ state: 'main' });
    $urlServiceProvider.rules.otherwise({ state: '/' });
    $urlServiceProvider.rules.when("/", "/main");
    $urlServiceProvider.rules.when("", "/main");
    var lang = window.localStorage.lang ||'cn';
    $translateProvider.preferredLanguage(lang);
    $translateProvider.useStaticFilesLoader({
        prefix: './i18n/',
        suffix: '.json'
    });
    // Enable escaping of HTML
    $translateProvider.useSanitizeValueStrategy('escapeParameters');
}]);
myApp.run(['$rootScope','$translate','$state','$log','$transitions',function ($rootScope,$translate,$state,$log,$transitions) {
    $rootScope.title='';//Cf_title
    $translate(['M_title','Cf_content']).then(function (translations) {
        $rootScope.title = translations.M_title;
    });
    $state.defaultErrorHandler(function(error) {
        // This is a naive example of how to silence the default error handler.
        $log.error(error);
    });
    //判断路由是否正确
    // $transitions.onStart({}, function(transition) {
    //     // $log.info('stateChange');
    // });
    //路由错误处理
    $transitions.onError({}, function(transition) {
        console.log('Transition erred!', transition.error());
        // $log.error('Transition erred!', transition.error());
    });
}]);