"use strict";
HUMMEDIA_DIRECTIVES

/**
 * Enables the browser to lazily load images only when they are scrolled into
 * view. For example:
 *
 * <img scroll-load="large-image.jpeg">
 *
 * Will not start downloading until its element is within the bounds of the window
 */
.directive('scrollLoad', ['$window', function($window){
    return function($scope, elm, attrs) {
        elm.on('load', setSrc);

        $window.addEventListener('scroll', setSrc);

        function setSrc() {
            if( elm.offset()['top'] - $window.scrollY <= $($window).height()) {
                elm.off('load');
                $window.removeEventListener('scroll', setSrc);
                
                var tmp = new Image();
                tmp.src = attrs['scrollLoad'];
                
                //Make sure the image is valid -- otherwise just let the onerror image load
                tmp.onload = function(){
                    
                    elm[0].src = attrs['scrollLoad'];
                    $window.removeEventListener('scroll', setSrc);
                }
                
            }
        };

        $scope.$on('$destroy', function() {
            $window.removeEventListener('scroll', setSrc);
        });

    }
}]);
