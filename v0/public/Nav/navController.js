app.controller('navController',
    ['$rootScope', '$scope', '$state', 'login', 'notifyDlg',
        function ($rootScope, $scope, $state, login, nDlg) {
            $rootScope.langChoice = 'English';

            $scope.setLang = function (lang) {
                $rootScope.langChoice = lang;
            };

            $scope.logOut = function () {
                login.logout()
                    .then(function () {
                        $state.go('login');
                        delete login.user;
                    })
                    .catch(function () {
                        nDlg.show($scope, "Something went wrong", "Error");
                    });
            };
        }
    ]);