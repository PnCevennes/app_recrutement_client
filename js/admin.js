angular.module('recrutement').controller('adminCtrl', ['$http', '$location', 'APP_URL', 'MsgService', 'UserService', function($http, $location, APP_URL, MsgService, UserService){
    var self = this;
    this.current = {applications: []};
    this.agents = [];
    this.applications = [];
    
    if(!UserService.check_user_level(1, 6)){
        $location.url('/annuaire');
    }

    UserService.add_observer(function(){
        if(!UserService.check_user_level(1, 6)){
            $location.url('/annuaire');
        }
    });

    this.clear = function(){
        this.current = {applications: []};
    };


    this.get_data = function(){
        $http.get(APP_URL + '/auth/users').then(function(resp){
            resp.data.forEach(function(item){
                self.agents.push(item);
            });
        });
    };


    this.getApplications = function(){
        $http.get(APP_URL + '/auth/applications').then(function(resp){
            self.applications = resp.data;
        });
    };


    this.add_user_applications = function(id_app){
        var app = self.current.applications.filter(function(item){
            return item.id == id_app;
        });
        return function(value){
            if(!app.length){
                if(arguments.length){
                    self.current.applications.push({id: id_app, niveau: value});
                }
                return null;
            }
            if(!arguments.length){
                return app[0].niveau;
            }
            app[0].niveau = value;
        };
    };


    this.edit = function(id){
        $http.get(APP_URL + '/auth/user/'+id).then(function(resp){
            self.current = resp.data;
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
            self.current = {applications: []};
        });
    };


    this.remove = function(){
        MsgService.confirm('Êtes vous sûr de vouloir supprimer cet utilisateur ?').then(function(){
            $http.delete(APP_URL + '/auth/user/'+self.current.id).then(function(resp){
                var current = self.agents.filter(function(x){return x.id == self.current.id})[0];
                var idx = self.agents.indexOf(current);
                self.agents.splice(idx, 1);
                MsgService.info("L'utilisateur " + self.current.login + ' a été supprimé.');
                self.current = {applications: []};
            });
        });
    };


    this.get_data();
    this.getApplications();
}]);

