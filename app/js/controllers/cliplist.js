'use strict';
function CliplistCtrl($scope, Clip, $location) {

  Clip.get_list().$promise.then(function(resp) {
    if (resp.length > 0) {
      $location.path('video/' + resp[0]['mediaid']).search({'start': resp[0]['start'], 'end': resp[0]['end']});
    }
  });

}
CliplistCtrl.$inject =   ['$scope', 'Clip', '$location'];
