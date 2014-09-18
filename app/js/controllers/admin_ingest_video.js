"use strict";
function AdminIngestCtrl($scope, Video, $location) {
    $scope.creating = false;
    $scope.videos = Video.files();

    $scope.setVideo = function(filepath) {
        $scope.video = {'ma:title': filepath};
    }

    $scope.createVideo = function() {
        var imdbID = $scope.imdb,
            filepath = $scope.video['ma:title'];

        $scope.creating = true;
        Video.save($scope.video,function(data){
            Video.ingest(filepath, data.pid, imdbID);
            $location.path("/admin/video").search({id: data.pid});
        });
    }
};
AdminIngestCtrl.$inject = ['$scope', 'Video', '$location'];
