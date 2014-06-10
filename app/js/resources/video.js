'use strict';

angular.module('hummedia.services').
    factory('Video', ['$resource', 'appConfig', '$http', '$q', 'Annotation', function($resource, config, $http, $q, Annotation){
        var resource = $resource(config.apiBase + '/video/:identifier', {identifier: '@identifier'},
        {
            search: {method: 'GET', isArray: true, params: {searchtype: 'keyword', q: '@q'}},
            advancedSearch: {method: 'GET', isArray: true},
            update: {method: 'PATCH'}
        });
        resource.advancedParams = ['yearfrom','yearto','ma:title','ma:description'];

        resource.files = function() {
            var deferred = $q.defer();
            $http.get(config.apiBase + '/batch/video/ingest').success(function(data){
                deferred.resolve(data);
            });
            return deferred.promise;
        };

        resource.ingest = function(filepath, pid, uniqueID) {
            return $http.post(config.apiBase + '/batch/video/ingest',[{filepath: filepath, pid: pid, id: uniqueID}]);
        };

        /* @TODO: refactor. Will take some work on the backend. */
        resource.toggleTranscript = function(pid, collectionID, enabled) {
            var deferred = $q.defer();
            // first see if there are existing annotations for this video
            Annotation.query({client: 'popcorn', collection: collectionID, 'dc:relation': pid}, handleAnnotation);

            function handleAnnotation(data) {
              var optional = data.filter(function(item){return !item.media[0].tracks[0].required});

              if(optional.length) {
                var annotation_id = optional[0].media[0].tracks[0].id;
                var save_me = {'pid': annotation_id, 'vcp:playSettings': {'vcp:showTranscript': enabled}};
                Annotation.update(save_me, deferred.resolve);
              }
              else
              {
                var post = {
                  "collection":collectionID,
                  "dc:relation":pid,
                  'vcp:playSettings': {'vcp:showTranscript': enabled}
                };
                Annotation.save(post, deferred.resolve);
              };
            };
            return deferred.promise;
        };

        return resource;
    }]);
