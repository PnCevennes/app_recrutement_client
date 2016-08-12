angular.module('recrutement').controller('annuaireCtrl', ['$http', '$location', '$routeParams', 'APP_URL', 'AppGlobals', 'MsgService', 'UserService', function($http, $location, $routeParams, APP_URL, AppGlobals, MsgService, UserService){
    var self = this;
    this.editing = false;
    this.showing = false;
    self.user_is_admin = UserService.check_user_level(2, 6);

    this.columns = [
        {name: 'label', label: 'Nom'}, 
        {name: 'telephone', label: 'Téléphone'},
        {name: 'email', label: 'Adresse email'}
    ];
    this.searchString = [null];
    this.searchResults = [];
    this.current = null;
    this.searchUrl = APP_URL+'/annuaire/entites/';
    this.url_params = $location.search();

    UserService.add_observer(function(){
        self.user_is_admin = UserService.check_user_level(2, 6);
    });

    this.close_edit = function(){
        self.editing = false;
        self.showing = true;
    };

    this.close_show = function(){
        delete(self.url_params.e);
        $location.search(self.url_params);
    };

    this.search = function(){
        var searchParams = self.searchString.filter(function(x){
                return x != null;
            }).map(function(item){
                return item.id;
            });
        $location.search({s: searchParams});
    };

    this._search = function(){
        if(!self.url_params.s){
            return;
        }
        $http.get(APP_URL+'/annuaire/lib_entites', {params: {params: self.url_params.s}}).then(function(resp){
            self.searchString.splice(0);
            resp.data.forEach(function(item){
                self.searchString.push(item);
            });
        });
        
        $http.get(APP_URL+'/annuaire/entites', {params: {params: self.url_params.s}}).then(function(resp){
            self.searchResults = resp.data;
            if(self.url_params.e){
                self._show(self.url_params.e);
            }
        });
    };

    this._show = function(elem){
        self.current = self.searchResults.filter(function(item){
            return item.id == elem;
        })[0];
        if(self.current != undefined){
            self.showing = true;
        }
    };

    this.show = function(elem){
        var params = self.url_params;
        params.e = elem.id;
        $location.search(params)
    }

    this.edit = function(elem, evt){
        evt.stopPropagation();
        if(!elem){
            self.model = {type_entite: 'entite', parents: [null]};
        }
        else{
            self.current = elem;
            self.model = angular.copy(elem);
        }
        self.editing = true;
        self.showing = false;
    };

    this.save = function(){
        if(self.model.id){
            var url = '/annuaire/entite/'+self.model.id;
        }
        else{
            var url = '/annuaire/entite'
        }
        $http.post(url, self.model).then(
            function(resp){
                MsgService.success("L'enregistrement a été effectué");
                if(!self.model.id){
                    self.searchResults.push(resp.data);
                }
                else{
                    var idx = self.searchResults.indexOf(self.current);
                    self.searchResults[idx] = resp.data;
                }
                self.editing = false;
                self.show(resp.data);
            }, 
            function(err){
                if(err.status == 403){
                    MsgService.alert("Veuillez vous authentifier afin d'enregistrer vos modifications");
                }
                MsgService.error("Une erreur a eu lieu durant l'enregistrement");
            });
    };

    this.clear = function(){
        self.model = angular.copy(current) || {type_entite: 'entite'};
    };

    this.remove = function(){
        MsgService.confirm('Êtes vous sûr de vouloir supprimer cet élément ?').then(function(){
            $http.delete(APP_URL+'/annuaire/entite/'+self.current.id).then(function(resp){
                var idx = self.searchResults.indexOf(self.current);
                self.searchResults.splice(idx, 1);
                self.current = {type_entite: 'entite'},
                self.model = angular.copy(self.current);
            });
        });
    };

    this._search();
}]);
