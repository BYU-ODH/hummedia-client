HUMMEDIA_SERVICES
    /**
     * For use when needing to clean up annotations prior to loading them.
     * This mutates the original object passed in.
     */
    .service('Sanitize', ['appConfig', function(appConfig){
        return function SanitizeAnnotation(trackEvent, preserveTimeCodes) {
            // these come back as strings, and our manipulation is with numbers
            trackEvent.popcornOptions.start = parseFloat(trackEvent.popcornOptions.start);
            trackEvent.popcornOptions.end = parseFloat(trackEvent.popcornOptions.end);

            switch(trackEvent.type) {
                case 'youtube-search':
                case 'freebase-search':
                    trackEvent.popcornOptions.key = appConfig.googleKey;
                    break;
            }

            /** @TODO: if the end field is absent, it probably should be fixed in the database **/
            if(isNaN(trackEvent.popcornOptions.end) || trackEvent.popcornOptions.start >= trackEvent.popcornOptions.end) {
                trackEvent.popcornOptions.end = trackEvent.popcornOptions.start + 1;
            }

            if(!preserveTimeCodes) {
                // Do this because some browsers' timing can be slightly innaccurate
                // We don't want to accidentally play an F-bomb
                trackEvent.popcornOptions.start -= .2;

                // round each trackEvent time
                trackEvent.popcornOptions.start = Math.round(trackEvent.popcornOptions.start*100)/100;
                trackEvent.popcornOptions.end = Math.round(trackEvent.popcornOptions.end*100)/100;
            }
        };
    }]);