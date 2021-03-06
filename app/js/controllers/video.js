'use strict';
function VideoCtrl($scope, $routeParams, ANNOTATION_MODE,
    Video, AnnotationHelper, SubtitleHelper, Butter, $window, config,
    $compile, analytics, $http, Clip) {

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

    $('#clip-start').mask('00:00:00');
    $('#clip-end').mask('00:00:00');

    $('#clip-name').on('click', function() {
      if ($(this).val() == "" && $('#clip-start').val() == "" && $('#clip-end').val() == "") {
        var toHMMSS = secs => {
            var hours   = Math.floor(secs / 3600) % 24;
            var minutes = Math.floor(secs / 60) % 60;
            var seconds = Math.floor(secs % 60);
            return [hours,minutes,seconds].map(v => v < 10 ? "0" + v : v).join(":")
        }
        $('#clip-start').val(toHMMSS(window.pop.video.currentTime));
        $('#clip-end').val(toHMMSS(window.pop.video.currentTime));
        $scope.newClip.start = $('#clip-start').val();
        $scope.newClip.end = $('#clip-end').val();
      }
    })

    if($scope.editorMode){
        //In editor mode, use the annotation layout
        $scope.annotationsLayout = true;
    }

    $scope.toggleDescription = function() {
        $('#description').slideToggle();
        $('#description-toggle-icon').toggleClass('icon-minus');
        $('#description-toggle-icon').toggleClass('icon-plus');
    };

    // Set the default values of the new clip.
    function resetNewClip() {
        $scope.newClip = {start: '', end: '', name: '', mediaid: vid}
    }
    resetNewClip();

    // Save the new clip to the server.
    $scope.saveNewClip = function() {
        if ($scope.newClip.start.match(/[0-9]{1}[0-9]{1}:[0-9]{1}[0-9]{1}:[0-9]{1}[0-9]{1}$/) 
            && $scope.newClip.end.match(/[0-9]{1}[0-9]{1}:[0-9]{1}[0-9]{1}:[0-9]{1}[0-9]{1}$/)) {

          var startVals = $scope.newClip.start.split(':').map(Number);
          var startSeconds = startVals[0] * 3600 + startVals[1] * 60 + startVals[2];

          var endVals = $scope.newClip.end.split(':').map(Number);
          var endSeconds = endVals[0] * 3600 + endVals[1] * 60 + endVals[2];

          if (startSeconds < endSeconds) {
            $scope.newClip.start = startSeconds;
            $scope.newClip.end = endSeconds;
            var result = Clip.post($scope.newClip);
            resetNewClip();
            $scope.clips.push(result);
          } else {
            alert('Please enter an end time that is after the start time.');
          }
        } else {
          alert('Invalid time. Please enter it in the format "HH:mm:ss".');
        }
    }

    // Get the clips associated with this user.
    $scope.clips = Clip.get_list();
    document.clip = Clip;

    // Delete the clip.
    $scope.deleteClip = function(clip) {
        var id = clip['_id'];

        // Find the index in the currently-visible ClipList.
        var index = -1;
        for (var i = 0; i < $scope.clips.length; i++) {
            if ($scope.clips[i]['_id'] === id) {
                index = i;
            }
        }

        // Delete from the currently-visible ClipList.
        $scope.clips.splice(index, 1);

        // Delete from the backend.
        Clip.delete({'id': id});
    }

    // Build a link for the clip.
    $scope.getClipLink = function(clip){
        var urlBase = window.location.origin;
        return urlBase + '/video/' + clip.mediaid + '?start=' + clip.start + '&end=' + clip.end;
    }

    // Set the clip's link to be either visible.
    $scope.showClipLink = function(clip) {
        clip.showLink = true;
    }

    // Set the clip's link to be either hidden.
    $scope.hideClipLink = function(clip) {
        clip.showLink = false;
    }

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
			$http(req_conf).then(function() {});

            pop = window.Popcorn.smart('hum-video', video.url, pop_opts);
            pop.media.classList.add('video-js'); // IE <=11 won't let us combine all these into one statement
            pop.media.classList.add('vjs-default-skin');
            pop.media.classList.add('vjs-big-play-centered');

            vjs = videojs(pop.media, vjs_opts, placeCaptionButton);
            initializePopcornDependents( pop );

            // Read and parse any paramaters from the URL and return them as a dictionary object.
            function getUrlParams() {
                var paramString = window.location.search.substr(1);
                if (paramString.length <= 0) {
                    return {}
                }

                var results = {};
                var params = paramString.split('&');
                for (var i in params) {
                    var parts = params[i].split('=');
                    results[parts[0]] = parts[1];
                }

                return results;
            }

            window.pop = pop;

            // If a 'start' param exists, fast-forward to that segment of the video.
            // This is used for the ClipList system.
            var params = getUrlParams();
            if (params.start) {
                var start = parseFloat(params.start);
                pop.currentTime(start);
            }

            // If an 'end' param exists, pause playback when it is reached.
            if (params.end) {
                var end = parseFloat(params.end);

                // We form a closure around 'pausedOnce' to make sure that the video
                // is only paused the first time the end of the clip is reached.
                var pausedOnce = false;
                function pauseOnEnd(ev, a) {
                    if (!pausedOnce) {
                        if (pop.currentTime() >= end) {
                            pausedOnce = true;
                            pop.pause();
                        }
                    }
                }
                pop.on('timeupdate', pauseOnEnd);
            }
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
            if (typeof annotation === 'undefined' || annotation) {
              annotation.destroy();
            }
            if(pop) {
              pop.destroy();
            }
            $window.removeEventListener('blur', pauseVideo);
        });

        $('#cliplist-container h2').mousedown(function(e){
          e.preventDefault();
          window.dragging = {};
          dragging.pageX0 = e.pageX;
          dragging.pageY0 = e.pageY;
          dragging.element = $(this).parent().parent();
          dragging.offset0 = $(this).parent().parent().offset();
          function drag(e){
              var left = dragging.offset0.left + (e.pageX - dragging.pageX0);
              var top = dragging.offset0.top + (e.pageY - dragging.pageY0);
              dragging.element.offset({top: top, left: left});
          }
          function release(e){
              $('body').off('mousemove', drag)
              $('body').off('mouseup', release);
          }
          $('body').on('mouseup', release);
          $('body').on('mousemove', drag);
        });
    });
}
// always inject this in so we can later compress this JavaScript
VideoCtrl.$inject = ['$scope', '$routeParams', 'ANNOTATION_MODE', 'Video', 'AnnotationHelper', 'SubtitleHelper', 'Butter', '$window', 'appConfig','$compile', 'analytics', '$http', 'Clip'];
