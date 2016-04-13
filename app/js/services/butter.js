"use strict";
/**
 * Returns a function that loads up the ennotation editor.
 *
 * Butter(videoID, collectionID, [requiredAnnotationArray])
 */
HUMMEDIA_SERVICES.
    service('Butter', ['appConfig', 'user', 'AnnotationHelper', 'Collection',
    function(appConfig, user, AnnotationHelper, Collection){
        return function initialize(videoID, collectionID, required){
            window.require(['butter'], function() {
                Butter.init({
                    config: {
                        googleKey: appConfig.googleKey,
                        annotationUrl: appConfig.apiBase + '/annotation',
                        collection: collectionID,
                        video: videoID,
                        annotationID: null,// added in mediaReady method
                        requiredAnnotationID: null,//added in mediaReady method
                        admin: user.isSuperuser,
                        canAddRequired: true,
                        Collection: Collection,
                    },
                    ready: function(butter) {
                        EditorHelper.init(butter);

                        butter.listen( "mediaready", function mediaReady() {
                            var annotations = new AnnotationHelper(butter, videoID, collectionID, required);

                            annotations.ready(function updateConfig(){
                                // This is a massive hack. If you can find a less
                                // subversive way of doing this, I will name my
                                // child after you.
                                //
                                // All of this takes place just to change two config
                                // values.
                                var configValues = {
                                    annotationID: annotations.nonReqIDs[0],
                                    requiredAnnotationID: annotations.reqIDs[0]
                                };
                                var name = 'hum-butter-' + new Date().getTime();
                                var config = new butter.config.constructor(name, configValues);
                                butter.config.override(config);
                            });
                        });
                    }
                });
            });
        };
    }]);
