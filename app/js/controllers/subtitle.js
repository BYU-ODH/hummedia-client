/**
 * Used for uploading subtitles
 */
function SubtitleCtrl($scope, Video, language) {
  'use strict';
    
  $scope.subtitleModalId = 'SUBTITLE-CTRL-MODAL';
  $scope.maxProgress   = 100;

  function init() {
    $scope.error         = null;
    $scope.waiting       = false;
    $scope.progress      = null;
  };
  init();

  var langListener = $scope.$watch('subLang', function(val) {
    if(val) {
      if(!$scope.subName) {
        $scope.subName = language.nameFromCode(val);
      }
      langListener(); // only watch for one
    }
  });

  $scope.upload = function() {
    var data = {name: $scope.subName, lang: $scope.subLang}
    var promise = Video.addSubtitle($scope.subFile, $scope.video.pid, data);
    $scope.waiting = true;

    promise.then(function success(data) {
      $scope.progress = 0;
      var progInterval = window.setInterval(function updateProgress() {
        $scope.progress += 10;
        $scope.$apply();
        if($scope.progress > $scope.maxProgress) {
          window.clearInterval(progInterval);
          $scope.toggleModal('[data-ctrl-id=' + $scope.subtitleModalId + ']');
          $scope.setVideo(data);
          init();
        }
      }, 25);
    }, function error(data) {
      init();
      $scope.error = data;
    });
  };
};
SubtitleCtrl.$inject = ['$scope', 'Video', 'language'];
