"use strict";

/**
 * Loads up a video, annotates it, and adds subtitles if found and requested.
 * Exposes the an object (named by the hum-video-model attribute)
 * to the calling scope, which is an instance of Video.get() with two special
 * properties:
 * 
 *   obj.hasSubtitles -> Whether or not the video has subtitles which can
 *                             be disabled
 *   obj.hasAnnotations -> Whether or not the video has annotations which
 *                               can be disabled
 * 
 *   Directive Attributes:
 *     hum-video {string/required}: the video id to watch
 *     
 *     hum-video-collection {string/optional}: the collection ID to tie in to the video 
 *                           
 *     hum-video-subtitles {bool/optional}: whether or not to show subtitles.
 *                                          defaults to true. DOES NOT APPLY WHEN
 *                                          hum-video-editor IS TRUE.
 *     
 *     hum-video-annotations {bool/optional}: whether or not to show non-required
 *                                            annotations. defaults to true.
 *                                            DOES NOT APPLY WHEN hum-video-editor
 *                                            IS TRUE.
 *                                            
 *     hum-video-object {object/optional}: The model to bind the humVideo object to
 *     
 *     hum-video-editor {bool/optional}: Wheter editor mode should be enabled.
 *     
 *  @TODO: Only inject the dependencies needed.
 */
HUMMEDIA_DIRECTIVES
    .directive('humVideo', ['Video', 'AnnotationHelper', 'SubtitleHelper', 'Butter', '$window',
    function(Video, AnnotationHelper, SubtitleHelper, Butter, $window) {
        var _index = 0;

        function addId(element) {
            if(element.id) {
                return element.id;
            }
            element.id = "hum-video-instance-" + (_index++);
            return element.id;
        }

        return {
            transclude: true,
            scope: {
                '_humVideo': '=?humVideoObject',
                'annotationsEnabled': '=?humVideoAnnotations',
                'subtitlesEnabled': '=?humVideoSubtitles',
                'playbackSpeed': '=?humVideoPlaybackSpeed'
            },
            template: '<div><div class="hum-video-container" data-repaint data-butter="media" data-butter-source="{{_humVideo.url.join(\',\')}}"></div></div>',
            replace: true,
            restrict: 'A',
            link: function($scope, element, attrs, controller) {
                var cId    = attrs['humVideoCollection'],
                    vId    = attrs['humVideo'],
                    editor = $scope.$eval(attrs['humVideoEditor']);
                    
                $scope._humVideo = Video.get({identifier: vId}, function initialize(video) {
                    var el = element.children()[0];
                    var elId = el.id || addId(el); // the element MUST have an ID for Popcorn AND Butter to work
                    
                    if(editor) {
                        Butter(vId, cId, video['ma:hasPolicy']);
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
                    
                    var pop = window.Popcorn.smart(elId, video.url, {
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


                    var annotation = new AnnotationHelper(pop, vId, cId, video['ma:hasPolicy']),
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
                        $scope._humVideo.hasAnnotations = annotation.hasNonrequired;
                        makeSpaceForAnnotations(pop.getTrackEvents());
                    });

                    $scope.$watch(function(){return subtitles.exists();}, function(val){
                        $scope._humVideo.hasSubtitles = val;
                    });

                    $scope.$watch('annotationsEnabled', function(value){
                        value === false ? annotation.disable() : annotation.enable();
                    });

                    $scope.$watch('subtitlesEnabled', function(value){
                        value === false ? subtitles.disable() : subtitles.enable();
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
        };
    }]);