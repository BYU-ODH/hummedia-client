'use strict';

angular.module('hummedia.services').
    factory('Clip', ['$resource', 'appConfig', function($resource, config){
        var resource = $resource(config.apiBase + '/clips/:id/', {id: '@_id'},
        {
            'get': {method: 'GET'},
            'get_list': {method: 'GET', isArray: true},
            'post': {method: 'POST'},
            'delete': {method: 'DELETE'}
        });

        return resource;
    }]);
