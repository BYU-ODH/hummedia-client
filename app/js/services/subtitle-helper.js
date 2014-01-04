HUMMEDIA_SERVICES
    .service('SubtitleHelper', function() {
        return function SubtitleHelper(popcornInstance, resources) {
            if(this.constructor !== SubtitleHelper) {
                throw "Subtitle Helper must be called with the 'new' keyword.";
            }
            if(!popcornInstance instanceof window.Popcorn) {
                throw "popcornInstance not a valid instance of Popcorn";
            }
            
            var _exists = false;
            
            this.enable = function() {
                popcornInstance.enable('subtitle');
            };
            
            this.disable = function() {
                popcornInstance.disable('subtitle');
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
                        popcornInstance.parseVTT(url);
                        break;
                    case 'srt':
                        popcornInstance.parseSRT(url);
                        break;
                    default:
                        throw new Error("Parser for " + type + " not implemented.");
                }
            };
        };
    });