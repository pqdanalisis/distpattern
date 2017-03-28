(function () {
    var jobsDetails= new Vue({
        el: '#jobsDetails',
        data: {showDetails:false,item:{},algorithms:[],datasets:[]},
        methods: {
            save: function (data) {
                server.send(data.id ?
                    {
                        channel: 'jobs',
                        type   : 'put',
                        data: {id:data.id,record:data}
                    }:
                    {
                        channel: 'jobs',
                        type   : 'post',
                        data:data
                    }).then((res) =>{
                    this.showDetails = false;
                    jobsManager.showTable = true;
                    server.send({
                        channel: 'jobs',
                        type   : 'get'
                    }).then(res =>
                        jobsManager.data    = res.data
                    ).catch(err => {
                        BootstrapDialog.alert({
                            title  : 'Error',
                            message: err.message,
                            type   : BootstrapDialog.TYPE_WARNING
                        });
                    });

                }).catch(err => {
                    BootstrapDialog.alert({
                        title  : 'Error',
                        message: err.message || err.data.error,
                        type   : BootstrapDialog.TYPE_WARNING
                    });
                });

            },
            back: function () {
                "use strict";
                this.showDetails = false;
                jobsManager.showTable = true;
            }
        }
    });

    var jobsManager = new Vue({
        el: '#jobsManager',
        data: {showTable:true,data:[]},
        methods: {
            cancelJob:function (item) {
                BootstrapDialog.show({
                    type   : BootstrapDialog.TYPE_DANGER,
                    title  : 'Borrar',
                    message: '¿Desea cancelar el trabajo "' + item.name + '"?',
                    buttons: [{
                        label   : 'Sí',
                        cssClass: 'btn-danger',
                        action  : function (dialog) {
                            dialog.close();
                            server.send({
                                channel: 'jobs',
                                type   : 'stop',
                                data   : {id: item.id}
                            }).then(result => {
                                return server.send({
                                    channel: 'jobs',
                                    type   : 'get'
                                }).then(result => {
                                    jobsManager.data    = result.data;
                                    jobsManager.showTable = true;
                                    jobsDetails.showDetails = false;
                                })
                            }).catch(err => {
                                BootstrapDialog.alert({
                                    title  : 'Error',
                                    message: err.message || err.data.error,
                                    type   : BootstrapDialog.TYPE_WARNING
                                });
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
            },
            runJob:function (item) {
                server.send({
                    channel: 'jobs',
                    type   : 'start',
                    data:{id:item.id}
                }).then((res) =>{
                    window.location.href = "./tasks.html"
                }).catch(err => {
                    BootstrapDialog.alert({
                        title  : 'Error',
                        message: err.message || err.data.error,
                        type   : BootstrapDialog.TYPE_WARNING
                    });
                });

            },
            edit: function (id) {
                this.showTable = false;
                server.send({
                    channel: 'jobs',
                    type   : 'get',
                    data:{id:id}
                }).then((res) =>{
                    "use strict";
                    delete res.data.progress;
                    jobsDetails.showDetails = true;
                    jobsDetails.item = res.data;
                }).catch(err => {
                    BootstrapDialog.alert({
                        title  : 'Error',
                        message: err.message || err.data.error,
                        type   : BootstrapDialog.TYPE_WARNING
                    });
                });
            },
            newItem: function () {
                "use strict";
                jobsDetails.item = {"name":"","description":"","version":"","inputformat":"json","outputformat":"json","source":""};
                this.showTable = false;
                jobsDetails.showDetails = true;
            },
            deleteItem: function (item) {
                BootstrapDialog.show({
                    type   : BootstrapDialog.TYPE_DANGER,
                    title  : 'Borrar',
                    message: '¿Desea borrar el Trabajo "' + item.name + '"?',
                    buttons: [{
                        label   : 'Sí',
                        cssClass: 'btn-danger',
                        action  : function (dialog) {
                            dialog.close();
                            server.send({
                                channel: 'jobs',
                                type   : 'delete',
                                data   : {id: item.id}
                            }).then(result => {
                                return server.send({
                                    channel: 'jobs',
                                    type   : 'get'
                                }).then(result => {
                                    jobsManager.data    = result.data;
                                    jobsManager.showTable = true;
                                    jobsDetails.showDetails = false;
                                })
                            }).catch(err => {
                                BootstrapDialog.alert({
                                    title  : 'Error',
                                    message: err.message || err.data.error,
                                    type   : BootstrapDialog.TYPE_WARNING
                                });
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
            },
        }
    });

    Server(`ws://${config.server || 'localhost:8082'}`)
        .then(srv => {
            server = srv;
            return server.send({
                channel: 'jobs',
                type   : 'get'
            });
        })
        .then(result => {
            jobsManager.data    = result.data;
            server.send({
                channel: 'algorithms',
                type   : 'get'
            }).then(res =>
                jobsDetails.algorithms = res.data
            ).catch(err => {

                BootstrapDialog.alert({
                    title  : 'Error',
                    message: err.message,
                    type   : BootstrapDialog.TYPE_WARNING
                });
            });
            server.send({
                channel: 'datasets',
                type   : 'get'
            }).then(res =>{
                    jobsDetails.datasets = res.data;
            }).catch(err => {
                BootstrapDialog.alert({
                    title  : 'Error',
                    message: err.message,
                    type   : BootstrapDialog.TYPE_WARNING
                });
            });
        })
        .catch(err => {
            BootstrapDialog.alert({
                title  : 'Error',
                message: err.message,
                type   : BootstrapDialog.TYPE_WARNING
            });
        });


})();