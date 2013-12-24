'use strict';
function VideoCtrl($scope, $routeParams, Video, Annotation, appConfig, ANNOTATION_MODE, user, analytics) {

    /**
     * Starts up Butter and enables the plugins found in $scope.annotations.
     * @param annotationID - If set, when saving non-required annotations, butter will save them under this ID
     * @param requiredAnnotationID - If set, when saving required annotations, butter will save them under this ID
     */
    function butter_with_plugins(annotationID, requiredAnnotationID) {

        /**
         * @TODO: Perhaps move Butter into a service so we don't have to set this up ourselves like this
         *        also provide a deinit method (maybe?) to destruct everything when we leave the page
         */
        require(['butter'], function() {
            // this is a fix that destroys the Butter-specific DOM infestation
            var promptOff = $scope.$on('$locationChangeStart', function promptBeforeRedirecting(ev, newUrl, oldUrl) {
                ev.preventDefault();
                if(confirm("Are you sure you want to navigate away from this page? Your unsaved work will be lost.")) {
                    promptOff();
                    window.location = newUrl;
                    window.location.reload();
                }
            });

            Butter.init({
              config: {
                  googleKey: appConfig.googleKey,
                  annotationUrl: appConfig.apiBase + '/annotation',
                  collection: $routeParams.collection,
                  video: $scope.video.pid,
                  annotationID: annotationID,
                  requiredAnnotationID: requiredAnnotationID,
                  admin: user.isSuperuser
              },
              ready: function( butter ) {
                EditorHelper.init( butter );

                $scope.butter = butter;

                butter.listen( "mediaready", function mediaReady() {
                  butter.unlisten( "mediaready", mediaReady );
                  if($scope.annotations) {
                      loadEachAnnotation(butter);
                  }
                });
              }
            });
        });
    }

    /**
     *  Initializes page for annotating the video
     */
    function annotator_init() {
        // load the annotations
        var required_annotation = ($scope.video['ma:hasPolicy'] ? $scope.video['ma:hasPolicy'][0] : false);
        
        if($routeParams.collection === undefined && !required_annotation) {
            butter_with_plugins();
            return;
        }
        
        if($routeParams.collection) {
            // we need to load an array of annotations
            var params = {"dc:relation":$scope.video.pid, "collection":$routeParams.collection, "client":"popcorn"};
            $scope.annotations = Annotation.query(params, function(){
                var annotation_id = null;
                for(var i = 0; i<$scope.annotations.length; i++) {
                    // @TODO: the API could probably return something easier to access
                    var id = $scope.annotations[i].media[0].tracks[0].id;
                    if(id != required_annotation) {
                        annotation_id = id;
                        break;
                    }
                }
                butter_with_plugins(annotation_id, required_annotation);
            });
        }
        else
        {
            // there are no predefined annotations, aside from a set of required annotations
            $scope.annotations = Annotation.get({identifier: required_annotation, client: "popcorn"}, function(){
                butter_with_plugins(null, required_annotation)
            });
        }
    };
    
    /**
     * callback function for after we call methods on the Annotation resource
     * enables each individual annotation
     */
    function loadEachAnnotation(butter){
        // helper function for the helper function ;)
        var loadAnnotation = function(data, butter) {
            data.pid = data.media[0].tracks[0].id; // @todo -- ought to be more accessible from the API
            
            if(data.media[0].tracks[0].required) {
                data.required = true;
            }
            else
            {
                $scope.has_optional_annotations = true;
            }
            
            enableAnnotation(data, butter);
        };
        
        if($scope.annotations instanceof Array) {
            $scope.annotations.forEach(function(annotation) {
                loadAnnotation(annotation, butter);   
            });
        }
        else
        {
            loadAnnotation($scope.annotations, butter);
        }
    };

    /**
     * Initializes page for viewing video
     */
    function viewer_init() {
        pop = Popcorn.smart("video", $scope.video.url, {
            frameAnimation: true
        });

        // Unless we pause the movie when the page loses focus, annotations
        // will not continue to be used even though the movie will play in
        // the background
        function pauseVideo() {
            if(pop) {
                pop.pause();
            }
        };
        $(window).on('blur', pauseVideo);
        $scope.$on('$locationChangeStart', function disablePauseOnBlur() {
            $(window).off('blur', pauseVideo);
        });
        
        var resource = $scope.video['ma:hasRelatedResource'];
        if(resource && resource.length) {
            /** @TODO: Allow for multiple subtitles **/
            var url = resource[0]['@id'];
            var type = resource[0]['type'];
            $scope.has_subtitles = true;
            $scope.subtitlesEnabled = true;

            $scope.$watch('subtitlesEnabled', function(val) {
                if(val) {
                    pop.enable('subtitle');
                }
                else
                {
                    pop.disable('subtitle');
                }
            });

            switch(type) {
                case 'vtt':
                    pop.parseVTT(url);
                    break;
                case 'srt':
                    pop.parseSRT(url);
                    break;
                default:
                    throw new Error("Parser for " + type + " not implemented.");
            }
        }
        
        var required_annotation = ($scope.video['ma:hasPolicy'] ? $scope.video['ma:hasPolicy'][0] : false);
        
        if($routeParams.collection === undefined && !required_annotation) {
            // we're done here. there are no annotations.
            return;
        }
        
        
        if($routeParams.collection) {
            // we need to load an array of annotations
            var params = {"dc:relation":$scope.video.pid, "collection":$routeParams.collection, "client":"popcorn"};
            $scope.annotations = Annotation.query(params, function(){loadEachAnnotation();});
        }
        else
        {
            // there is only one required annotation; load it
            $scope.annotations = Annotation.get({identifier: required_annotation, client: "popcorn"}, function(){loadEachAnnotation()});
        }
    }
    
	var annotation_ids = {}, // PID-keyed arrays of track event IDs, as specified by Popcorn
        pop, // the Popcorn object, initialized under Video.get below
        annotations_enabled = true;
        
    $scope.has_optional_annotations = false;

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
  /////////////////////////////////////////////
    
    /**
     * Turns off an annotation
     * @param {Annotation} annotation
     */
    function disableAnnotation(annotation) {
        var index = annotation.pid;
        
        // make sure it's ready / exists
        if(!pop instanceof Popcorn) {
            throw new Error("Popcorn player does not exist yet");
        }
        
        // the annotation does not exist
        if(annotation_ids[index] === undefined) {
            return;
        }
        
        annotation_ids[index].forEach(function(id) {
            pop.removeTrackEvent(id);
        });
        delete annotation_ids[index];
    };

    function cleanAnnotationForPopcorn(annotation) {
        // these come back as strings, and our manipulation is with numbers
        annotation.popcornOptions.start = parseFloat(annotation.popcornOptions.start);
        annotation.popcornOptions.end = parseFloat(annotation.popcornOptions.end);

        switch(annotation.type) {
            case 'youtube-search':
            case 'freebase-search':
                annotation.popcornOptions.key = appConfig.googleKey;
                break;
        }

        /** @TODO: if the end field is absent, it probably should be fixed in the database **/
        if(isNaN(annotation.popcornOptions.end) || annotation.popcornOptions.start >= annotation.popcornOptions.end) {
            annotation.popcornOptions.end = annotation.popcornOptions.start + 1;
        }
        
        //Add some slush time to annotations
        annotation.popcornOptions.start -= .2;
        
        // round each annotation time
        annotation.popcornOptions.start = Math.round(annotation.popcornOptions.start*100)/100;
        annotation.popcornOptions.end = Math.round(annotation.popcornOptions.end*100)/100;
    }
    
    /**
     * If butter is passed in, attaches the annotation to that instance
     */
    function enableAnnotation(annotation, butter) {
        if(!pop instanceof Popcorn) {
            throw new Error("Popcorn player does not exist yet");
        }
        var index = annotation.pid;
        
        if(annotation_ids[index] !== undefined) {
            throw new Error("Cannot enable the same annotation more than once.");
        }
        
        var ids = [];
        annotation.media[0].tracks.forEach(function(element){
            element.trackEvents.forEach(function(element){

                cleanAnnotationForPopcorn(element);

                if(butter) {
                    element.popcornOptions.__humrequired = annotation.required || false; // allows butter to hide the track event if needed
                    butter.generateSafeTrackEvent(element.type, element.popcornOptions);
                }
                else
                {
                    if(typeof pop[element.type] !== 'function') {
                        if(appConfig.debugMode) {
                            throw "Popcorn plugin type '" + element.type + "' does not exist";
                        }
                    }
                    pop[element.type](element.popcornOptions);
                    ids.push(pop.getLastTrackEventId());
                }
            });
        });
        annotation_ids[index] = ids;
    }
    
    $scope.toggleAnnotations = function() {

        if(annotations_enabled) {
            analytics.event('annotations', 'disable', $scope.video['ma:title']);
        }
        else
        {
            analytics.event('annotations', 'enable', $scope.video['ma:title']);
        }

        $scope.annotations.forEach(function(a) {
            if(a.required) {
                return; // this can't be toggled; it should always be on
            }
            
            if(annotations_enabled) {
                disableAnnotation(a);
            }
            else
            {
                enableAnnotation(a);
            }
        });
        
        annotations_enabled = !annotations_enabled;
    };
    
    $scope.$on('$locationChangeStart', function disableAllAnnotations() {        
        if($scope.annotations instanceof Array) {                
            $scope.annotations.forEach(function(a) {
                disableAnnotation(a);
            });        
        }
    });
    
    $scope.toggleDescription = function() {
        $('#description').slideToggle();
        $('#description-toggle-icon').toggleClass('icon-minus');
        $('#description-toggle-icon').toggleClass('icon-plus');
    };
    
    $scope.video = Video.get({identifier:$routeParams.id}, function loadPopcorn(){
        if(ANNOTATION_MODE) {
            annotator_init();
        }
        else
        {
            viewer_init();
        }
    });
}
// always inject this in so we can later compress this JavaScript
VideoCtrl.$inject = ['$scope', '$routeParams', 'Video', 'Annotation', 'appConfig', 'ANNOTATION_MODE', 'user', 'analytics'];
