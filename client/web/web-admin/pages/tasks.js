(function () {
    let tasksVue, server;
    if (typeof config !== 'object') {
        config = {};
    }

    Server(`ws://${config.server || 'localhost:8082'}`)
        .then(srv => {
            server = srv;
            return server.send({
                channel: 'tasks',
                type   : 'get'
            });
        })
        .then(result => {
            tasksVue = new Vue({
                    el      : '#tasksTable',
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
                if (msg.channel === 'tasks') {
                    switch (msg.type) {
                        case 'add':
                            tasksVue.data.push(msg.data);
                            break;
                        case 'edt':
                            tasksVue.data = tasksVue.data.map((d) => {
                                return d.id === msg.data.id ? msg.data : d;
                            });
                            break;
                        case 'del':
                            // console.log('delete', msg.data);
                            // tasksVue.data.forEach((d, i) => {
                            //     if (d.id !== msg.data.id) {
                            //         console.log('delete', msg.data);
                            //         delete tasksVue.data[i];
                            //     }
                            // });
                            break;
                    }
                }
            });
            return server.send({
                channel: "tasks",
                type   : "sub"
            });

        })
        .catch(err => {
            console.error(err);
        });

})();