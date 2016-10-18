'use strict';
function NavCtrl($scope, user, config, $rootScope, $location, Clip) {
    $scope.user = user;
    $scope.showAdminMenu = false;
    $scope.showLogin = true;
    $scope.debug = config.debugMode;
    $scope.showCliplist = false;

    $scope.$watch(function(){ return !user.exists && !user.netIDRequired }, function(show) {
        $scope.showLogin = show;
    });
    $scope.toggleAdmin = function() {
        $scope.showAdminMenu = !$scope.showAdminMenu;
    };
    $rootScope.toggleCliplist = function() {
        if ($location.$$path.substring(1,6) != 'video') {
            Clip.get_list().$promise.then(function(resp) {
              if (resp.length > 0) {
                $rootScope.showCliplist = true;
                $location.path('video/' + resp[0]['mediaid']).search({'start': resp[0]['start'], 'end': resp[0]['end']});
              } else {
                $location.path('/cliplist'); 
              }
            });
        } else {
            $rootScope.showCliplist = !$rootScope.showCliplist;
        }
    }

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
NavCtrl.$inject = ['$scope','user','appConfig', '$rootScope', '$location', 'Clip'];
