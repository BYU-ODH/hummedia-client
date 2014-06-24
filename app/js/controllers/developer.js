(function(){
  // remove cached less files
  var remove = ['.less','.less:timestamp'];
  for(var i in localStorage) {
    remove.forEach(function(str) {
      if(i.indexOf(str, i.length - str.length) !== -1) {
        localStorage.removeItem(i);
      }
    });
  }
}());

function DeveloperCtrl($scope, developer) {
    $scope.login = function(level) {
        developer.auth(level);
    }
};
DeveloperCtrl.$inject = ['$scope','developer'];
