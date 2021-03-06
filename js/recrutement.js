angular.module('recrutement').controller('recrutementCtrl', ['$http', '$location', '$routeParams', 'APP_URL', 'AppGlobals', 'MsgService', 'UserService', function($http, $location, $routeParams, APP_URL, AppGlobals, MsgService, UserService){
    var self = this;
    var params = $location.search();
    this.agentid = params.agent;
    this.titre = 'Recrutement';
    this.agents = [];
    this.agents_orig = null;
    this.user_is_admin = UserService.check_user_level(3, 2);
    if(!AppGlobals.recrutement_sort_order){
        AppGlobals.recrutement_sort_order = {
            nom: null,
            arrivee: true,
            service_id: null
            };

    }
    this.sort_order = AppGlobals.recrutement_sort_order;

    this.emptyModel = function(){
        /*
         * retourne un modele initialisé vide
         */
        return  {materiel: [], fichiers: [], ctrl_notif: true, notif_list: [], convention_signee: false};
    };

    this.current = this.emptyModel();
    this.arrivee_open = false;
    this.depart_open = false;
    if(params.annee){
        AppGlobals.recrutement_list_annee = parseInt(params.annee);
    }
    this.annee_recr_list = this.annee_recr_aff = AppGlobals.recrutement_list_annee;

    this.setAnnee = function(){
        $location.search({annee: this.annee_recr_list});
    }

    this.get_data = function(){
        self.agents.splice(0);
        $http.get(APP_URL + '/recrutement/?annee='+AppGlobals.recrutement_list_annee).then(function(resp){
            resp.data.forEach(function(item){
                item.arrivee = new Date(item.arrivee);
                if(item.depart != "None"){
                    item.depart = new Date(item.depart);
                }
                self.agents.push(item);
            });
            if(self.agentid){
                self.edit(self.agentid);
            }
            self.sort_agents_init();
        });
    };

    this.sort_agents_init = function(){
        for(k in self.sort_order){
            if(self.sort_order[k]){
                self.sort_order[k] = !self.sort_order[k];
                self.sort_agents_by(k);
            }
        }
    };

    this.sort_agents_by = function(field){
        for(k in self.sort_order){
            if(k != field){
                self.sort_order[k] = null;
            }
        }
        self.sort_order[field] = !self.sort_order[field];
        self.agents.sort(function(a, b){
            return self.sort_order[field] ? b[field]<a[field] : a[field]<b[field];
        });
    }

    this.setGratification = function(data){
        if(!arguments.length){
            return self.current.gratification == 1;
        }
        self.current.gratification = data ? 1 : 0;
    };

    this.check_status = function(agent){
        var today = new Date();
        if(agent.arrivee>today) return 1;
        if(agent.depart=="None") return 2;
        else if(agent.depart>today) return 2;
        return 3;
    }

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
            self.current.notif_list = resp.data.notif_list.split(',').filter(x=>x.length); //transforme en liste et supprime les éléments vides
            self.current.arrivee = new Date(resp.data.arrivee);
            self.current.depart = new Date(resp.data.depart);
            self.current.meta_create = new Date(resp.data.meta_create);
            if(self.current.meta_update){
                self.current.meta_update = new Date(resp.data.meta_update);
            }
            self.current.ctrl_notif = true;
        });
    };

    this.editPage = function(id){
        $location.search({annee: AppGlobals.recrutement_list_annee, agent: id});
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
        this.current.notif_list = this.current.notif_list.join(',');
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
            self.current = self.emptyModel();
        });
    };

    this.clear = function(){
        this.current = this.emptyModel();
        self.agents.map(function(item){
            item.__selected__ = false;
        });
        $location.search({annee: AppGlobals.recrutement_list_annee});
    };

    this.remove = function(){
        MsgService.confirm('Êtes vous sûr de vouloir supprimer cette fiche ?').then(function(){
            $http.delete(APP_URL + '/recrutement/'+self.current.id).then(function(resp){
                var current = self.agents.filter(function(x){return x.id == self.current.id})[0];
                var idx = self.agents.indexOf(current);
                self.agents.splice(idx, 1);
                MsgService.info('Le recrutement de ' + self.current.nom + ' a été annulé.');
                self.current = self.emptyModel(); 
            });
        });
    };
    this.get_data();
}]);

