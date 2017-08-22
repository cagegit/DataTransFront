'use strict';

angular.module('angular-tabs.demo').controller('tab1Ctrl', function ($scope) {
    $scope.$data.model = $scope.$data.model || 'Model provided from tab1Ctrl (' + (new Date().getTime()) + ')';

    $scope.$watch(function () {
        return $scope.volatileForm.$pristine;
    }, function (value) {
        if (value === false) {
            $scope.$setTabDirty();
        }
    });
});
