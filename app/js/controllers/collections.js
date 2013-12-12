'use strict';
function CollectionsCtrl($scope, Collection, $routeParams, $location, user) {
    
    $scope.collections = Collection.query(function(){
        
        //Alphabetize the Collections
        $scope.collections.sort(function(a, b) {
            if(a['dc:title']<b['dc:title']){
                return -1;
            }
            if(a['dc:title']>b['dc:title']){
                return 1;
            }
            return 0;
        });
        
        if(!$scope.collections.length){
            $scope.message = 'There are no collections to display.';
        }
        
        $scope.collections_data=[];
        
        //If no id is specified then show the first collection
        if(!$location.search().id){
            showVideos($scope.collections[0]['pid']);
        }
    });

    $scope.showVideos = function(pid){
        $location.search({'id':pid});
    };
    
    function showVideos(pid){
        $scope.collection = Collection.get({identifier:pid}, function success(){
            $scope.collection.isLoading = false;
            $scope.collection.videos.sort(function(a, b) {
                return a['ma:title'].toLowerCase() > b['ma:title'].toLowerCase();
            });
        }, function error(){
            $scope.collection = {'dc:title':'Unable to Access Course',
                                 'dc:description':'Make sure the URL you are trying to reach is correct and that you are enrolled in this course'
            };
        });
        $scope.collection.isLoading = true;
        
        $('html,body').scrollTop(0);
    };

    $scope.$watch(function(){ return $location.search().id; }, function(val) {
        if(val) {
            showVideos(val);
        }
    });

    $scope.canEdit = function(collection) {
        return collection['dc:rights']['write'].indexOf(user.data.username) !== -1;
    }
}
// always inject this in so we can later compress this JavaScript
CollectionsCtrl.$inject = ['$scope', 'Collection', '$routeParams', '$location', 'user'];
