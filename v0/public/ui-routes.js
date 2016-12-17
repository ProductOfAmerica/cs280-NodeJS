app.config(['$stateProvider', '$urlRouterProvider',
    function ($stateProvider, $router) {

        //redirect to home if path is not matched
        $router.otherwise("/");

        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: 'Home/home.template.html',
                controller: 'homeController'
            })
            .state('login', {
                url: '/login',
                templateUrl: 'Login/login.template.html',
                controller: 'loginController'
            })
            .state('register', {
                url: '/register',
                templateUrl: 'Register/register.template.html',
                controller: 'registerController'
            })
            .state('cnvOverview', {
                url: '/cnvs',
                templateUrl: 'Conversation/AllCnvs/cnvOverview.template.html',
                controller: 'cnvOverviewController',
                resolve: {
                    cnvs: ['$q', '$http', function ($q, $http) {
                        return $http.get('/Cnvs')
                            .then(function (response) {
                                return response.data;
                            });
                    }]
                }
            })
            .state('myCnvOverview', {
                url: '/mycnvs',
                templateUrl: 'Conversation/MyCnvs/myCnvOverview.template.html',
                controller: 'myCnvOverviewController',
                resolve: {
                    cnvs: ['$q', '$http', function ($q, $http) {
                        var prsId;
                        return $http.get('/Prss')
                            .then(function (res) {
                                prsId = res.data[0].id;
                            })
                            .then(function () {
                                return $http.get('/Cnvs');
                            })
                            .then(function (response) {
                                response.data = response.data.filter(function (response) {
                                    return response.ownerId == prsId;
                                });

                                return response.data;
                            });
                    }]
                }
            })
            .state('msgOverview', {
                url: '/cnvs/:cnvId',
                templateUrl: 'Message/msgOverview.template.html',
                controller: 'msgOverviewController',
                resolve: {
                    msgs: ['$http', '$stateParams', function ($http, $stateParams) {
                        return $http.get('/Cnvs/' + $stateParams.cnvId + '/Msgs')
                            .then(function (res) {
                                return res.data;
                            });
                    }],
                    cnv: ['$http', '$stateParams', function ($http, $stateParams) {
                        return $http.get('/Cnvs') //This is to get the title information of the conversation
                            .then(function (res) {
                                res.data = res.data.filter(function (response) {
                                    return response.id == $stateParams.cnvId;
                                });

                                return res.data;
                            });
                    }]
                }
            });
    }]);
