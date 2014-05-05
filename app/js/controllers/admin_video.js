function AdminVideoCtrl($scope, Video, language, $routeParams, $location, Collection, Subtitle) {
    "use strict";
    
    $scope.videos =  Video.query(function(){
        if(!$scope.videos.length){
            $scope.no_videos = true;
        }  
    });
    $scope.video = null;
    $scope.title_filter = "";
    $scope.selected_collections = {};

    var copy = null; // used for updating the user list while removing $scope.user

    $scope.setVideo = function(video) {
        var newVideo = Video.get({identifier: video.pid}, function() {
            copy = newVideo;
            $scope.video = newVideo;
            $location.search({id: newVideo.pid});
        })
    };

    $scope.cancel = function() {
        $scope.video = null;
        $location.search({});
        copy.$get().success(function(){copy = null});
    }

    // remember, delete is a reserved word, so we need to do this for compilation
    $scope['delete'] = function(video) {
        if(!confirm("Are you sure you want to delete " + video['ma:title'] + "(ID: " + video.pid + ")?")) {
            return;
        }
        $scope.video = null;
        copy = null;
        $location.search({});
        $scope.videos.forEach(function(u, index) {
            if(video.pid === u.pid) {
                video.$delete({identifier: video.pid}, function() {
                    $scope.videos.splice(index,1);
                });
            }
        });
    }

    $scope.$watch(function(){return $routeParams.id;}, function(val){
        $scope.id = $routeParams.id;
        if($scope.id){
            if($scope.video === null || $scope.video.pid !== val) {
                $scope.video = Video.get({identifier:$routeParams.id}, function(){}, function(){
                    // error
                    $scope.video = null;
                    copy = null;
                });
                copy = $scope.video;
            }
        }
    });

    $scope.update = function() {
        $scope.video.isSaving = true;
        var u = $scope.video;
        $scope.video.$update({identifier: $scope.video.pid}, function(){
            u.isSaving = false;
        });
    }

    $scope.getCollections = function() {
        $scope.collections = Collection.query();
    }
    
    $scope.toggleModal = function(modal_id){
        $('#blur-box').toggle();
        $(modal_id).toggle();
    }
    
    $scope.$watch("selected_collections", function(){
        $scope.selected_collections_count = getCount($scope.selected_collections);
    },true);
    
    //Helper Functions
    
    var getCount = function(checkbox_object){
        var count = 0;
        for(var prop in checkbox_object){
            if(checkbox_object[prop]==true){
                count++;
            }
        }
        return count;
    };

    $scope.deleteCollection = function(id, title) {
        if(!confirm("Are you sure you want to remove " + $scope.video['ma:title'] + " from " + title + " (ID: " + id + ")?")) {
            return;
        }

        var selected = $scope.video['ma:isMemberOf'];

        for(var i = 0; i<selected.length; i++) {
            if(selected[i]['@id'] == id) {
                selected.splice(i,1);
                break;
            }
        }

        Video.update({identifier: $scope.video.pid, 'ma:isMemberOf': $scope.video['ma:isMemberOf']});
    }

    $scope.addVideoToCollections = function() {
        //$scope.toggleModal('modal-add-video');

        var selected = $scope.video['ma:isMemberOf'];

        for(var id in $scope.selected_collections) {
            if(!$scope.selected_collections.hasOwnProperty(id) || !$scope.selected_collections[id]) {
                continue;
            }
            
            var found = false;

            for(var i = 0; i<selected.length; i++) {
                if(selected[i]['@id'] == id) {
                    found = true;
                    break; 
                }
            }

            if(!found) {
                // get the title as well
                var title = "";
                for(var i = 0; i<$scope.collections.length; i++) {
                   if($scope.collections[i].pid == id) {
                       title = $scope.collections[i]['dc:title'];
                   }
                }
                selected.push({'@id': id, 'title': title});
            }
        }
        $scope.video['ma:isMemberOf'] = selected;
        Video.update({identifier: $scope.video.pid, "ma:isMemberOf": selected});
        $scope.selected_collections = {}; // reset
    }

    $scope.annotate = function(collection_id) {
        if(!$scope.video) {
            return;
        }

        $location.path('/video/annotate/' + $scope.video.pid).search({collection: collection_id});
    }
    
    $scope.previewVideo = function(){
        if(confirm('Are you sure you want to preview this video?  All your unsaved changes will be lost.')){
            $location.path('video/' + $scope.video.pid);
        }
    };
};
AdminVideoCtrl.$inject = ['$scope','Video', 'language', '$routeParams', '$location', 'Collection', 'Subtitle'];
