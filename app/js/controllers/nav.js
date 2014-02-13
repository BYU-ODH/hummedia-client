'use strict';
function NavCtrl($scope, user, config) {
    $scope.user = user;
    $scope.showAdminMenu = false;
    $scope.showLogin = true;
    $scope.debug = config.debugMode;

    $scope.$watch(function(){ return !user.exists && !user.netIDRequired }, function(show) {
        $scope.showLogin = show;
    });
    $scope.toggleAdmin = function() {
        $scope.showAdminMenu = !$scope.showAdminMenu;
    };

    $scope.hasCheckedUser = false;
    user.checkStatus().then(function(){ $scope.hasCheckedUser = true; });

    // Quick fix for maintenance message. Can isolate this in a method call
    // later
    var maintenanceDate = new Date();
    maintenanceDate.setYear(2014);
    maintenanceDate.setMonth(1);
    maintenanceDate.setDate(16);
    maintenanceDate.setHours(0);
    maintenanceDate.setMinutes(0);
    maintenanceDate.setSeconds(0);

    if(Date.now() < maintenanceDate) {
        $scope.maintenance = "Hummedia will be undergoing maintenance "+
          "throughout the day on Saturday, February 15. You may experience "+
          "interruptions of service. We apologize for the inconvenience.";
    }
};
NavCtrl.$inject = ['$scope','user','appConfig'];
