'use strict';
function VideoCtrl($scope, $routeParams, ANNOTATION_MODE,
    Video, AnnotationHelper, SubtitleHelper, Butter, $window, config,
    $compile, analytics, $http) {

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

    var coll = $routeParams.collection;
    var vid  = $routeParams.id;

    $scope.annotationsEnabled = true;
    $scope.subtitlesEnabled = true;
    $scope.editorMode = ANNOTATION_MODE;
    $scope.annotationsLayout = false;

    if($scope.editorMode){
        //In editor mode, use the annotation layout
        $scope.annotationsLayout = true;
    }

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
                }
            });
            return;
        }

        function placeCaptionButton() {
            // I'm only doing it this way because it's the easiest way at the moment.
            // feel free to change this to something less repulsive.
            var div = document.createElement('div');
            div.innerHTML = '<div ng-show="subtitles" class="vjs-captions-button vjs-menu-button vjs-control">' +
                '<select ng-model="subtitle" ng-options="s.displayName for s in subtitles | orderBy:\'displayName\'">' +
                  '<option value="">None</option>' +
                '</select>' +
              '</div>';
            this.controlBar.el().appendChild(div.children[0]);
            $compile(this.controlBar.el())($scope);
        }

        var vjs_opts = {
            height: '80%', // even though this is in the CSS, without it native videos are sized too small
            width: null,
            children: {}
        };
        var pop = null,
            vjs = null,
            pop_opts =  {frameAnimation: true}; // allows for more accurate timing

        if(video.type === 'yt') {
            var el = $('#hum-video')[0];

            el.classList.add('video-js'); // IE <=11 won't let us combine all these into one statement
            el.classList.add('vjs-default-skin');
            el.classList.add('vjs-big-play-centered');

            vjs_opts['techOrder'] = ['youtube'];
            vjs_opts['src'] = video.url[0];
            vjs_opts['controls'] = true;

            vjs_opts.children.loadingSpinner = false;
            vjs_opts.children.bigPlayButton = false;
            vjs_opts.children.posterImage = false;

            vjs = videojs("hum-video", vjs_opts, function() {
                var media_el = Popcorn.HTMLVideojsVideoElement( vjs );
                pop = Popcorn(media_el, pop_opts);
                placeCaptionButton.apply(this);
                initializePopcornDependents( pop );
            });
        }
        else
        {
            // if used on YT, shows 'undefined'
            vjs_opts['playbackRates'] = [0.5, 1, 1.5, 2];

            if(video.type === 'humaudio') {
                vjs_opts.children.bigPlayButton = false;
            }

			// Simple PUT request to update the lastviewed date of the video.
			var req_conf = {method: 'PUT', url: config.apiBase + '/video/' + vid + '/view'};
			$http(req_conf).then(function(response) {console.log('marked as viewed!');});

            pop = window.Popcorn.smart('hum-video', video.url, pop_opts);
            pop.media.classList.add('video-js'); // IE <=11 won't let us combine all these into one statement
            pop.media.classList.add('vjs-default-skin');
            pop.media.classList.add('vjs-big-play-centered');

            vjs = videojs(pop.media, vjs_opts, placeCaptionButton);
            initializePopcornDependents( pop );
        }

        function initializePopcornDependents( pop ) {
          //Adding Event Listeners to video element

          if(pop.media) {
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
          };

          // GOOGLE ANALYTICS
          vjs.on('playButtonClicked', function() {
            analytics.event('Video', 'Play', video['ma:title'], pop.currentTime());
          });
          vjs.on('pauseButtonClicked', function() {
            analytics.event('Video', 'Pause', video['ma:title'], pop.currentTime());
          });
          vjs.on('scrubStart', function() {
            analytics.event('Video', 'ScrubStart', video['ma:title'], pop.currentTime());
          });
          vjs.on('scrubEnd', function() {
            analytics.event('Video', 'ScrubEnd', video['ma:title'], pop.currentTime());
          });
          vjs.on('muteClick', function() {
            analytics.event('Video', 'Mute', video['ma:title'], pop.currentTime());
          });
          vjs.on('unMuteClick', function() {
            analytics.event('Video', 'UnMute', video['ma:title'], pop.currentTime());
          });
          vjs.on('fullscreenClick', function() {
            analytics.event('Video', 'Fullscreen', video['ma:title'], pop.currentTime());
          });
          vjs.on('windowedClick', function() {
            analytics.event('Video', 'Windowed', video['ma:title'], pop.currentTime());
          });
          vjs.on('playbackRateClick', function() {
            analytics.event('Video', 'Playback Rate', video['ma:title'], pop.playbackRate());
          });

          var annotation = new AnnotationHelper(pop, vid, coll, video['ma:hasPolicy']),
              subtitles  = new SubtitleHelper(pop, video['ma:hasRelatedResource']);

          function unsupportedDevice() {
            pop.destroy();
            pop.media.remove();
            $("#hum-video").html("<h1>We're sorry, but this film is currently unsupported on your device. " +
            "If you are using a mobile device (iPad, iPhone, or iPod), please move to a desktop computer "+
            "or a laptop. Thank you for your patience.</h2>");
          }

          annotation.ready(function handleSettings() {
            if(annotation.length && navigator.userAgent.match(/(iPad|iPod|iPhone)/)) {
              unsupportedDevice();
            }
            if(video['ma:hasRelatedResource'].length && annotation.transcriptEnabled) {
                $scope.annotationsLayout = true;
            };
          });

          var makeSpaceForAnnotations = function(events){
              var whitelist = {"skip":true,"blank":true,"mutePlugin":true, "subtitle": true};
              for(var i=0; i<events.length; i++){
                  //check if plugin is on whitelist
                  if(!whitelist[events[i]["_natives"]["plugin"]]){
                      //Switch to the annotations layout
                      $scope.annotationsLayout = true;
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

          $scope.$watch('subtitle', function(subtitle) {
              pop.removePlugin('transcript');
              if(!subtitle) {
                  subtitles.disable();
                  return;
              }
              if(annotation.transcriptEnabled) {
                  annotation.ready(function handleSettings() {
                      $scope.annotationsLayout = true;
                      subtitles.loadSubtitle(subtitle);
                      pop.transcript({target: 'target-1', srcLang: subtitle.language, destLang: 'en', api: config.dictionary});
                  });
              }else{
                  subtitles.loadSubtitle(subtitle);
              }
          });

          $scope.$watch(function(){return subtitles.current;},
              function(current) {
                  $scope.subtitle = current;
              }
          );

          $scope.$watch('annotationsEnabled', function(value){
              value === false ? annotation.disable() : annotation.enable();
          });

        };


        // Unless we pause the movie when the page loses focus, annotations
        // will not continue to be used even though the movie will play in
        // the background
        function pauseVideo() {
            if(pop) {
              pop.pause();
            }
        };
        $window.addEventListener('blur', pauseVideo);
        $scope.$on('$destroy', function cleanup() {
            /**
             * TODO: these can potentially be created AFTER leaving the page.
             * we need to destroy them then
             */
            if (annotation) {
              annotation.destroy();
            }
            if(pop) {
              pop.destroy();
            }
            $window.removeEventListener('blur', pauseVideo);
        });
    });
}
// always inject this in so we can later compress this JavaScript
VideoCtrl.$inject = ['$scope', '$routeParams', 'ANNOTATION_MODE', 'Video', 'AnnotationHelper', 'SubtitleHelper', 'Butter', '$window', 'appConfig','$compile', 'analytics', '$http'];
