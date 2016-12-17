app.factory("login", ['$rootScope', "$http",
    function ($rootScope, $http) {
        var cookie;
        var user;

        return {
            login: function (loginData) {
                var id;
                return $http.post("Ssns", loginData)
                    .then(function (response) {
                        var location = response.headers().location.split('/');

                        cookie = location[location.length - 1];
                        return $http.get("Ssns/" + cookie);
                    })
                    .then(function (response) {
                        id = response.data.prsId;
                        return $http.get('Prss/' + response.data.prsId);
                    })
                    .then(function (response) {
                        user = response.data[0];
                        user.id = id;
                        return response.data[0];
                    });
            },
            logout: function () {
                return $http.delete("Ssns/" + cookie)
                    .then(function () {
                        delete $rootScope.user;
                        user = null;
                        cookie = null;
                    });
            },
            getUser: function () {
                return user;
            }
        };
    }]);