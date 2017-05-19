angular.module('msglib', ['ngSanitize']);

angular.module('msglib').factory('MsgService', [function(){
    /*
     * Expose les méthodes de la directive msgDsp
     */
    return {};
}]);

angular.module('msglib').directive('msgDsp', ['$timeout', '$q', 'MsgService', '$sce', function($timeout, $q, MsgService, $sce){
    return {
        restrict: 'E',
        controllerAs: 'msgd',
        controller: function(){
            var self = this;
            this.msg_shown = false;
            this.modal_message = '';
            this.modal_title = '';
            this.modal_confirm = false;
            this.messages = [];
            this.deferred = null;

            var addMsg = function(type){
                return function(msg){
                    self.messages.push({type: type, content: $sce.trustAsHtml(msg)});
                    $timeout(function(){
                        self.messages.splice(0, 1);
                    }, 5000);
                }
            };

            MsgService.info = addMsg(0);
            MsgService.error = addMsg(1);
            MsgService.success = addMsg(2);

            this.open_modal = function(txt, title){
                self.modal_message = $sce.trustAsHtml(txt);
                self.modal_title = title;
                self.msg_shown = true;
                self.deferred = $q.defer();
                return self.deferred.promise;
            };

            this.open_confirm = function(txt, title){
                self.modal_confirm = true;
                return self.open_modal(txt, title || 'Confirm');
            }
            MsgService.confirm = this.open_confirm;

            this.open_alert = function(txt, title){
                self.modal_confirm = false;
                return self.open_modal(txt, title || 'Alert');
            }
            MsgService.alert = this.open_alert;

            this.close_modal = function(){
                self.msg_shown = false;
            };

            this.dismiss = function(){
                self.close_modal();
                if(self.modal_confirm){
                    self.deferred.reject();
                }
                else{
                    self.deferred.resolve();
                }
            };

            this.accept = function(){
                self.close_modal();
                self.deferred.resolve();
            };

            this.cancel_close = function(evt){
                evt.stopPropagation();
            };
        },
        template: `
<div class="msg-maincontainer" ng-class="{'msg-maincontainer-hidden': !msgd.messages.length, 'msg-maincontainer-shown': msgd.messages.length}">
    <p ng-repeat="msg in msgd.messages track by $index" ng-class="{'msg-info': msg.type==0, 'msg-error': msg.type==1, 'msg-success': msg.type==2}"><span ng-bind-html="msg.content"></span></p>
</div>
<div class="msg-modalcontainer" ng-class="{'msg-modalcontainer-hidden': !msgd.msg_shown, 'msg-modalcontainer-shown': msgd.msg_shown}" ng-click="msgd.dismiss()">
    <div class="msg-modalcontainer-msgcontainer" ng-if="msgd.msg_shown" ng-click="msgd.cancel_close($event)">
        <div class="panel panel-default">
            <div class="panel-heading">
                <div class="panel-title">{{msgd.modal_title}}<button class="close pull-right" ng-click="msgd.dismiss()">&times</button></div>
            </div>
            <div class="panel-body">
                <p ng-bind-html="msgd.modal_message"></p>
            </div>
            <div class="panel-footer">
                <div class="navbar" style="margin-bottom: -15px; padding: 0; padding-right: 5px;">
                    <div class="navbar-right">
                        <button type="button" class="btn btn-warning" ng-click="msgd.dismiss()" ng-if="msgd.modal_confirm">Cancel</button>
                        <button type="button" class="btn btn-success" ng-click="msgd.accept()">OK</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>`
    }
}]);
