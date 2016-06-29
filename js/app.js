angular.module('recrutement', ['ui.bootstrap', 'ngRoute', 'msglib']);


angular.module('recrutement').config(['$routeProvider', function($routeProvider){
    $routeProvider
        .when('/',{controller: 'principal', templateUrl: 'js/templates/principal.htm'})
        .when('/agent/:id', {controller: 'principal', templateUrl: 'js/templates/principal.htm'})
        .otherwise({redirectTo: '/'});
}]);


angular.module('recrutement').constant('APP_URL', '');
//angular.module('recrutement').constant('APP_URL', '/recrutement_srv');


angular.module('recrutement').directive('userForm', ['$http', 'APP_URL', 'MsgService', function($http, APP_URL, MsgService){
    return {
        restrict: 'A',
        scope: true,
        controllerAs: 'ctrl',
        templateUrl: 'js/templates/utilisateur_form.htm',
        controller: function(){
            var self = this;
            this.current = {applications: [{id:1, niveau: 2}]};
            this.agents = [];

            this.clear = function(){
                this.current = {applications: [{id:1, niveau: 2}]};
            };

            this.get_data = function(){
                $http.get(APP_URL + '/auth/users').then(function(resp){
                    resp.data.forEach(function(item){
                        self.agents.push(item);
                    });
                });
            };

            this.check_status = function(agent){
                try{
                    var x = agent.applications.filter(function(item){return item.id == 1})[0];
                    return x.niveau == 6 ? 1 : 2;
                }
                catch(e){
                    return 3;
                }
            };

            this.setAdmin = function(value){
                if(!arguments.length){ return self.current.admin; }
                self.current.admin = value;
                try{
                    var x = self.current.applications.filter(function(item){return item.id == 1})[0];
                    x.niveau = value ? 6 : 2;
                }
                catch(e){
                    self.current.applications.push({id: 1, niveau: value ? 6 : 2});
                }
            };

            this.edit = function(id){
                $http.get(APP_URL + '/auth/user/'+id).then(function(resp){
                    self.current = resp.data;
                    self.current.admin = (self.check_status(self.current) == 1)
                });
            };

            this.save = function(){
                if(this.current.id){
                    var url = APP_URL + '/auth/user/'+this.current.id;
                    var update = true;
                }
                else{
                    var url = APP_URL + '/auth/user';
                    var update = false;
                }
                $http.post(url, this.current).then(function(resp){
                    if(update){
                        var current = self.agents.filter(function(x){return x.id == self.current.id})[0];
                        var idx = self.agents.indexOf(current);
                        var result = angular.copy(self.current);
                        self.agents[idx] = result;
                    }
                    else{
                        self.current.id = resp.data.id;
                        self.agents.push(angular.copy(self.current));
                    }
                    self.agents.sort(function(a, b){
                        var x = a.arrivee;
                        var y = b.arrivee;
                        return x>y;
                    });
                    MsgService.success("L'utilisateur " + self.current.login + " a été enregistré.");
                    self.current = {};
                });
            };

            this.remove = function(){
                MsgService.confirm('Êtes vous sûr de vouloir supprimer cet agent ?').then(function(){
                    $http.delete(APP_URL + '/auth/user/'+self.current.id).then(function(resp){
                        var current = self.agents.filter(function(x){return x.id == self.current.id})[0];
                        var idx = self.agents.indexOf(current);
                        self.agents.splice(idx, 1);
                        MsgService.info("L'agent " + self.current.login + ' a été supprimé.');
                        self.current = {applications: [{id: 1, niveau: 2}]};
                    });
                });
            }
            this.get_data();
        }
    }
}]);


