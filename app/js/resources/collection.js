'use strict';

angular.module('hummedia.services').
    factory('Collection', ['$resource', 'appConfig', function($resource, config){
        var resource = $resource(config.apiBase + '/collection/:identifier', {identifier: '@identifier'},
        {
            get:{
                method: 'GET',
                isArray: false,
                transformResponse: function(response){
                    
                    response = JSON.parse(response);
                    
                    if(response['dc:description']==="<p>None</p>" || response['dc:description']==="None"){
                        response['dc:description']="";
                    }

                    return response;
                }
            },
            query: {
                method: 'GET',
                isArray: true,
                transformResponse: function(response){
                    
                    response = JSON.parse(response).map(function (element){
                        if(element['dc:description']==="<p>None</p>" || element['dc:description']==="None"){
                            element['dc:description']="";
                        }
                        return element;
                    });
                                        
                    return response;
                }
            },
            search: {method: 'GET', isArray: true},
            update: {method: 'PATCH'}
        });        
        return resource;
    }]);
