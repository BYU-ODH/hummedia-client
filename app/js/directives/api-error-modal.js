"use strict";
HUMMEDIA_DIRECTIVES
    // displays an error modal when something bad happens.
    .directive('apiErrorModal', ['$rootScope', '$location', '$templateCache', 'user', function($rootScope, $location, $templateCache, user){
        
        // with the simplicity of these partials it doesn't make sense to create separate files for them
        var partials = {
            400: '{{"Invalid Request. Make sure the address you are trying to reach is correct." | tr}}',
            401: '{{"You don\'t have permission to do that." | tr}}<div ng-hide="user.exists"><a ng-click="login()">{{"Login" | tr}}</a></div>',
            403: '{{"You don\'t have permission to do that." | tr}}<div ng-hide="user.exists"><a ng-click="login()">{{"Login" | tr}}</a></div>',
            404: '{{"The resource you requested could not be found." | tr}}',
            500: '{{"There was an error processing your request." | tr}}'
        };

        for(var i in partials) {
            if(partials.hasOwnProperty(i))
                $templateCache.put(i + '.html', partials[i]);
        }

        return {
            restrict: 'A',
            scope: false,
            template: '<section><div id="error-message"><menu><button ng-click="close()" class="error-exit icon-cancel-circled"> {{"Close" | tr}}</button></menu><h1 class="error-code">{{code}}</h1><p ng-include="page"></p></div></section>',
            transclude: true,
            replace: true,
            compile: function(element, attrs, transclude) {
                var isShowing = false;
                var startURL = null; // set to the URL of whatever page breaks
                
                return function postLink(scope, iElement, iAttrs, controller) {
                    element.hide();
                    
                    scope.close = function() {
                        isShowing = false;
                        $(iAttrs.blur).removeClass('blur');
                        element.hide();
                        $rootScope.apiError = null; // remove the error
                    };
                    
                    scope.user = user;
                    scope.login = function() {
                        user.prompt();
                        scope.close();
                    }

                    // closes the modal window if we go to a different page
                    scope.$watch(function() { return $location.absUrl()}, function(value) {
                        if(value === startURL) {
                            return;
                        }
                        startURL = null; // so if we leave and come back this still works
                        scope.close();
                    });
                    
                    // opens the modal window when a new API error happens
                    scope.$watch(function(){return $rootScope.apiError;}, function(value) {
                        if(value === undefined || value === null || isShowing) {
                            // do nothing
                            return;
                        }
                        scope.code = value;
                        
                        if(partials[value] !== undefined) {
                            scope.page = value + '.html';
                        }
                        else
                        {
                            scope.page = '500.html';
                        }

                        $(iAttrs.blur).addClass('blur');
                        element.show();
                        startURL = $location.absUrl();
                        isShowing = true;
                    });
                };
            }
        };
    }]);
