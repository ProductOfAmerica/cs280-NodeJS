app.controller('loginController',
    ['$scope', '$state', 'login', 'notifyDlg',
        function ($scope, $state, login, nDlg) {
            $scope.user = {email: "wef@wef.com", password: "wef"}; //Autologin for testing

            $scope.validateEmail = function validateEmail(email) {
                var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                return re.test(email);
            };

            $scope.login = function () {
                login.login($scope.user)
                    .then(function (user) {
                        $scope.$parent.user = user;
                        $state.go('home');
                    })
                    .catch(function () {
                        nDlg.show($scope, "That name/password is not in our records", "Error");
                    });
            };
        }
    ]);