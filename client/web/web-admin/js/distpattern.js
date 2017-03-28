var server = {};
(function () {

    server.connect = function (url,callback) {
        console.log(server.connection);
        if(!server.connection){
            url = url || 'ws://distpattern.com/s/';
            Server(url)
                .then(function (srv) {
                    server.connection = srv;
                    server.connection.on('message', function (msg) {
                        return callback(null,msg);

                    });
                })
                .catch(function (err) {
                    //TODO: send information to the interface when the connection not work good
                   return callback(err,"Error en connection")
                });
        }
        callback(null,"ok")

    };

    server.get = function connectWebSocket(channel,type,data,callback) {
        if(server.connection){
            server.connection.send({
                channel: channel,
                type   : type,
                data   : data
            }).then(function (msg) {
                callback(null,msg);
            }).catch(function (err) {
                callback(err,"Error en server.get")
            });
        }
    }

})();