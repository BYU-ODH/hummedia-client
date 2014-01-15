/**
 * Lets us get user information.
 * 
 * @TODO: Set up a websocket with the API to see when the user logs in or disconnects
 * 
 * Properties:
 *  {Object} data -- contains information about the logged-in user, if they are logged in.
 *  {bool} exists -- whether or not the user is logged in.
 *  {bool} canCreate -- whether or not the user has the ability to create resources
 *  {bool} netIDRequired -- Whether or not the user needs to link their account with a NetID to continue
 *  {bool} isSuperuser
 *  {bool} isTA
 *  
 * Methods:
 *  {void} prompt [BOOL toggle, STRING returnPath] -- opens a modal window prompting the user to log in.
 *                                 if toggle is set to true, this will close the window
 *                                 if already open. returnPath tells the server where to return to after logging in
 *                                 If returnPath is falsy, defaults to current URL
 *
 * {void} closePrompt -- closes the prompt window if it exists
 * {void} signin -- redirects the user to the API's sign-in page
 * {void} googleSignin -- same as signin, but with Google
 * {http promise} logout -- logs out the current user
 * {$q promise} checkStatus -- forces a refresh of the user's data
 */
HUMMEDIA_SERVICES.factory('user', ['$http', 'appConfig', '$location', '$templateCache', '$compile', '$rootScope', '$window', '$q', function($http, config, $location, $templateCache, $compile, $scope, $window, $q) {
     "use strict";
     
     var _exists = false,
         _netIDRequired = false,
         _promptedToLink = false,
         _data = {},
         _httpConfig = {
            withCredentials: true
         },
         api = config.apiBase.replace(/\\:/,':'), // this has to deal with ports differently than resources do
         _returnPath = null, // where the user will go after a login
         user = {};

     Object.defineProperty(user, 'exists', {
         enumerable: true,
         get: function() {
             return _exists;
         }
     });

     Object.defineProperty(user, 'netIDRequired', {
         enumerable: true,
         get: function() {
            return _netIDRequired;
         }
     });
     
     Object.defineProperty(user, 'data', {
         enumerable: true,
         get: function() {
             return _data;
         }
     });
     
     Object.defineProperty(user, 'canCreate', {
          enumerable: true,
          get: function() {
                return user.exists && (user.data.role == "faculty" || user.data.superuser);
          }
     });
     
     Object.defineProperty(user, 'isTA', {
          enumerable: true,
          get: function() {
                return user.exists && !!user.data.ta;
          }
     });
     
     Object.defineProperty(user, 'isSuperuser', {
          enumerable: true,
          get: function() {
                return !!user.data.superuser;
          }
     });

     user.closePrompt = function() {
         $('#graywall').remove();
         $("#login").remove();
         $('html').removeClass('noscroll');
     }
     
     user.prompt = function(toggle, returnPath) {
         _returnPath = returnPath;

         if(user.exists)
             return;
         
         if($("#login").length) {
             if(toggle === true) {
                this.closePrompt();
             }
             return;
         }

         $('html').addClass('noscroll');
         $http.get('/partials/login.html', {cache:$templateCache}).success(function(data){
             $("#view").append($compile(data)($scope));
         });
     };
     
     user.signin = function() {
        var returnTo = _returnPath ? _returnPath : $location.absUrl();
        $window.location = api + "/account/login?r=" + returnTo; 
     };
     
     user.googleSignin = function() {
         $window.location = api + "/account/login/google?r=" + $location.absUrl();
     };
     
     user.logout = function() {
         var promise = $http.get(api + "/account/logout", _httpConfig);
         _exists = false;
         _data = {};
         
         // go to homepage
         $location.path("/");
         $location.search({});
         return promise;
     };

     user.checkStatus = function() {
        var deferred = $q.defer();

        $http.get(api + '/account/profile', _httpConfig)
        .success(function(data) {
             _data = data;
             if(user.data.username !== null) {
                 _exists = true;
             }
             // user logged in through oAuth provider but no associated NetID available
             if(!_promptedToLink && user.data.oauth && user.data.username === null) {
                 _netIDRequired = true;
                 _promptedToLink = true;
                 user.prompt();
             }
             deferred.resolve();
        })
        .error(function() {
              deferred.reject();
        });
        return deferred.promise;
     };
     
     // only the service should be able to update the user's information
     Object.freeze(user);
     
     // kick things off.
     (function(){
        var statusDelay = 30*1000; // how often to poll (if websockets are unavailable) to see user's status
        user.checkStatus(function(){
            setTimeout(user.checkStatus, statusDelay);
        });
     })();
     
     return user;
}]);
