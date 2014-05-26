'use strict';
function VideoCtrl($scope, $routeParams, ANNOTATION_MODE,
    Video, AnnotationHelper, SubtitleHelper, Butter, $window) {

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
    
    var coll = $routeParams.collection;
    var vid  = $routeParams.id;
    
    $scope.annotationsEnabled = true;
    $scope.subtitlesEnabled = true;
    $scope.editorMode = ANNOTATION_MODE;
    
    if($scope.editorMode){
        //In editor mode, use the annotation layout
        $('#view').removeClass('text-align-center');
        $('#annotations-wrapper').css("display","inline-block"); 
    }

    $scope.playbackSpeed = 1;
    
    $scope.resetPlaybackSpeed = function(){
        $scope.playbackSpeed = 1;
    };
    
    $scope.video_tag_exists = function(){
        return $('video').length;
    };
    
    $scope.toggleDescription = function() {
        $('#description').slideToggle();
        $('#description-toggle-icon').toggleClass('icon-minus');
        $('#description-toggle-icon').toggleClass('icon-plus');
    };

    $scope.video = Video.get({identifier: vid}, function initialize(video) {
        if(ANNOTATION_MODE) {
            Butter(vid, coll, video['ma:hasPolicy']);
            // this is a fix that destroys the Butter-specific DOM infestation
            $scope.$on('$locationChangeStart', function(ev, newUrl) {
                ev.preventDefault();
                if(confirm("Are you sure you want to navigate away from this page? Your unsaved work will be lost.")) {
                    $window.location = newUrl;
                    $window.location.reload();
                }
            });
            return;
        }

        var pop = window.Popcorn.smart('hum-video', video.url, {
            frameAnimation: true // allows for more accurate timing
        });
        
        //Adding Event Listeners to video element
        
        //Hide the video before the data loads
        pop.media.addEventListener("loadstart",function(){
            $('#video-loading').show();
            $('video').hide();
        });
        //Hide the loading message and show the video once it loads
        pop.media.addEventListener("loadeddata",function(){
            $('#video-loading').fadeOut("slow");
            $('#video-error').fadeOut("slow");
            $('video').fadeIn("slow");
        });
        //Show an error message if the video is unable to load
        pop.media.addEventListener("error",function(){
            $('#video-loading').fadeOut("slow");
            $('#video-error').fadeIn("slow");
        });


        var annotation = new AnnotationHelper(pop, vid, coll, video['ma:hasPolicy']),
            subtitles  = new SubtitleHelper(pop, video['ma:hasRelatedResource']);

        var makeSpaceForAnnotations = function(events){
            var whitelist = {"skip":true,"blank":true,"mutePlugin":true};
            for(var i=0; i<events.length; i++){
                //check if plugin is on whitelist
                if(!whitelist[events[i]["_natives"]["plugin"]]){
                    //Switch to the annotations layout
                    $('#view').removeClass('text-align-center');
                    $('#annotations-wrapper').css("display","inline-block");                                
                    break;
                }
            }
        }

        annotation.ready(function(){
            $scope.video.hasAnnotations = annotation.hasNonrequired;
            makeSpaceForAnnotations(pop.getTrackEvents());
        });


        /** @TODO: change to a promise...or something **/
        $scope.$watch(function(){return subtitles.subtitles.length;}, function(val){
            if(val) {
                $scope.subtitles = subtitles.subtitles.map(function(sub) {
                  if(!sub.name) {
                    // gets the filename
                    sub.displayName = sub['@id'].split('/').pop();
                  }else{
                    sub.displayName = sub.name;
                  }
                  
                  if(sub.language) {
                    sub.displayName += " [" + sub.language + "]";
                  }
                  return sub;
                });
                $scope.subtitle = subtitles.current;
            }
        });

        $scope.$watch('subtitle', function(selected) {
            if(!selected) {
                subtitles.disable();
                return;
            }
            subtitles.loadSubtitle(selected);
        });

        $scope.$watch(function(){return subtitles.current;},
            function(current) {
                $scope.subtitle = current;
            }
        );

        $scope.$watch('annotationsEnabled', function(value){
            value === false ? annotation.disable() : annotation.enable();
        });



        
        $scope.$watch('playbackSpeed', function(value){
            pop.media.playbackRate = value;
        });

        // Unless we pause the movie when the page loses focus, annotations
        // will not continue to be used even though the movie will play in
        // the background
        function pauseVideo() {
            pop.pause();
        };
        $window.addEventListener('blur', pauseVideo);
        $scope.$on('$destroy', function cleanup() {
            annotation.destroy();
            pop.destroy();
            $window.removeEventListener('blur', pauseVideo);
        });
    });
}
// always inject this in so we can later compress this JavaScript
VideoCtrl.$inject = ['$scope', '$routeParams', 'ANNOTATION_MODE', 'Video', 'AnnotationHelper', 'SubtitleHelper', 'Butter', '$window'];
