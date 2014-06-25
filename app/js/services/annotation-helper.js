"use strict";
/**
 * Turns on any annotations related to a video.
 * Usage: var x = new annotationHelper(...);
 * Constructor Parameters:
 *      popcornInstance {Popcorn|Butter} - Should be an instance of Popcorn or Butter to which annotations should be applied
 *      videoId {string} - The video to find annotations for. Optional if {collectionId} is omitted
 *      collectionId {string|optional} - Necessary to find annotations for a specific video/collection set
 *      required     {array[string]|optional} Any IDs of any annotations that should be tied to the video.
 *                   These annotations cannot be disabled.
 *  
 *  Methods:
 *      void enable()  - Turns on any disabled annotations
 *      void disable() - Turns off any enabled and non-required annotations
 *      
 *      void ready(callback{function}) - called as soon as the annotations have finished loading
 *      
 *  Properties:
 *      bool hasNonrequired    - Returns whether or not this instance has any annotations
 *                               that can be disabled.
 *      array reqIDs           - required annotation IDs -- usually identical to reqAnnotationArray
 *      array nonReqIDs        - non-required annotation IDs
 *      bool transcriptEnabled - whether or not transcripts are turned on for this annotation
 */
HUMMEDIA_SERVICES
    .service('AnnotationHelper', ['Annotation', 'Sanitize', '$q', function(Annotation, Sanitize, $q) {
        
        return function AnnotationHelper(popcornInstance, videoId, collectionId, reqAnnotationArray) {
            var _isEditor = (typeof popcornInstance.generateSafeTrackEvent === 'function');

            if(this.constructor !== AnnotationHelper) {
                throw "Annotation Helper must be called with the 'new' keyword.";
            }
            if(!popcornInstance instanceof window.Popcorn && !_isEditor) {
                throw "One of two errors ocurred: " +
                      "popcornInstance not a valid instance of Popcorn OR " +
                      "not a valid instance of Butter";
            }
            
            var _enabled     = [], // array of objects
                _disabled    = [], // array of objects
                _isDisabled  = false,
                _reqIDs      = [], // all annotation IDs that are required
                _nonReqIDs   = [], // all annotation IDs that are non-required
                // full list of IDs added
                _addedSets   = [],
                _self        = this,
                _transcript  = false, // whether or not transcripts are allowed
                _ready       = $q.defer(), // relies on _reqLoad and _nonreqLoad
                _reqLoad     = $q.defer(),
                _nonreqLoad  = $q.defer();
            
            _reqLoad.promise.then(function(){
               _nonreqLoad.promise.then(function(){
                   _ready.resolve();
               });
            });
            
            this.destroy = function() {
                var events = popcornInstance.getTrackEvents();
                if(events instanceof Array) {
                    events.forEach(function(event){
                        popcornInstance.removeTrackEvent(event._id);
                    });
                }
                _enabled = [];
                _disabled = [];
                _reqIDs = [];
                _nonReqIDs   = [];
                _isDisabled = false;
                _addedSets = [];
            };
            
            this.ready = function(callback) {
                if(typeof callback === 'function') {
                    _ready.promise.then(function(){
                        callback(_self);
                    });
                }
            };
            
            // disable all enabled annotations
            this.disable = function () {
                if(_isEditor) {
                    // NB: There's no good reason for this other than 
                    // I'm not sure how/if the Butter API exposes a way
                    // to remove a track event á la Popcorn
                    throw "Annotations cannot be disabled in editor mode.";
                }
                if(_isDisabled) {
                    return;
                }
                _isDisabled = true;
                _enabled.forEach(function(ann, index){
                    popcornInstance.removeTrackEvent(ann.__popcornEventId);
                    _disabled.push(ann);
                    _enabled.splice(index, 1);
                });
            };
            
            // enable all disabled annotations
            this.enable = function () {
                if(!_isDisabled) {
                    return;
                }
                _isDisabled = false;
                _disabled.forEach(function(ann, index){
                    ann.__popcornEventId = _addEvent(ann);
                    _enabled.push(ann);
                    _disabled.splice(index, 1);
                });
            };
            
            window.Object.defineProperties(this, {
                "hasNonrequired": {
                    enumerable: true,
                    get: function() {
                        return !!(_enabled.length || _disabled.length);
                    }
                },
                "reqIDs": {
                    enumerable: true,
                    get: function() {
                        var current = reqAnnotationArray;
                        
                        _reqIDs.forEach(function(id){
                            if(current.indexOf(id) !== -1) {
                                current.push(id);
                            }
                        });
                        return current;
                    }
                },
                "nonReqIDs": {
                    enumerable: true,
                    get: function() {
                        return _nonReqIDs;
                    }
                },
                "transcriptEnabled": {
                    enumerable: true,
                    get: function() {
                        return _transcript;
                    }
                }
            });
            
            function _exists(id) {
                return _addedSets.indexOf(id) !== -1;
            };
            
            function _initAnnotation(annotation) {
                if(annotation instanceof Array) {
                    annotation.forEach(_processAnnotation);
                }
                else
                {
                    _processAnnotation(annotation);
                }
            }
            
            // Adds an event.
            // This will return the event ID if in popcorn mode
            // otherwise, if in editor mode, it will return undefined
            function _addEvent(event) {
                if(_isEditor) {
                    popcornInstance.generateSafeTrackEvent(event.type, event.popcornOptions);
                    return;
                }
                if(typeof popcornInstance[event.type] !== 'function') {
                    if(window.console && window.console.error) {
                        window.console.error("Annotation " + event.type + " not supported.");
                    }
                    return;
                }
                popcornInstance[event.type](event.popcornOptions);
                return popcornInstance.getLastTrackEventId();
            };
            
            function _processAnnotation(a) {
                a.media[0].tracks.forEach(function(track){
                    if(_exists(track.id)) {
                        return;
                    }
                    // note that this ignores any negatives
                    if(track.settings && track.settings['vcp:showTranscript']){
                      _transcript = true;
                    }
                    _addedSets.push(track.id);
                    track.trackEvents.forEach(function(event){
                        Sanitize(event, _isEditor);

                        if(track.required) {
                            // __humrequired is checked by Butter
                            event.popcornOptions.__humrequired = true;
                            _reqIDs.push(track.id);
                            _addEvent(event);
                            return;
                        }
                        
                        event.popcornOptions.__humrequired = false;
                        _nonReqIDs.push(track.id);

                        if(_isDisabled) {
                            _disabled.push(event);
                            return;
                        }
                        
                        event.__popcornEventId = _addEvent(event);
                        _enabled.push(event);
                    });
                });
            };
            
            // loads annotations based on the given collection
            function _loadCollection() {
                if(!collectionId) {
                    _nonreqLoad.resolve();
                    return;
                }
                var params = {
                    "dc:relation": videoId,
                    "collection":  collectionId,
                    "client":      "popcorn"
                };
                Annotation.query(params, function(data){
                    _initAnnotation.apply(this, arguments);
                    _nonreqLoad.resolve();
                });
            };
            
            // loads annotations based on the given required values
            function _loadRequired() {
                if(!reqAnnotationArray || !reqAnnotationArray.length) {
                    _reqLoad.resolve();
                    return;
                }
                
                var count = 0;
                reqAnnotationArray.forEach(function(id) {
                    Annotation.get({identifier: id, client: "popcorn"}, function(){
                        _initAnnotation.apply(this, arguments);
                        if(++count >= reqAnnotationArray.length) {
                            _reqLoad.resolve();
                        }
                    });
                });
            };
            
            /**
             * INITIALIZE EVERYTHING
             */
            _loadCollection();
            _loadRequired();
        };
    }]);
