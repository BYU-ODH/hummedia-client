'use strict';
function AltVidCtrl($scope, $routeParams, 
        Video, $window, config, Annotation,
        $compile, $http) {

    //Code to style the page correctly
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
        // TODO: Once the AnnotationHelper has loaded the annotation information, we
        // should go fetch the annotations and apply them.
        // This ensures that the annotations checkbox will be displayed.
        var params = {
            'client': 'popcorn',
            'collection': coll,
            'dc:relation': vid};

        // Cut out all of the annotation information from the old-style Popcorn plugins
        // and put it into one of two lists depending on if the annotation is required.
        function unWrap(data) {
            var annotations = {required: [], optional: []}

            for (var i = 0; i < data.length; i++) {
                var resource = data[i];
                for (var j = 0; j < resource.media.length; j++) {
                    var media = resource.media[j];
                    for (var k = 0; k < media.tracks.length; k++) {
                        var track = media.tracks[k];
                        for (var m = 0; m < track.trackEvents.length; m++) {
                            var ev = track.trackEvents[m];
                            if (track.required) {
                                annotations.required.push(ev);
                            } else {
                                annotations.optional.push(ev);
                            }
                        }
                    }
                }
            }

            return annotations;
        }

        // T his converts the annotation data from old-style (Popcorn) plugins to new-style
        // (VideoJS) ones. It takes two separate lists of required and optional annotations.
        function convertAnnotations(required, optional) {
            // This defines the mapping between the plugin names on the old- and new-style
            // annotations. the key is the name of the old-style plugin, the value is the
            // name of the new-style plugin.
            var typeConv = {
                'annotation': 'annotation',
                'blank': 'blank',
                'block': 'block',
                'mutePlugin': 'mute',
                'pause': 'pause',
                'skip': 'skip'
            }

            // This defines the mapping between the fields on the old- and new-style annotations.
            // The root-level object key is the name of the plugin.
            // 'from' is the field from the old-style annotation.
            // 'to' is the field for the new-style annotation.
            // 'num' is whether or not the field should be converted to a number
            //     Popcorn uses strings for numbers for some reason.
            var fieldConv = {
                annotation: [],
                blank: [{from: 'start', to: 'start', num: true}, {from: 'end', to: 'end', num: true}],
                block: [],
                mute: [{from: 'start', to: 'start', num: true}, {from: 'end', to: 'end', num: true}],
                pause: [],
                skip: [{from: 'start', to: 'start', num: true}, {from: 'end', to: 'end', num: true}]
            }

            var results = {};

            // Convert the given list of plugins and optionally mark them as required.
            function convertList(list, required) {
                // Convert a single plugin.
                function convertSingle(type, data) {
                    var fields = fieldConv[type];
                    if (!fields) {
                        return null;
                    }

                    var result = {}
                    for (var i = 0; i < fields.length; i++) {
                        var field = fields[i];

                        // Check that needed field exists.
                        if (!data.hasOwnProperty(field.from)) {
                            return null;
                        }

                        if (field.num) {
                            parseFloat(result[field.to] = data[field.from]);
                        } else {
                            result[field.to] = data[field.from];
                        }
                    }

                    return result;
                }

                for (var i = 0; i <list.length; i++) {
                    var oldStyle = list[i];

                    var type = typeConv[oldStyle.type];
                    var data = oldStyle.popcornOptions;

                    var newStyle = convertSingle(type, data);

                    // Add successfully-converted annotations.
                    if (newStyle) {
                        newStyle.required = required;

                        if (results[type]) {
                            results[type].push(newStyle);
                        } else {
                            results[type] = [newStyle];
                        }
                    }
                }
            }

            convertList(required, true);
            convertList(optional, false);

            return results;
        }

        // The flow on this next bit is kind of tricky in an asynchronous
        // JavaScript-y way. We depend on the plugin data being fetched and plugins
        // initialized before we initialize the player.
        var annotations = [];
        var player = undefined;

        function initPlayer() {
            // Set the video to play.
            //this.src('https://vjs.zencdn.net/v/oceans.mp4');
            this.src(video.url[0]);

            // Load the correct skin.
            this.addClass('video-js');
            this.addClass('vjs-default-skin');

            // Enable a bunch of plugins.
            this.marginPlugin();

            this.annotationPlugin({annotations: annotations.annotations});
            this.blankPlugin({blanks: annotations.blanks});
            this.blockPlugin({blocks: annotations.blocks});
            this.mutePlugin({mutes: annotations.mute});
            this.pausePlugin({pauses: annotations.pause});
            this.skipPlugin({skips: annotations.skip});
        };

        function initPlugins(data) {
            console.log('initPlugins() called!');

            var oldAnnos = unWrap(data);
            console.log(oldAnnos);

            // Enable the checkbox if we have any optional annotations.
            $scope.video.hasAnnotations = oldAnnos.optional.length > 0;

            annotations = convertAnnotations(oldAnnos.required, oldAnnos.optional);
            console.log(annotations);

            console.log(defaultSkips());

            player = videojs('newVid', {}, initPlayer);
        }

        Annotation.query(params, initPlugins);

        // Send a simple PUT request to update the lastviewed date of the video.
        var req_conf = {method: 'PUT', url: config.apiBase + '/video/' + vid + '/view'};
        $http(req_conf).then(function(response) {});

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
AltVidCtrl.$inject = ['$scope', '$routeParams', 'Video', '$window', 'appConfig', 'Annotation', '$compile', '$http'];
