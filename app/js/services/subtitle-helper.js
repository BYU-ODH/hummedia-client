HUMMEDIA_SERVICES
    .service('SubtitleHelper', function() {
        var TRACK_ELEMENT_SUPPORTED = (function(){
            var video = document.createElement('video');
            return typeof video.addTextTrack === 'function'
        })();

        return function SubtitleHelper(popcornInstance, subtitles) {
            if(this.constructor !== SubtitleHelper) {
                throw "Subtitle Helper must be called with the 'new' keyword.";
            }
            if(! (popcornInstance instanceof window.Popcorn) ) {
                throw "popcornInstance not a valid instance of Popcorn";
            }
            
            var _exists       = false,
                _media        = popcornInstance.media,
                _currentIndex = 0; // which subtitle is currently selected
            
            this.enable = function() {
                if(TRACK_ELEMENT_SUPPORTED) {
                    if(_media.textTracks[_currentIndex]) {
                        _media.textTracks[_currentIndex].mode = "showing";
                    }
                }
                else
                {
                    popcornInstance.enable('subtitle');
                }
            };
            
            this.disable = function() {
                if(TRACK_ELEMENT_SUPPORTED) {
                    if(_media.textTracks[_currentIndex]) {
                        _media.textTracks[_currentIndex].mode = "disabled";
                    }
                }
                else
                {
                    popcornInstance.disable('subtitle');
                }
            };
            
            this.exists = function() {
                return _exists;
            };

            this.loadSubtitle = function(subtitle) {
                var index = subtitles.indexOf(subtitle);
                
                // make sure we're passing in only what we have
                if(index === -1) {
                    throw new Error("Subtitle not available. " +
                        "Must come from constructor method.");
                }

                _currentIndex = index;

                switch(subtitle.type) {
                    case 'vtt':
                        _addVTT(index);
                        break;
                    default:
                        throw new Error("Parser for " + subtitle.type +
                                " not implemented.");
                }
            }

            if(subtitles && subtitles.length) {
                if(TRACK_ELEMENT_SUPPORTED) {
                    subtitles.forEach(function(subtitle) {
                        var track = document.createElement("track");

                        track.kind    = 'subtitles';
                        track.src     = subtitle['@id'];
                        track.srclang = subtitle['lang'];
                        track.label   = subtitle['name'];

                        _media.appendChild(track);
                    });
                }

                this.loadSubtitle(subtitles[0]);
            };

            function _addVTT(index) {
                _exists = true;


                if(TRACK_ELEMENT_SUPPORTED) {
                    var tracks = _media.textTracks;

                    for(var i = 0; i<tracks.length; i++) {
                        track = tracks[i];
                        if(i === index) {
                            track.mode = 'showing';
                        }
                        else
                        {
                            track.mode = 'disabled';
                        }
                    }
                }
                else
                {
                    popcornInstance.parseVTT(subtitles[index]['@id']);
                }
            };
        };
    });
