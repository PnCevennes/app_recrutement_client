angular.module('msglib', []);

angular.module('msglib').factory('MsgService', ['$rootScope', function($rootScope){
    return {
        info: function(txt){
            $rootScope.$broadcast('msg-info', txt);
        },
        error: function(txt){
            $rootScope.$broadcast('msg-error', txt);
        },
        success: function(txt){
            $rootScope.$broadcast('msg-success', txt);
        }
    }
}]);

angular.module('msglib').directive('msgDsp', ['$rootScope', '$timeout', '$q', 'MsgService', function($rootScope, $timeout, $q, MsgService){
    return {
        restrict: 'E',
        controllerAs: 'msgd',
        controller: function(){
            this.msg_shown = false;
            this.modal_message = '';
            this.modal_title = '';
            this.modal_confirm = false;
            this.messages = [];
            this.deferred = null;

            var addMsg = function(type){
                return function(ev, msg){
                    this.messages.push({type: type, content: msg});
                    $timeout(angular.bind(this, function(){
                        this.messages.splice(0, 1);
                    }), 5000);
                }
            };

            this.open_modal = function(txt){
                this.modal_message = txt;
                this.msg_shown = true;
                var dfd = this.deferred = $q.defer();
                return dfd.promise;
            };

            this.open_confirm = function(txt){
                this.modal_confirm = true;
                this.modal_title = 'Confirm';
                return this.open_modal(txt);
            }
            MsgService.confirm = angular.bind(this, this.open_confirm);

            this.open_alert = function(txt){
                this.modal_confirm = false;
                this.modal_title = 'Alerte';
                return this.open_modal(txt);
            }
            MsgService.alert = angular.bind(this, this.open_alert);

            this.close_modal = function(){
                this.msg_shown = false;
            };

            this.dismiss = function(){
                this.close_modal();
                if(this.modal_confirm){
                    this.deferred.reject();
                }
                else{
                    this.deferred.resolve();
                }
            };

            this.accept = function(){
                this.close_modal();
                this.deferred.resolve();
            };

            this.cancel_close = function(evt){
                evt.stopPropagation();
            };


            $rootScope.$on('msg-info', angular.bind(this, addMsg(0)));
            $rootScope.$on('msg-error', angular.bind(this, addMsg(1)));
            $rootScope.$on('msg-success', angular.bind(this, addMsg(2)));
        },
        template: `
<div class="msg-maincontainer" ng-class="{'msg-maincontainer-hidden': !msgd.messages.length, 'msg-maincontainer-shown': msgd.messages.length}">
    <p ng-repeat="msg in msgd.messages track by $index" ng-class="{'msg-info': msg.type==0, 'msg-error': msg.type==1, 'msg-success': msg.type==2}">{{msg.content}}</p>
</div>
<div class="msg-modalcontainer" ng-class="{'msg-modalcontainer-hidden': !msgd.msg_shown, 'msg-modalcontainer-shown': msgd.msg_shown}" ng-click="msgd.dismiss()">
    <div class="msg-modalcontainer-msgcontainer" ng-if="msgd.msg_shown" ng-click="msgd.cancel_close($event)">
        <h1>{{msgd.modal_title}}</h1>
        <p>{{msgd.modal_message}}</p>
        <div class="msg-modalcontainer-buttons">
            <button ng-click="msgd.dismiss()" ng-if="msgd.modal_confirm">Cancel</button>
            <button ng-click="msgd.accept()">OK</button>
        </div>
    </div>
</div>`
    }
}]);
