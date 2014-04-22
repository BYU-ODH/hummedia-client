'use strict';
function VideoCtrl($scope, $routeParams, ANNOTATION_MODE) {

  //Code to style the page correctly
  //
    function resizeView(){
        var new_height = $(window).height()-$('#nav-wrapper').height();
        $('#view').css("height", new_height);
        $('#annotations_wrapper').css('top', $('#nav-wrapper').height());
    }

    //Initialize resized view
    resizeView();
    window.addEventListener("resize", resizeView);
    
    //Add page-specific styles
    $('html').addClass('video-page');
    
    //Event handler for leaving the page
    $scope.$on('$locationChangeStart', function removeResizeListener() {
        window.removeEventListener("resize", resizeView);
        $('#view').css('height','');
        $('html').removeClass('video-page');
    });
    
    $scope.coll = $routeParams.collection;
    $scope.vid  = $routeParams.id;
    
    $scope.annotationsEnabled = true;
    $scope.subtitlesEnabled = true;
    $scope.editorMode = ANNOTATION_MODE;
    
    $scope.toggleDescription = function() {
        $('#description').slideToggle();
        $('#description-toggle-icon').toggleClass('icon-minus');
        $('#description-toggle-icon').toggleClass('icon-plus');
    };
    
    $scope.toggleAnnotationPane = function() {
        $('#view').toggleClass("text-align-center");
        $('#annotations-wrapper').toggle();
    };
}
// always inject this in so we can later compress this JavaScript
VideoCtrl.$inject = ['$scope', '$routeParams', 'ANNOTATION_MODE'];
