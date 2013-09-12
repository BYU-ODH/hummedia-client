function AdminUserCtrl($scope, account, language, $routeParams, $location) {
    "use strict";
    
    $scope.roles = account.availableRoles;
    $scope.languages = language.list;
    $scope.users =  account.search();
    $scope.user = null;
    var copy = null; // used for updating the user list while removing $scope.user

    $scope.setUser = function(user) {
        copy = user;
        $scope.user = user;
        $location.search({id: user._id});
    };

    $scope.cancel = function() {
        $scope.user = null;
        $location.search({});
        copy.$get().success(function(){copy = null});
    }

    // remember, delete is a reserved word, so we need to do this for compilation
    $scope['delete'] = function(user) {
        if(!confirm("Are you sure you want to delete " + user.fullname + "(ID: " + user._id + ")?")) {
            return;
        }
        $scope.user = null;
        copy = null;
        $location.search({});
        $scope.users.forEach(function(u, index) {
            if(user === u) {
                user.$delete(function() {
                    $scope.users.splice(index,1);
                });
            }
        });
    }

    $scope.$watch(function(){return $routeParams.id;}, function(val){
        $scope.id = $routeParams.id;
        if($scope.id){
            if($scope.user === null || $scope.user._id !== val) {
                $scope.user = account.get({_id:$routeParams.id}, function(){}, function(){
                    // error
                    $scope.user = null;
                    copy = null;
                });
                copy = $scope.user;
            }
        }
    });

    $scope.update = function() {
        $scope.user.isSaving = true;
        var u = $scope.user;
        $scope.user.$update(function(){
            u.isSaving = false;
        });
    }

    $scope.nameFilter = function(user) {
        if([undefined, null, ""].indexOf($scope.nameQuery) !== -1) {
            return true;
        }
        var query = $scope.nameQuery.toLowerCase();

        return user.fullname.toLowerCase().indexOf(query) !== -1
               ||
               (user.lastname + ", " + user.firstname).toLowerCase().indexOf(query) !== -1
    };
};
AdminUserCtrl.$inject = ['$scope','Account', 'language', '$routeParams', '$location'];
