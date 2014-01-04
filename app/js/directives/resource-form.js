"use strict";
HUMMEDIA_DIRECTIVES
    /* allows for displaying a form for a resource. Will prepopulate with ng-model
     * ATTRIBUTES:
     *       resource-model: specify this to point your input fields to an object in your scope (i.e., resource-model='data')
     *                       defaults to "data"
     *  
     */
    .directive('resourceForm', ['$compile', '$http', function($compile, $http) {
        var tpldir = '/partials/resource-forms/';

        var linkFn = function(scope, iElement, iAttrs, controller) {

            var model = iAttrs['resourceModel'] ? iAttrs['resourceModel'] : 'data';
            scope.__rObj = scope[model];

            scope.$watch(model, function() {scope.__rObj = scope[model]});

            $http.get(tpldir + iAttrs.resourceForm + '.html').success(function(data) {
                iElement.html(data);
                $compile(iElement.contents())(scope);
            });
        }

        return {
            link: linkFn
        };
    }]);
