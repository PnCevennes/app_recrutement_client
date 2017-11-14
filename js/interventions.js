angular.module('recrutement').controller('interventionCtrl', ['$http', '$location', '$routeParams', 'APP_URL', 'AppGlobals', 'MsgService', 'UserService', function($http, $location, $routeParams, APP_URL, AppGlobals, MsgService, UserService){
    var self = this;
    var params = $location.search();

    this.interventions = [];

    this.user_is_admin = UserService.check_user_level(4, 2);

    this.emptyModel = function(){
        return {dem_fichiers: [], rea_fichiers: [], dmdr_contact_email: []};
    };
    this.current = this.emptyModel();

    this.get_data = function(){
        self.interventions.splice(0);
        $http.get(APP_URL + '/interventions/').then(function(resp){
            resp.data.forEach(function(item){
                item.dem_date = new Date(item.dem_date);
                self.interventions.push(item);
            });
        });
        if(params.intervention){
            self.edit(params.intervention);
        }
    };

    this.edit_page = function(id){
        $location.search({intervention: id});
    };

    this.check_status = function(item){
        if(item.rea_date !== null) return 2;
        return 1;
    }

    this.edit = function(id){
        $http.get(APP_URL + '/interventions/' + id).then(function(resp){
            self.current = angular.copy(resp.data);
            if(self.current.rea_date !== null){
                self.current.rea_date = new Date(self.current.rea_date)
            }
            if(self.current.dmdr_contact_email === null){
                self.current.dmdr_contact_email = [];
            }
        });
    };

    this.save = function(id){
        if(this.current.id){
            var url = APP_URL + '/interventions/' + this.current.id;
            var update = true;
        }
        else{
            var url = APP_URL + '/interventions/';
            var update = false;
        }
        $http.post(url, self.current).then(
            function(resp){
                MsgService.success('Enregistrement effectué');
                $location.search({intervention: resp.data.id, timeid: Number(new Date())});
            },
            function(error){
                MsgService.error('Erreur de saisie');
            }
        )

    };

    this.clear = function(){
        $location.search({});
    }

    this.remove = function(id){
        MsgService.confirm('Êtes vous sûr de vouloir annuler cette intervention ?').then(function(){
            $http.delete(APP_URL + '/interventions/' + self.current.id).then(
                function(){
                    var current = self.interventions.filter(function(x){return x.id == self.current.id})[0];
                    var idx = self.interventions.indexOf(current);
                    self.interventions.splice(idx, 1);
                    MsgService.success('Suppression effectuée');
                    $location.search({});
                },
                function(error){
                    MsgService.error('Erreur de suppression');
                }
            );
        });
    };

    this.get_data();
}]);
