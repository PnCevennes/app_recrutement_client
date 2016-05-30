angular.module('recrutement', ['ui.bootstrap', 'msglib']);

angular.module('recrutement')
    .controller('principal', ['$http', 'MsgService', function($http, MsgService){
    var self = this;
    this.titre = 'Recrutement';
    this.agents = [];
    this.current = {};
    this.arrivee_open = false;
    this.depart_open = false;
    $http.get('/agents/').then(function(resp){
        resp.data.forEach(function(item){
            item.arrivee = new Date(item.arrivee);
            self.agents.push(item);
        });
    });

    this.edit = function(id){
        $http.get('/agents/'+id).then(function(resp){
            self.current = resp.data;
            self.current.arrivee = new Date(resp.data.arrivee);
            self.current.depart = new Date(resp.data.depart);
        });
    };

    this.save = function(){
        if(this.current.id){
            var url = '/agents/'+this.current.id;
            var update = true;
        }
        else{
            var url = '/agents/';
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
            self.current = {};
        });
    };

    this.clear = function(){
        this.current = {};
    };

    this.remove = function(){
        MsgService.confirm('Êtes vous sûr de vouloir supprimer ce recrutement ?').then(function(){
            $http.delete('/agents/'+self.current.id).then(function(resp){
                var current = self.agents.filter(function(x){return x.id == self.current.id})[0];
                var idx = self.agents.indexOf(current);
                self.agents.splice(idx, 1);
                MsgService.info('Le recrutement de ' + self.current.nom + ' a été annulé.');
                self.current = {};
            });
        });
    };
}]);

angular.module('recrutement').directive('thesaurus', ['$http', function($http){
    return {
        restrict: 'E',
        scope: {
            id: '@ref'
        },
        controller: function(){
            var self = this;
            $http.get('/thesaurus/id/'+this.id).then(function(res){
                self.result = res.data.label;
            });
        },
        bindToController: true,
        controllerAs: 'ctrl',
        template: '<span>{{ctrl.result}}',
    }
}]);

angular.module('recrutement').directive('httpSelect', ['$http', function($http){
    return {
        restrict: 'E',
        scope: {ref: '@', ngModel: '='},
        controller: function(){
            var self = this;
            this.choices = [];
            $http.get('/thesaurus/'+this.ref).then(function(res){
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
        return ('00' + x.getDate()).slice(-2) + '/' + ('00'+(x.getMonth()+1)).slice(-2) + '/' + x.getFullYear();
    }
})
