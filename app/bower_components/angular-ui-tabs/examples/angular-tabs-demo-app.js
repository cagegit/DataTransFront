'use strict';
angular.module('angular-tabs.demo', ['angular-tabs']);

angular.module('angular-tabs.demo').config(function ($uiTabsProvider) {

    $uiTabsProvider
        .tab('tab1', {
            title: 'Tab 1',
            templateUrl: 'tabs/tab1.html',
            controller: 'tab1Ctrl'
        })
        .tab('tab2', {
            title: 'Tab 2',
            templateUrl: 'tabs/tab2.html',
            controller: 'tab2Ctrl',
            volatile: false
        })
        .welcome({
            template: '<h2>Hello Tabs</h2>'
        })
        .config({
            //tabHeaderItemTemplateUrl: 'tabs/tab-header-item-template.html',
            //tabHeaderMenuItemTemplate: '<span>{{tab.title}}</span>'
        });
});

angular.module('angular-tabs.demo').controller('angularTabsDemoCtrl', function ($scope, $uiTabs) {
    var index = 1;

    $uiTabs.addTab('tab1', {title: 'TabType1 ' + (index++)});

    $scope.addTabType1 = function () {
        $uiTabs.addTab('tab1', {title: 'TabType1 ' + (index++)});
    };
    $scope.addTabType2 = function () {
        $uiTabs.addTab('tab2', {title: 'TabType2 ' + (index++)});
    };

    $scope.tabs = $uiTabs.getTabs();
});
