HUMMEDIA_SERVICES
    .service('SubtitleHelper', function() {
        var TRACK_ELEMENT_SUPPORTED = (function(){
            var video = document.createElement('video');
            return typeof video.addTextTrack === 'function'
        })();

        return function SubtitleHelper(popcornInstance, resources) {
            if(this.constructor !== SubtitleHelper) {
                throw "Subtitle Helper must be called with the 'new' keyword.";
            }
            if(! (popcornInstance instanceof window.Popcorn) ) {
                throw "popcornInstance not a valid instance of Popcorn";
            }
            
            var _exists = false,
                _track  = document.createElement("track");
            
            this.enable = function() {
                popcornInstance.enable('subtitle');

                if(TRACK_ELEMENT_SUPPORTED) {
                    var media = popcornInstance.media;
                    for(var i = 0; i<media.textTracks.length; i++) {
                        media.textTracks[i].mode = "showing";
                    }
                }
            };
            
            this.disable = function() {
                popcornInstance.disable('subtitle');

                if(TRACK_ELEMENT_SUPPORTED) {
                    var media = popcornInstance.media;
                    for(var i = 0; i<media.textTracks.length; i++) {
                        media.textTracks[i].mode = "hidden";
                    }
                }
            };
            
            this.exists = function() {
                return _exists;
            };

            if(resources && resources.length) {
                /** @TODO: Allow for multiple subtitles **/
                var url = resources[0]['@id'],
                    type = resources[0]['type'];

                _exists = true;
                switch(type) {
                    case 'vtt':
                        _addVTT(url);
                        break;
                    case 'srt':
                        popcornInstance.parseSRT(url);
                        break;
                    default:
                        throw new Error("Parser for " + type + " not implemented.");
                }
            };

            function _addVTT(url) {
                if(TRACK_ELEMENT_SUPPORTED) {
                    _track.kind = 'subtitles';
                    _track.src  = url;
                    popcornInstance.media.appendChild(_track);
                }
                else
                {
                    popcornInstance.parseVTT(url);
                }
            };
        };
    });
