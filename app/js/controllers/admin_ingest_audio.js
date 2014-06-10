"use strict";
function AdminIngestAudioCtrl($scope, SendFile, config) {
  $scope.waiting = false;
  $scope.message = null;

  $scope.upload = function upload() {
    $scope.waiting = true;
    
    SendFile($scope.file, 'audio[]', {}, 'POST', config.apiBase + '/batch/audio/ingest')
      .then(function success(data) {
        $scope.waiting = false;
        $scope.uploaded = data;
      }, function error() {
        $scope.waiting = false;
        $scope.message = 'There was an error uploading your file(s).';
      });
  };
};
AdminIngestAudioCtrl.$inject = ['$scope', 'SendFile', 'appConfig'];
