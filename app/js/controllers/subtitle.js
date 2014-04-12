/**
 * Used for uploading subtitles
 */
function SubtitleCtrl($scope, Video) {
  'use strict';

  $scope.upload = function() {
      var data = {name: $scope.subName, lang: $scope.subLang}
      Video.addSubtitle($scope.subFile, $scope.video.pid, data);
  }
};
SubtitleCtrl.$inject = ['$scope', 'Video'];
