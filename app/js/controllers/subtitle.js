/**
 * Used for uploading subtitles
 */
function SubtitleCtrl($scope, Video) {
  'use strict';

  $scope.upload = function() {
      data = {name: $scope.subName, lang: $scope.subLang}
      Video.addSubtitle($scope.subFile[0], $scope.video['ma:title'], data);
  }
};
SubtitleCtrl.$inject = ['$scope', 'Video'];
