'use strict';

angular.module('hummedia.services').
    factory('Video', ['$resource', 'appConfig', '$http', '$q', function($resource, config, $http, $q){
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
        }

        /**
         * Uploads a subtitle asynchronously to the given video.
         * @param file Blob the file to upload
         * @param pid String the identifier of the video
         * @param data An object with any additional form data to pass up
         *        {
         *          'name': ?, // the name of the subtitle
         *          'lang': ?  // the two-letter language code for the subtitle
         *        }
         * @return promise Resolves when the web server returns favorably
         */
        resource.addSubtitle = function(file, pid, data) {
            var deferred = $q.defer(),
                formdata = new FormData(),
                request  = new XMLHttpRequest();

            formdata.append('subtitle', file);

            Object.keys(data).forEach(function(i) {
                formdata.append(i, data[i]);
            });

            request.open('PATCH', config.apiBase + '/video/' + pid);
            request.onload = function() {
                if(request.status == 200) {
                    try {
                        deferred.resolve(JSON.parse(request.responseText));
                    }catch(e){
                        deferred.reject("Unable to parse response body.");
                    }
                }
                else
                {
                    deferred.reject("Server returned status " + request.status);
                }
            };
            request.send(formdata);
            return deferred.promise;
        }

        return resource;
    }]);
