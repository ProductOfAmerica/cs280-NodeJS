app.controller('registerController',
    ['$scope', '$state', '$http', 'notifyDlg', 'login',
        function ($scope, $state, $http, nDlg, login) {
            $scope.confPass = 'wef';
            $scope.user = {role: 0, email: 'wef@wef.com', password: 'wef', firstName: 'wef', lastName: 'wef', termsAccepted:true};

            // $scope.user = {role: 0};
            $scope.errors = [];

            $scope.validateEmail = function validateEmail(email) {
                var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                return re.test(email);
            };

            $scope.registerUser = function () {
                function toTitleCase(str) {
                    return str.replace(/\w\S*/g, function (txt) {
                        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                    });
                }

                var user = $scope.user;
                user.firstName = toTitleCase(user.firstName);
                user.lastName = toTitleCase(user.lastName);
                $http.post("Prss", user)
                    .then(function () {
                        return nDlg.show($scope, "Registration succeeded. Login automatically?",
                            "Login", ["Yes", "No"]);
                    })
                    .then(function (btn) {
                        if (btn == "Yes") {
                            return login.login(user);
                        } else {
                            $state.go('home');
                        }
                    })
                    .then(function (retUser) {
                        $scope.$parent.user = retUser;
                        $state.go('home');
                    })
                    .catch(function (err) {
                        $scope.errors = err.data;
                    });
            };

            $scope.quit = function () {
                $state.go('login');
            };
        }]);
