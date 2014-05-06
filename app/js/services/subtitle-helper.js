HUMMEDIA_SERVICES
    .service('SubtitleHelper', function() {
        return function SubtitleHelper(popcornInstance, subtitles) {
            if(this.constructor !== SubtitleHelper) {
                throw "Subtitle Helper must be called with the 'new' keyword.";
            }
            if(! (popcornInstance instanceof window.Popcorn) ) {
                throw "popcornInstance not a valid instance of Popcorn";
            }

            var TRACK_ELEMENT_SUPPORTED =
                    typeof popcornInstance.media.addTextTrack === 'function';
            
            var _exists       = false,
                _media        = popcornInstance.media,
                _currentIndex = 0, // which subtitle is currently selected
                _enabled      = true;
            
            this.enable = function() {
                _enabled = true;
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
                _enabled = false;
                if(TRACK_ELEMENT_SUPPORTED) {
                    for(var i = 0; i<_media.textTracks.length; i++) {
                        _media.textTracks[i].mode = "disabled";
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
                this.enable();

                switch(subtitle.type) {
                    case 'vtt':
                        _addVTT(index);
                        break;
                    default:
                        throw new Error("Parser for " + subtitle.type +
                                " not implemented.");
                }
            }

            Object.defineProperty(this, 'subtitles', {
                get: function() { return subtitles; }
            });
            
            Object.defineProperty(this, 'current', {
                get: function() {
                    return _enabled ? subtitles[_currentIndex] : null;
                }
            });

            if(subtitles && subtitles.length) {
                if(TRACK_ELEMENT_SUPPORTED) {
                    subtitles.forEach(function(subtitle) {
                        var track = document.createElement("track");

                        track.kind    = 'subtitles';
                        track.src     = subtitle['@id'];
                        track.srclang = subtitle['language'];
                        track.label   = subtitle['name'];

                        _media.appendChild(track);
                    });
                    this.disable();
                }
            };

            function _addVTT(index) {
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
                    removePopcornSubtitles();
                    popcornInstance.parseVTT(subtitles[index]['@id']);
                }
            };

            function removePopcornSubtitles() {
                if(TRACK_ELEMENT_SUPPORTED) {
                    throw "Track element is supported, so there are no Popcorn subtitles to remove.";
                }
                // this is a hack to get around Popcorn's hack of how it adds
                // subtitle events. Alternatively, we could find a separate
                // JavaScript vtt parser and add subtitle events manually.
                // That way, we'd have specific track event IDs to remove and
                // wouldn't have to comb through all existing IDs.

                // e.g., 00:00:02.400 --> 00:00:03.594
                var re = new RegExp(/^\d{2}:\d{2}:\d{2}.\d{3} --> \d{2}:\d{2}:\d{2}.\d{3}$/);
                popcornInstance.getTrackEvents().forEach(function kill(ev) {
                    if(re.test(ev.id)) {
                        popcornInstance.removeTrackEvent(ev.id);
                    }
                });
            }
        };
    });
