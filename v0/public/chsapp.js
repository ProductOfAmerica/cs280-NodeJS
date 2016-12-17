var app = angular.module('mainApp', [
    'ui.router',
    'ui.bootstrap',
    'ngAnimate'
]);

app.constant("errMapSpan", {
    missingField: '[Sp] Field missing from request: ',
    badValue: '[Sp] Field has bad value: ',
    notFound: '[Sp] Entity not present in DB',
    badLogin: '[Sp] Email/password combination invalid',
    dupEmail: '[Sp] Email duplicates an existing email',
    noTerms: '[Sp] Acceptance of terms is required',
    forbiddenRole: '[Sp] Role specified is not permitted.',
    noOldPwd: '[Sp] Change of password requires an old password',
    oldPwdMismatch: '[Sp] Old password that was provided is incorrect.',
    dupTitle: '[Sp] Conversation title duplicates an existing one',
    dupEnrollment: '[Sp] Duplicate enrollment',
    forbiddenField: '[Sp] Field in body not allowed.',
    queryFailed: '[Sp] Query failed (server problem).'
});

app.constant("errMap", {
    missingField: 'Field missing from request: ',
    badValue: 'Field has bad value: ',
    notFound: 'Entity not present in DB',
    badLogin: 'Email/password combination invalid',
    dupEmail: 'Email duplicates an existing email',
    noTerms: 'Acceptance of terms is required',
    forbiddenRole: 'Role specified is not permitted.',
    noOldPwd: 'Change of password requires an old password',
    oldPwdMismatch: 'Old password that was provided is incorrect.',
    dupTitle: 'Conversation title duplicates an existing one',
    dupEnrollment: 'Duplicate enrollment',
    forbiddenField: 'Field in body not allowed.',
    queryFailed: 'Query failed (server problem).'
});

app.filter('tagError', ['errMap', 'errMapSpan', function (errMap, errMapSpan) {
    return function (err, lang) {
        var map = lang.substring(0, 2) == 'Sp' ? errMapSpan : errMap;
        return map[err.tag] + (err.params && err.params.length ? err.params[0] : "");
    };
}]);

app.directive('cnvSummary', [function () { //<cnv-summary to-summarize="cnv"></cnv-summary>
    return {
        restrict: 'E',
        scope: {
            delCnv: "&",
            editCnv: "&",
            cnv: "=toSummarize",
            user: "=user"
        },
        template: '<a id="big" ui-sref="msgOverview({cnvId:{{cnv.id}}})">{{cnv.title}}</a>' +
        '<button type="button" class="btn btn-default pull-right editDeleteBtn" ' +
        'ng-show="user && user.id == cnv.ownerId" ng-click="delCnv({cnv})">' +
        '<span class="glyphicon glyphicon-trash"></span>' +
        '</button>' +
        '<button type="button" class="btn btn-default pull-right editDeleteBtn" ng-show="user && user.id == cnv.ownerId" ' +
        'ng-click="editCnv({cnv})"><span class="glyphicon glyphicon-edit"></span>' +
        '</button>' +
        '<div>Last Message: {{cnv.lastMessage | date : "short"}}</div>'
    };
}]);

app.directive('langChoice', [function () { //<lang-choice></lang-choice>
    return {
        restrict: 'E',
        template: '<div class="btn-group" style="margin-left: 10px;" uib-dropdown uib-keyboard-nav>' +
        '<button id="simple-btn-keyboard-nav" type="button" class="btn btn-primary" uib-dropdown-toggle>' +
        'Language: {{langChoice}} <span class="caret"></span>' +
        '</button>' +
        '<ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="simple-btn-keyboard-nav">' +
        '<li role="menuitem"><a ng-click="setLang(\'English\')">English</a></li>' +
        '<li class="divider"></li>' +
        '<li role="menuitem"><a ng-click="setLang(\'Spanish\')">Spanish</a></li>' +
        '</ul>' +
        '</div>'
    };
}]);

app.filter('reverse', function () {
    return function (items) {
        return items.slice().reverse();
    };
});