angular.module('recrutement').controller('supervisionCtrl', ['$http', 'APP_URL', function($http, APP_URL){
    var self = this;
    this.data = [];

    $http.get(APP_URL+'/supervision/data').then(
        function(resp){
            self.data = resp.data.map(function(item){
                return {
                    name: item.name,
                    ip: item.ip,
                    down: item.down,
                    delay: item.delay,
                    //scan_time: new Date(item.scan_time).toLocaleFormat('%d/%m/%Y %H:%M:%S'),
                    scan_time: new Date(item.scan_time).toLocaleString(),
                    //last_seen_up: new Date(item.last_seen_up).toLocaleFormat('%d/%m/%Y %H:%M:%S')
                    last_seen_up: new Date(item.last_seen_up).toLocaleString()
                }
            }).sort(function(a, b){return a.delay - b.delay});
            self.down = self.data.filter(item=>{return item.down});
        },
        function(err){
            console.log(err);
        }
    );
}
]);
