'use strict';

angular.module('hummedia.services').
    factory('Annotation', ['$resource', 'appConfig', function($resource, config){
        var resource = $resource(config.apiBase + '/annotation/:identifier', {identifier: '@pid', collection: '@collection'},
            {
              'update': {method: 'PATCH'}
            }
        );
        
        return resource;
    }]);
