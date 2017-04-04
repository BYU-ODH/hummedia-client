function HelpCtrl($scope, $routeParams, $location) {
    $scope.sections = ['about', 'annotationTypes', 'addingAnnotations', 'addingContent', 'addingSubtitles', 'creatingCollections', 'linkingYoutube', 'usingCliplists', 'viewingSubtitles', 'cannotSeeCourse', 'extra'];
    $scope.titles = ['About', 'Annotation Types', 'Adding Annotations', 'Adding Conent to Your Collection', 'Adding Subtitles', 'Creating a Collection', 'Linking Content Via YouTube', 'Using Cliplists', 'Viewing Subtitles', "Students can't see my course!", 'Extra Help']
    $scope.helpSection = "../../help/about.txt";
    $scope.selectedSection = 'about';
    $scope.changeView = function(section) {
      $scope.selectedSection = section;
      $scope.helpSection = "../../help/" + section + ".txt";
    }
};
HelpCtrl.$inject = ['$scope', '$routeParams', '$location'];
