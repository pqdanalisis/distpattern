(function () {
    let usersVue, usersDetails, server, editor;
    if (typeof config !== 'object') {
        config = {};
    }

    usersVue = new Vue({
        el     : '#usersTable',
        data   : {showTable: false, data: {}},
        methods: {
            edit      : function (id) {
                this.showTable = false;
                if (id) {
                    server.send({
                        channel: 'users',
                        type   : 'get',
                        data   : {
                            id: id
                        }
                    }).then((detail) => {
                        usersDetails.item        = detail.data;
                        usersDetails.showDetails = true;
                    }).catch(err => {
                        BootstrapDialog.alert({
                            title  : 'Error',
                            message: err.message || err.data.error,
                            type   : BootstrapDialog.TYPE_WARNING
                        });
                    });
                } else {
                    usersDetails.item = {};
                    usersDetails.showDetails = true;
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
                            usersDetails.showDetails = false;
                            dialog.close();
                            server.send({
                                channel: 'users',
                                type   : 'delete',
                                data   : {id: item.id}
                            }).then(result => {
                                return server.send({
                                    channel: 'users',
                                    type   : 'get'
                                });
                            }).then(result => {
                                usersVue.data      = result.data;
                                usersVue.showTable = true;
                            }).catch(err => {
                                console.error(err);
                                BootstrapDialog.alert({
                                    title  : 'Error',
                                    message: err.message || err.data.error,
                                    type   : BootstrapDialog.TYPE_WARNING
                                });
                                usersDetails.showDetails = true;
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

    usersDetails = new Vue({
        el     : '#usersDetails',
        data   : {showDetails: false, item: {}},
        methods: {
            toList: function () {
                this.showDetails        = false;
                usersVue.showTable = true;
            },
            save  : function (item) {
                if (item.password1 !== item.password2) {
                    BootstrapDialog.alert({
                        title  : 'Error',
                        message: 'Las password no coinciden',
                        type   : BootstrapDialog.TYPE_WARNING
                    });
                    return;
                }
                usersDetails.showDetails = false;
                item.password = item.password1;
                delete item.password1;
                delete item.password2;
                (item.id ?
                    server.send({
                        channel: 'users',
                        type   : 'put',
                        data   : {
                            id    : item.id,
                            record: item
                        }
                    }) :
                    server.send({
                        channel: 'users',
                        type   : 'post',
                        data   : item
                    })
                ).then((detail) => {
                    return server.send({
                        channel: 'users',
                        type   : 'get'
                    });
                }).then(result => {
                    usersVue.data      = result.data;
                    usersVue.showTable = true;
                }).catch(err => {
                    console.error(err);
                    BootstrapDialog.alert({
                        title  : 'Error',
                        message: err.message || err.data.error,
                        type   : BootstrapDialog.TYPE_WARNING
                    });
                    usersDetails.showDetails = true;
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
                channel: 'users',
                type   : 'get'
            });
        })
        .then(result => {
            usersVue.data      = result.data;
            usersVue.showTable = true;
        })
        .catch(err => {
            console.error(err);
            BootstrapDialog.alert({
                title  : 'Error',
                message: err.message || err.data.error,
                type   : BootstrapDialog.TYPE_WARNING
            });
        });

})();