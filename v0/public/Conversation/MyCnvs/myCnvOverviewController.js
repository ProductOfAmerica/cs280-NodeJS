app.controller('myCnvOverviewController',
    ['$scope', '$state', '$http', '$uibModal', 'notifyDlg', 'cnvs',
        function ($scope, $state, $http, $uibM, nDlg, cnvs) {
            $scope.cnvs = cnvs;

            function toTitleCase(str) {
                return str.replace(/\w\S*/g, function (txt) {
                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                });
            }

            $scope.delCnv = function (cnv) {
                nDlg.show($scope, "Are you sure you want to delete this conversation?", "Warning", ["OK", "Cancel"])
                    .then(function (btn) {
                        if (btn == "OK") {
                            return $http.delete("Cnvs/" + cnv.id);
                        }
                    })
                    .then(function () {
                        return $http.get('/Cnvs');
                    })
                    .then(function (rsp) {
                        rsp.data = rsp.data.filter(function (response) {
                            return response.ownerId == $scope.user.id;
                        });

                        $scope.cnvs = rsp.data;
                    })
                    .catch(function (err) {
                        if (err)
                            console.log(err);
                    });
            };

            $scope.editCnv = function (cnv) {
                var selectedTitle;

                $uibM.open({
                    templateUrl: 'Conversation/editCnvDlg.template.html',
                    scope: $scope
                }).result
                    .then(function (updatedTitle) {
                        selectedTitle = toTitleCase(updatedTitle);
                        return $http.put("Cnvs/" + cnv.id, {title: selectedTitle});
                    })
                    .then(function () {
                        return $http.get('/Cnvs');
                    })
                    .then(function (rsp) {
                        rsp.data = rsp.data.filter(function (response) {
                            return response.ownerId == $scope.user.id;
                        });

                        $scope.cnvs = rsp.data;
                    })
                    .catch(function (err) {
                        if (err && err.data[0] && err.data[0].tag == "dupTitle")
                            nDlg.show($scope, "Another conversation already has title " + selectedTitle,
                                "Error");
                    });
            };

            $scope.newCnv = function () {
                $scope.dlgTitle = "New Conversation";
                $scope.labelName = "Conversation Title";
                $scope.placeholder = "Title";
                $scope.title = null;
                var selectedTitle;

                $uibM.open({
                    templateUrl: 'Conversation/editCnvDlg.template.html',
                    scope: $scope
                }).result
                    .then(function (newTitle) {
                        selectedTitle = toTitleCase(newTitle);
                        return $http.post("Cnvs", {title: selectedTitle});
                    })
                    .then(function () {
                        return $http.get('/Cnvs');
                    })
                    .then(function (rsp) {
                        rsp.data = rsp.data.filter(function (response) {
                            return response.ownerId == $scope.user.id;
                        });

                        $scope.cnvs = rsp.data;
                    })
                    .catch(function (err) {
                        // console.log("Error: " + JSON.stringify(err));
                        if (err.data[0].tag == "dupTitle")
                            nDlg.show($scope, "Another conversation already has title " + selectedTitle,
                                "Error");
                    });
            };
        }]);
