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
    $('#view').addClass('text-align-center');
    
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
    
    if($scope.editorMode){
        //In editor mode, use the annotation layout
        $('#view').removeClass('text-align-center');
        $('#annotations-wrapper').css("display","inline-block"); 
    }

    $scope.playbackSpeed = 1;
    $scope.video_tag_exists = function(){
        return $('video').length;
    };
    
    $scope.toggleDescription = function() {
        $('#description').slideToggle();
        $('#description-toggle-icon').toggleClass('icon-minus');
        $('#description-toggle-icon').toggleClass('icon-plus');
    };
}
// always inject this in so we can later compress this JavaScript
VideoCtrl.$inject = ['$scope', '$routeParams', 'ANNOTATION_MODE'];
