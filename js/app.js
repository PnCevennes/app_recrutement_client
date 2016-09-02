angular.module('recrutement', ['ui.bootstrap', 'ngRoute', 'msglib']);


angular.module('recrutement').config(['$routeProvider', function($routeProvider){
    $routeProvider
        .when('/admin',{
            controller: 'adminCtrl', 
            controllerAs: 'ctrl',
            templateUrl: 'js/templates/utilisateur/main.htm'})
        .when('/recrutement', {
            controller: 'recrutementCtrl', 
            controllerAs: 'ctrl',
            templateUrl: 'js/templates/recrutement/main.htm'})
        .when('/annuaire', {
            controller: 'annuaireCtrl',
            controllerAs: 'ctrl',
            templateUrl: 'js/templates/annuaire/main.htm'})
        .otherwise({redirectTo: '/annuaire'});
}]);


angular.module('recrutement').constant('APP_URL', '');
//angular.module('recrutement').constant('APP_URL', '/recrutement_srv');


angular.module('recrutement').factory('AppGlobals', [function(){
    return {
        recrutement_list_annee: new Date().getFullYear(),
    };
}]);

angular.module('recrutement').service('UserService', [function(){
    var self = this;
    this.observers = [];
    this.user = {};

    this.set_user = function(user){
        self.user = user;
        self.notify();
        return user;
    }

    this.add_observer = function(fn){
        if(self.observers.indexOf(fn) == -1){
            self.observers.push(fn);
        }
    };

    this.notify = function(){
        self.observers.forEach(function(obs){
            obs();
        });
    };

    this.check_user_level = function(id_app, value){
        try{
            app = self.user.applications.filter(function(item){
                return item.id == id_app && item.niveau >= value;
            })[0];
            return app != undefined;
        }
        catch(e){
            return false;
        }
    }
}]);




angular.module('recrutement')
    .controller('principal', ['$http', 'APP_URL', 'MsgService', 'UserService', function($http, APP_URL, MsgService, UserService){
            var self = this;
            this.user = {};
            this.user_is_logged = false;
            this.user_is_admin = false;
            this.login_form_shown = false;

            this.toggle_login_form = function(){
                self.login_form_shown = !self.login_form_shown;
            }

            UserService.add_observer(function(){
                self.user_is_admin = UserService.check_user_level(1, 6);
            });

            $http.get(APP_URL + '/auth/reconnect').then(function(resp){
                self.user = UserService.set_user(resp.data.user);
                self.user_is_logged = true;
            });

            this.login = function(){
                $http.post(APP_URL + '/auth/login', this.user).then(
                    function(resp){
                        self.user = UserService.set_user(resp.data.user);
                        self.user_is_logged = true;
                        self.login_form_shown = false;
                        MsgService.success('Bienvenue ' + self.user.login + ' !');
                    });
            };

            this.logout = function(){
                $http.get(APP_URL + '/auth/logout').then(
                    function(resp){
                        MsgService.success('Au revoir ' + self.user.login + ' !');
                        self.user = UserService.set_user({});
                        self.user_is_logged = false;
                        self.user_is_admin = false;
                    });
            };
    }]);

angular.module('recrutement').directive('thesaurus', ['$http', 'APP_URL', function($http, APP_URL){
    return {
        restrict: 'E',
        scope: {
            id: '@ref'
        },
        controller: function(){
            var self = this;
            $http.get(APP_URL + '/thesaurus/id/'+this.id).then(function(res){
                self.result = res.data.label;
            });
        },
        bindToController: true,
        controllerAs: 'ctrl',
        template: '<span>{{ctrl.result}}</span>',
    }
}]);

angular.module('recrutement').directive('thesaurusSelect', ['$http', 'APP_URL', function($http, APP_URL){
    return {
        restrict: 'E',
        scope: {ref: '@', ngModel: '='},
        controller: function(){
            var self = this;
            this.choices = [];

            this.addrm = function(item_id){
                var idx = self.ngModel.indexOf(item_id);
                if(idx>-1){
                    self.ngModel.splice(idx,1);
                }
                else{
                    self.ngModel.push(item_id);
                }
            }

            this.is_checked = function(id){
                return self.ngModel.indexOf(id)>-1;
            }
            $http.get(APP_URL + '/thesaurus/ref/'+this.ref).then(function(resp){
                resp.data.forEach(function(item){
                    self.choices.push(item)
                });
            });
        },
        template: `<ul class="list-unstyled">
        <li ng-repeat="item in ctrl.choices track by $index">
            <input type="checkbox" ng-click="ctrl.addrm(item.id)" ng-checked="ctrl.is_checked(item.id)"/> {{item.label}} 
        </li>
    </ul>
    `,
        controllerAs: 'ctrl',
        bindToController: true
    }
}]);

angular.module('recrutement').directive('httpSelect', ['$http', 'APP_URL', function($http, APP_URL){
    return {
        restrict: 'E',
        scope: {ref: '@', ngModel: '='},
        controller: function(){
            var self = this;
            this.choices = [];
            $http.get(APP_URL + '/thesaurus/'+this.ref).then(function(res){
                self.choices = res.data;
            });
        },
        bindToController: true,
        controllerAs: 'htsel',
        template: '<select id="{{htsel.ref}}" class="form-control" ng-options="elem.id as elem.label for elem in htsel.choices" ng-model="htsel.ngModel"></select>'
    }
}]);


angular.module('recrutement').directive('httpSearch', ['$http', function($http){
    return {
        restrict: 'E',
        scope: {url: '@', ngModel: '='},
        controller: function(){
            var self = this;
            this.searchString = this.ngModel;
            if(!this.searchString.length){
                this.searchString.push(null);
            }
            this.getSearch = function(searchStr){
                return $http.get(this.url+searchStr).then(function(resp){
                    return resp.data;
                });
            };

            this.addSearchItem = function(){
                self.searchString.push(null);
            };

            this.removeSearchItem = function(idx){
                self.searchString.splice(idx, 1);
            };

        },
        bindToController: true,
        controllerAs: 'htsearch',
        template: `
    <div class="input-group" ng-repeat="st in htsearch.searchString track by $index">
        <span class="input-group-addon"><span class="glyphicon glyphicon-search"></span></span>
        <input type="text" ng-model="htsearch.searchString[$index]" uib-typeahead="elem as elem.label for elem in htsearch.getSearch($viewValue)" typeahead-loading="htsearch.loadingSearch" typeahead-no-results="htsearch.noResults" class="form-control">
        <div class="input-group-addon" ng-show="htsearch.loadingSearch"><span class="glyphicon glyphicon-refresh"></span></div>
        <span class="input-group-btn" ng-if="htsearch.searchString.length>1">
            <button type="button" class="btn btn-default" ng-click="htsearch.removeSearchItem($index)"><span class="glyphicon glyphicon-minus"></span></button>
        </span>
        <span class="input-group-btn" ng-if="$last">
            <button type="button" class="btn btn-default" ng-click="htsearch.addSearchItem()"><span class="glyphicon glyphicon-plus"></span></button>
        </span>
    </div>
    `
    };
}]);

angular.module('recrutement').filter('datefr', function(){
    return function(x){
        if(!x) return '';
        return ('00' + x.getDate()).slice(-2) + '/' + ('00'+(x.getMonth()+1)).slice(-2) + '/' + x.getFullYear();
    }
});

angular.module('recrutement').filter('nl2br', ['$sce', function($sce){
    return function nl2br(x){
        if(!x) return;
        return $sce.trustAsHtml(x.replace(/\n/g, '<br />'));
    };
}]);
