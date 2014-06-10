/**
 * Affix as such: <input type='file' humfile ng-model='modelName'>
 */
window.HUMMEDIA_DIRECTIVES
.directive('humfile', [function() {
    'use strict';
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function($scope, element, attrs, ngModel) {
            if(!ngModel) return;

            element.on('change', function() {
                var files = element[0].files;
                if(files.length === 1) {
                    ngModel.$setViewValue(files[0]);
                }
                else
                {
                    ngModel.$setViewValue(files);
                }
            });
        }
    }
}]); 
