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
        return resource;
    }]);
