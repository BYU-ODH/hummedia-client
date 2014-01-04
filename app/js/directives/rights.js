"use strict";

HUMMEDIA_DIRECTIVES
    // Enables the addition and revocation of readers and writers if an
    // ng-model is specified that contains a "read" array and a "write" array
    // e.g.,
    //
    // IN THE CONTROLLER:
    //  scope.mymodel = {read: [], write: []}
    //
    // IN THE PARTIAL:
    //  <div rights ng-model="mymodel"></div>
    .directive('rights', [function() {
        return {
            restrict: 'A',
            templateUrl: '/partials/rights.html',
            replace: true,
            require: '^ngModel',
            scope: {
                ngModel: '='
            },
            link: function(scope, iElement, iAttrs, controller) {

                scope.revoke = function(permission, netID) {
                    var arr = scope.ngModel[permission],
                        idx = arr.indexOf(netID);

                    if(idx === -1) {
                        return;
                    }

                    arr.splice(idx, 1);
                };
                
                scope.grant = function(permission, netID) {
                    if(!netID) {
                        return;
                    }
                    var arr = scope.ngModel[permission];
                    
                    if(arr.indexOf(netID) !== -1) {
                        return;
                    }
                    arr.push(netID);

                    if(permission == 'write') {
                        scope.grant('read', netID);
                    }
                };
            }
        }
    }]);
