function HomeCtrl($scope, $location) {
    $scope.search = function(query) {
        if(query !== undefined && query.length > 0) {
            $location.path('/search').search({'query': query});
        }
    };
};
HomeCtrl.$inject = ['$scope', '$location'];
