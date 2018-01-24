angular.module('recrutement').controller('interventionCtrl', ['$http', '$location', '$routeParams', 'APP_URL', 'AppGlobals', 'MsgService', 'UserService', function($http, $location, $routeParams, APP_URL, AppGlobals, MsgService, UserService){
    var self = this;
    var params = $location.search();

    this.interventions = [];

    this.user_is_admin = UserService.check_user_level(4, 2);

    this.emptyModel = function(){
        return {fichiers: [], dmdr_contact_email: []};
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

    this.edit = function(id){
        $http.get(APP_URL + '/interventions/' + id).then(function(resp){
            self.current = angular.copy(resp.data);
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
                //self.current.id = resp.data.id;
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

    };

    this.get_data();
}]);
