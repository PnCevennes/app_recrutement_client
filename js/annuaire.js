angular.module('recrutement').controller('annuaireCtrl', ['$http', '$location', '$routeParams', 'APP_URL', 'AppGlobals', 'MsgService', 'UserService', function($http, $location, $routeParams, APP_URL, AppGlobals, MsgService, UserService){
    var self = this;
    this.editing = false;
    this.showing = false;
    self.user_is_admin = UserService.check_user_level(2, 6);

    this.types_shown = {
        entite: true,
        commune: true,
        correspondant: true
    };

    this.searchString = [null];
    this.searchResults = {};
    this.current = null;
    this.searchUrl = APP_URL+'/annuaire/entites/';
    this.url_params = $location.search();
    if(this.url_params.u){
        delete(this.url_params.u);
    }

    UserService.add_observer(function(){
        self.user_is_admin = UserService.check_user_level(2, 6);
    });

    this.close_edit = function(){
        self.editing = false;
        self.showing = true;
    };

    this.cancel_event = function(evt){
        evt.stopPropagation();
    }

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
        var hasErrors = searchParams.filter(function(item){ return item == undefined }).length;
        if(hasErrors){
            MsgService.error('Un des paramêtres de recherche est inconnu. Veuillez modifier vos paramêtres de recherche en sélectionnant une des propositions qui vous sont faites au cours de votre saisie.');
            return;
        }
        if(searchParams){
            $location.search({s: searchParams});
        }
    };

    this._search = function(){
        if(!self.url_params.s){
            if(self.url_params.n){
                delete(self.url_params.n);
                self.edit(null);
            }
            return;
        }
        
        $http.get(APP_URL+'/annuaire/entites', {params: {params: self.url_params.s}}).then(function(resp){
            //self.searchResults = resp.data;
            self.searchResults = {};
            for(_type in self.types_shown){
                if(!self.searchResults[_type]){
                    self.searchResults[_type] = [];
                }
            }
            resp.data.forEach(function(item){
                self.searchResults[item.type_entite].push(item);
            });
            if(self.url_params.e){
                self._show(self.url_params.e);
            }
            if(self.url_params.n){
                delete(self.url_params.n);
                self.edit(null);
            }
            $http.get(APP_URL+'/annuaire/lib_entites', {params: {params: self.url_params.s}}).then(function(resp){
                self.searchString.splice(0);
                resp.data.forEach(function(item){
                    self.searchString.push(item);
                });
            });
        });
    };

    this.mail_all = function(_type, method){
        if(!self.searchResults[_type]){
            return;
        }
        if(!method){
            method = 'clear';
        }
        var mails = [];
        self.searchResults[_type].forEach(function(item){
            if(item.email){
                mails.push(item.label + '<' + item.email + '>');
            }
        });
        if(method=='clear'){
            return mails.join(',');
        }
        return (UserService.user.email || '') + '?bcc=' + mails.join(',');
    };

    this._show = function(elem){
        for(_type in self.types_shown){
            self.current = self.searchResults[_type].filter(function(item){
                return item.id == elem;
            })[0];
            if(self.current != undefined){
                self.showing = true;
                return;
            }
        }
    };

    this.show = function(elem){
        if(self.url_params.e == elem.id){
            self.url_params.u=new Date().getTime();
        }
        self.url_params.e = elem.id;
        $location.search(self.url_params)
    }

    this.create_new = function(){
        delete(self.url_params.e);
        self.url_params.n = 1;
        $location.search(self.url_params);
    };

    this.edit = function(elem){
        if(!elem){
            elem = {type_entite: 'entite', parents: [null], relations: [null]};
        }
        self.current = elem;
        self.model = angular.copy(elem);
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
        $http.post(APP_URL + url, self.model).then(
            function(resp){
                MsgService.success("L'enregistrement a été effectué");
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
                delete(self.url_params.e);
                if(self.current.id == self.url_params.s){
                    delete(self.url_params.s);
                } 
                if(self.url_params.indexOf && self.url_params.indexOf(self.current.id)>-1){
                    self.url_params.splice(self.url_params.indexOf(self.current.id), 1);
                }
                self.url_params.u = new Date().getTime();
                $location.search(self.url_params)
            });
        });
    };

    MsgService.confirm("Tizoutis a déménagé vers <a href=\"http://tizoutis.pnc.int\">http://tizoutis.pnc.int</a> ! <br />Merci de ne plus utiliser ce lien pour saisir vos données et de le réserver au développement de nouvelles fonctionnalités.", "Déplacement de l'application !").then(function(){window.location.href = 'http://tizoutis.pnc.int'});
    this._search();
}]);
