(function () {
    let algorithmsVue, algorithmsDetails, server, editor;
    if (typeof config !== 'object') {
        config = {};
    }

    algorithmsVue = new Vue({
        el     : '#algorithmsTable',
        data   : {showTable: false, data: {}},
        methods: {
            edit      : function (id) {
                this.showTable = false;
                if (id) {
                    server.send({
                        channel: 'algorithms',
                        type   : 'get',
                        data   : {
                            id: id
                        }
                    }).then((detail) => {
                        algorithmsDetails.item        = detail.data;
                        algorithmsDetails.showDetails = true;
                    }).catch(err => {
                        BootstrapDialog.alert({
                            title  : 'Error',
                            message: err.message || err.data.error,
                            type   : BootstrapDialog.TYPE_WARNING
                        });
                    });
                } else {
                    algorithmsDetails.item        = {
                        source: 'function algorithm(vector, progress, end) {\n}'
                    };
                    algorithmsDetails.showDetails = true;
                }
            },
            deleteItem: function (item) {
                BootstrapDialog.show({
                    type   : BootstrapDialog.TYPE_DANGER,
                    title  : 'Borrar',
                    message: '¿Desea borrar el algoritmo "' + item.name + '"?',
                    buttons: [{
                        label   : 'Sí',
                        cssClass: 'btn-danger',
                        action  : function (dialog) {
                            algorithmsDetails.showDetails = false;
                            dialog.close();
                            server.send({
                                channel: 'algorithms',
                                type   : 'delete',
                                data   : {id: item.id}
                            }).then(result => {
                                return server.send({
                                    channel: 'algorithms',
                                    type   : 'get'
                                });
                            }).then(result => {
                                algorithmsVue.data      = result.data;
                                algorithmsVue.showTable = true;
                            }).catch(err => {
                                BootstrapDialog.alert({
                                    title  : 'Error',
                                    message: err.message || err.data.error,
                                    type   : BootstrapDialog.TYPE_WARNING
                                });
                                algorithmsDetails.showDetails = true;
                            });

                        }
                    }, {
                        label   : 'No',
                        cssClass: 'btn-primary',
                        action  : function (dialog) {
                            dialog.close();
                        }
                    }]
                });
            }
        }
    });

    algorithmsDetails = new Vue({
        el     : '#algorithmsDetails',
        data   : {showDetails: false, item: {}},
        methods: {
            toList: function () {
                this.showDetails        = false;
                algorithmsVue.showTable = true;
            },
            save  : function (item) {
                algorithmsDetails.showDetails = false;
                algorithmsDetails.item.source = editor.getSession().getValue();
                (item.id ?
                    server.send({
                        channel: 'algorithms',
                        type   : 'put',
                        data   : {
                            id    : item.id,
                            record: item
                        }
                    }) :
                    server.send({
                        channel: 'algorithms',
                        type   : 'post',
                        data   : item
                    })
                ).then((detail) => {
                    return server.send({
                        channel: 'algorithms',
                        type   : 'get'
                    });
                }).then(result => {
                    algorithmsVue.data      = result.data;
                    algorithmsVue.showTable = true;
                }).catch(err => {
                    BootstrapDialog.alert({
                        title  : 'Error',
                        message: err.message || err.data.error,
                        type   : BootstrapDialog.TYPE_WARNING
                    });
                    algorithmsDetails.showDetails = true;
                });
            }
        },
        updated: function () {
            if (document.getElementById('editor')) {
                editor = ace.edit("editor");
                // editor.setTheme("ace/theme/monokai");
                editor.getSession().setMode("ace/mode/javascript");
            }
        }
    });

    Server(`ws://${config.server || 'localhost:8082'}`)
        .then(srv => {
            server = srv;
            return server.send({
                channel: 'algorithms',
                type   : 'get'
            });
        })
        .then(result => {
            algorithmsVue.data      = result.data;
            algorithmsVue.showTable = true;
        })
        .catch(err => {
            BootstrapDialog.alert({
                title  : 'Error',
                message: err.message,
                type   : BootstrapDialog.TYPE_WARNING
            });
        });

})();