angular.module('recrutement').directive('recrutementForm', ['$http', '$location', '$routeParams', 'APP_URL', 'MsgService', function($http, $location, $routeParams, APP_URL, MsgService){
    return {
        restrict: 'A',
        scope: true,
        bindToController: true,
        controllerAs: 'ctrl',
        templateUrl: 'js/templates/recrutement_form.htm',
        controller: function(){
            var self = this;
            this.agentid = $routeParams.id;
            this.titre = 'Recrutement';
            this.agents = [];
            this.current = {materiel: []};
            this.arrivee_open = false;
            this.depart_open = false;
            this.show_old = false;


            this.get_data = function(){
                $http.get(APP_URL + '/recrutement/').then(function(resp){
                    resp.data.forEach(function(item){
                        item.arrivee = new Date(item.arrivee);
                        if(self.agentid){
                            self.edit(self.agentid);
                        }
                        self.agents.push(item);
                    });
                });
            };

            this.setGratification = function(data){
                if(!arguments.length){
                    return self.current.gratification == 1;
                }
                self.current.gratification = data ? 1 : 0;
            };

            this.check_status = function(agent){
                var today = new Date();
                if(agent.arrivee>today) return 1;
                else if(agent.depart>today) return 2;
                return 3;
            }

            this.get_old_recrs = function(){
                self.agents = [];
                self.show_old = !self.show_old;
                $http.get(APP_URL + '/recrutement/?old='+self.show_old).then(function(resp){
                    resp.data.forEach(function(item){
                        item.arrivee = new Date(item.arrivee);
                        item.depart = new Date(item.depart);
                        self.agents.push(item);
                    });
                });
            };

            this.edit = function(id){
                $http.get(APP_URL + '/recrutement/'+id).then(function(resp){
                    self.current = resp.data;
                    self.agents.map(function(item){
                        if(item.id == id){
                            item.__selected__ = true;
                        }
                        else{
                            item.__selected__ = false;
                        }
                    });
                    self.current.arrivee = new Date(resp.data.arrivee);
                    self.current.depart = new Date(resp.data.depart);
                    self.current.meta_create = new Date(resp.data.meta_create);
                    if(self.current.meta_update){
                        self.current.meta_update = new Date(resp.data.meta_update);
                    }
                });
            };

            this.editPage = function(id){
                $location.url('agent/'+id);
            };

            this.save = function(){
                if(this.current.id){
                    var url = APP_URL + '/recrutement/'+this.current.id;
                    var update = true;
                }
                else{
                    var url = APP_URL + '/recrutement/';
                    var update = false;
                }
                $http.post(url, this.current).then(function(resp){
                    if(update){
                        var current = self.agents.filter(function(x){return x.id == self.current.id})[0];
                        var idx = self.agents.indexOf(current);
                        var result = angular.copy(self.current);
                        self.agents[idx] = result;
                    }
                    else{
                        self.current.id = resp.data.id_agent;
                        self.agents.push(angular.copy(self.current));
                    }
                    self.agents.sort(function(a, b){
                        var x = a.arrivee;
                        var y = b.arrivee;
                        return x>y;
                    });
                    MsgService.success("Le recrutement " + self.current.nom + " a été enregistré.");
                    self.current = {materiel: []};
                });
            };

            this.clear = function(){
                this.current = {materiel: []};
                self.agents.map(function(item){
                    item.__selected__ = false;
                });
            };

            this.remove = function(){
                MsgService.confirm('Êtes vous sûr de vouloir supprimer cette fiche ?').then(function(){
                    $http.delete(APP_URL + '/recrutement/'+self.current.id).then(function(resp){
                        var current = self.agents.filter(function(x){return x.id == self.current.id})[0];
                        var idx = self.agents.indexOf(current);
                        self.agents.splice(idx, 1);
                        MsgService.info('Le recrutement de ' + self.current.nom + ' a été annulé.');
                        self.current = {materiel: []};
                    });
                });
            };
            this.get_data();
        }
    }
}]);

angular.module('recrutement')
    .controller('principal', ['$http', 'APP_URL', 'MsgService', function($http, APP_URL, MsgService){
            var self = this;
            this.user = {}
            this.user_is_logged = false;
            this.user_is_admin = false;
            this.login_form_shown = false;

            this.toggle_login_form = function(){
                self.login_form_shown = !self.login_form_shown;
            }

            $http.get(APP_URL + '/auth/reconnect').then(function(resp){
                self.user = resp.data.user;
                self.user.applications.forEach(function(item){
                    if(item.id == 1 && item.niveau == 6){
                            self.user_is_admin = true;
                    }    
                });
                self.user_is_logged = true;
            });

            this.login = function(){
                $http.post(APP_URL + '/auth/login', this.user).then(
                    function(resp){
                        self.user = resp.data.user;
                        self.user.applications.forEach(function(item){
                            if(item.id == 1 && item.niveau == 6){
                                    self.user_is_admin = true;
                            }    
                        });
                        self.user_is_logged = true;
                        self.login_form_shown = false;
                        MsgService.success('Bienvenue ' + self.user.login + ' !');
                    });
            };

            this.logout = function(){
                $http.get(APP_URL + '/auth/logout').then(
                    function(resp){
                        MsgService.success('Au revoir ' + self.user.login + ' !');
                        self.user = {};
                        self.user_is_logged = false;
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

angular.module('recrutement').filter('datefr', function(){
    return function(x){
        if(!x) return '';
        return ('00' + x.getDate()).slice(-2) + '/' + ('00'+(x.getMonth()+1)).slice(-2) + '/' + x.getFullYear();
    }
})
