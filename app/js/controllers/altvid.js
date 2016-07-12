'use strict';
function AltVidCtrl($scope, $routeParams, 
        Video, AnnotationHelper, SubtitleHelper, Butter, $window, config,
        Annotation,
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

    $scope.toggleDescription = function() {
        $('#description').slideToggle();
        $('#description-toggle-icon').toggleClass('icon-minus');
        $('#description-toggle-icon').toggleClass('icon-plus');
    };

    $scope.video = Video.get({identifier: vid}, function initialize(video) {
        function initPlayer() {
            // Set the video to play.
            //this.src('https://vjs.zencdn.net/v/oceans.mp4');
            this.src(video.url[0]);

            // Load the correct skin.
            this.addClass('video-js');
            this.addClass('vjs-default-skin');

            // Enable a bunch of plugins.
            this.marginPlugin();

            this.annotationPlugin({annotations: defaultAnnotations()});
            this.blankPlugin({blanks: defaultBlanks()});
            this.blockPlugin({blocks: defaultBlocks()});
            this.mutePlugin({mutes: defaultMutes()});
            this.pausePlugin({pauses: defaultPauses()});
            this.skipPlugin({skips: defaultSkips()});
        };

        // Send a simple PUT request to update the lastviewed date of the video.
        var req_conf = {method: 'PUT', url: config.apiBase + '/video/' + vid + '/view'};
        $http(req_conf).then(function(response) {});

        var player = videojs('newVid', {}, initPlayer);

        // GOOGLE ANALYTICS
        player.on('playButtonClicked', function() {
            analytics.event('Video', 'Play', video['ma:title'], this.currentTime());
        });
        player.on('pauseButtonClicked', function() {
            analytics.event('Video', 'Pause', video['ma:title'], this.currentTime());
        });
        player.on('scrubStart', function() {
            analytics.event('Video', 'ScrubStart', video['ma:title'], this.currentTime());
        });
        player.on('scrubEnd', function() {
            analytics.event('Video', 'ScrubEnd', video['ma:title'], this.currentTime());
        });
        player.on('muteClick', function() {
            analytics.event('Video', 'Mute', video['ma:title'], this.currentTime());
        });
        player.on('unMuteClick', function() {
            analytics.event('Video', 'UnMute', video['ma:title'], this.currentTime());
        });
        player.on('fullscreenClick', function() {
            analytics.event('Video', 'Fullscreen', video['ma:title'], this.currentTime());
        });
        player.on('windowedClick', function() {
            analytics.event('Video', 'Windowed', video['ma:title'], this.currentTime());
        });
        player.on('playbackRateClick', function() {
            analytics.event('Video', 'Playback Rate', video['ma:title'], this.playbackRate());
        });

        /*
        console.log($scope.video);
        var annos = Annotation.get({identifier: coll}, function(){console.log('request made!');});
        console.log(annos);
        */

        var pop = window.Popcorn.smart('newVid', video.url, {});
        var annotation = new AnnotationHelper(pop, vid, coll, video['ma:hasPolicy']);
        annotation.ready(function() {
            var reqIds = annotation.reqIDs || [];
            var nonReqIds = annotation.nonReqIDs || [];
            console.log(reqIds);
            console.log(nonReqIds);

            $scope.video.hasAnnotations = annotation.hasNonrequired;
        });

        /*
           var annotation = new AnnotationHelper(pop, vid, coll, video['ma:hasPolicy']),
           subtitles  = new SubtitleHelper(pop, video['ma:hasRelatedResource']);
           */

        /*
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
        */

        /*
        // @TODO: change to a promise...or something
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
        */

        /*
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
           */

        /*
           $scope.$watch(function(){return subtitles.current;},
           function(current) {
           $scope.subtitle = current;
           }
           );
           */

        /*
           $scope.$watch('annotationsEnabled', function(value){
           value === false ? annotation.disable() : annotation.enable();
           });

           };
           */

        $scope.$watch('annotationsEnabled', function(value) {
            console.log('annotations?: %s', value);
        });

        // Unless we pause the movie when the page loses focus, annotations
        // will not continue to be used even though the movie will play in
        // the background
        function pauseVideo() {
            player.pause();
        };
        $window.addEventListener('blur', pauseVideo);
        $scope.$on('$destroy', function cleanup() {
            $window.removeEventListener('blur', pauseVideo);
        });
});

document.vid = $scope.video;
}
// always inject this in so we can later compress this JavaScript
AltVidCtrl.$inject = ['$scope', '$routeParams', 'Video', 'AnnotationHelper', 'SubtitleHelper', 'Butter', '$window', 'appConfig', 'Annotation', '$compile', 'analytics', '$http'];
