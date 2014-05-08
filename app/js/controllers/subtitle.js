/**
 * Used for uploading subtitles
 */
function SubtitleCtrl($scope, Subtitle, language) {
  'use strict';
    
  $scope.subtitleModalId = 'SUBTITLE-CTRL-MODAL';
  $scope.maxProgress   = 100;

  function clear() {
    $scope.error         = null;
    $scope.waiting       = false;
    $scope.progress      = null;
    $scope.subName       = null;
    $scope.subLang       = null;
    $scope.subFile       = null;
  };

  var langListener = $scope.$watch('subLang', function(val) {
    if(val) {
      if(!$scope.subName) {
        $scope.subName = language.nameFromCode(val);
      }
    }
  });

  $scope.showSubtitleModal = function() {
    clear();
    $scope.toggleModal('[data-ctrl-id=' + $scope.subtitleModalId + ']');
  };

  $scope.deleteSubtitle = function(filepath) {
      var name = null;
      var lang = null;

      $scope.video['ma:hasRelatedResource'].some(function findDetails(a){
        if(a['@id'] == filepath) {
          name = a.name;
          lang = a.language;
          return true;
        }
      });

      if(!confirm("Are you sure you want to remove the subtitle " + name +
            " [" + lang + "]?")) {
          return;
      }

      Subtitle['delete'](filepath).then(function success(data){
          $scope.video.$get({identifier: $scope.video.pid}); // refreshes
      }, function failure(){
          alert("There was an error deleting the subtitle.");
      });
  };

  $scope.upload = function() {
    var data = {name: $scope.subName, lang: $scope.subLang}
    var promise = Subtitle.add($scope.subFile, $scope.video.pid, data);
    $scope.waiting = true;
    $scope.error   = null;

    promise.then(function success(data) {
      $scope.progress = 0;
      var progInterval = window.setInterval(function updateProgress() {
        $scope.progress += 10;
        $scope.$apply();
        if($scope.progress > $scope.maxProgress) {
          window.clearInterval(progInterval);
          $scope.toggleModal('[data-ctrl-id=' + $scope.subtitleModalId + ']');
          $scope.video.$get({identifier: $scope.video.pid});
        }
      }, 25);
    }, function error(data) {
      $scope.waiting = false;
      $scope.error = data;
    });
  };
};
SubtitleCtrl.$inject = ['$scope', 'Subtitle', 'language'];
