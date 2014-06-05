window.HUMMEDIA_SERVICES
    .service('developer', ['appConfig','$http', 'user', function(config, $http, user) {
        var dev = {
            auth: function(username) {
                user.logout().success(function() {
                    $http.get(config.apiBase + "/account/login/authUser", {
                        headers: {
                            Authorization: username
                        },
                        withCredentials: true
                    }).success(function(){
                        user.checkStatus();
                    });
                });
            }
        };
        Object.freeze(dev);
        return dev;
    }]);
