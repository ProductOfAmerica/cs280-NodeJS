app.controller('msgOverviewController',
    ['$scope', '$state', '$http', '$uibModal', 'notifyDlg', 'msgs', 'cnv',
        function ($scope, $state, $http, $uibM, nDlg, msgs, cnv) {
            $scope.msgs = msgs;
            $scope.cnv = cnv[0];
            $scope.isOpen = true;

            $scope.newMsg = function () {
                $scope.dlgTitle = "New Message";
                $scope.labelName = "Message Body";
                $scope.placeholder = "Body";
                $scope.isBody = true;
                $scope.title = null;
                var selectedTitle;

                $uibM.open({
                    templateUrl: 'Conversation/editCnvDlg.template.html',
                    scope: $scope
                }).result
                    .then(function (newTitle) {
                        selectedTitle = newTitle;
                        return $http.post("Cnvs/" + cnv[0].id + "/Msgs", {content: selectedTitle});
                    })
                    .then(function () {
                        return $http.get('/Cnvs/' + cnv[0].id + '/Msgs')
                    })
                    .then(function (rsp) {
                        $scope.msgs = rsp.data;
                    })
                    .catch(function (err) {
                        // console.log("Error: " + JSON.stringify(err));
                        if (err.data[0].tag == "dupTitle")
                            nDlg.show($scope, "Another conversation already has title " + selectedTitle,
                                "Error");
                    });
            };
        }]);