(function () {
    let workersVue, server;
    if (typeof config !== 'object') {
        config = {};
    }

    Server(`ws://${config.server || 'localhost:8082'}`)
        .then(srv => {
            server = srv;
            return server.send({
                channel: 'workers',
                type   : 'get'
            });
        })
        .then(result => {
            workersVue = new Vue({
                    el      : '#workersTable',
                    data    : {data: result.data},
                    methods: {
                        moreInfo: function (name, info) {
                            BootstrapDialog.show({
                                title: name,
                                message: '<pre style="height: 300px; overflow: auto;">' + JSON.stringify(JSON.parse(info), null, 2) + '</pre>'
                            });
                        }
                    },

                }
            );
            server.on('message', function (msg) {
                if (msg.channel === 'workers') {
                    switch (msg.type) {
                        case 'add':
                            workersVue.data.push(msg.data);
                            break;
                        case 'edt':
                            workersVue.data = workersVue.data.map((d) => {
                                return d.id === msg.data.id ? msg.data : d;
                            });
                            break;
                        case 'del':
                            workersVue.data = workersVue.data.filter((d) => {
                                return d.id !== msg.data.id;
                            });
                            break;
                    }
                }
            });
            return server.send({
                channel: "workers",
                type   : "sub"
            });

        })
        .catch(err => {
            console.error(err);
        });

})();