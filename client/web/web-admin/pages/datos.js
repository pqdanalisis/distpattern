var folder = "";

(function () {
    let datasetsVue, datafilesVue, datasetsDetails, server;
    if (typeof config !== 'object') {
        config = {};
    }

    datasetsVue = new Vue({
        el     : '#datasetsTable',
        data   : {showTable: false, data: {}},
        methods: {
            files     : function (id) {
                this.showTable         = false;
                datafilesVue.showTable = true;
                datafilesVue.id = id;
                server.send({
                    channel: 'datasets',
                    type   : 'get',
                    data   : {
                        id: id
                    }
                }).then(files => {
                    datafilesVue.data = files.data.datafiles;
                    datafilesVue.folder = files.data.folder;
                    folder = files.data.folder;

                    /******Subida de archivos***********/
                    var dropfiles;
                    dropfiles = document.getElementById("dropfiles");
                    dropfiles.addEventListener("dragenter", stop, false);
                    // dropfiles.addEventListener("dragover", stop, false);
                    dropfiles.addEventListener("drop", drop, false);

                }).catch(err => {
                    BootstrapDialog.alert({
                        title  : 'Error',
                        message: err.message || err.data.error,
                        type   : BootstrapDialog.TYPE_WARNING
                    });
                });
            },
            edit      : function (id) {
                this.showTable = false;
                if (id) {
                    server.send({
                        channel: 'datasets',
                        type   : 'get',
                        data   : {
                            id: id
                        }
                    }).then((detail) => {
                        datasetsDetails.item        = detail.data;
                        datasetsDetails.showDetails = true;
                    }).catch(err => {
                        BootstrapDialog.alert({
                            title  : 'Error',
                            message: err.message || err.data.error,
                            type   : BootstrapDialog.TYPE_WARNING
                        });
                    });
                } else {
                    datasetsDetails.item        = {
                        source: 'function algorithm(vector, progress, end) {\n}'
                    };
                    datasetsDetails.showDetails = true;
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
                            datasetsDetails.showDetails = false;
                            dialog.close();
                            server.send({
                                channel: 'datasets',
                                type   : 'delete',
                                data   : {id: item.id}
                            }).then(result => {
                                return server.send({
                                    channel: 'datasets',
                                    type   : 'get'
                                });
                            }).then(result => {
                                datasetsVue.data      = result.data;
                                datasetsVue.showTable = true;
                            }).catch(err => {
                                BootstrapDialog.alert({
                                    title  : 'Error',
                                    message: err.message || err.data.error,
                                    type   : BootstrapDialog.TYPE_WARNING
                                });
                                datasetsDetails.showDetails = true;
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

    datafilesVue = new Vue({
        el     : '#datafilesTable',
        data   : {showTable: false, id: null, folder: null, data: {}},
        methods: {
            toList    : function () {
                this.showTable        = false;
                datasetsVue.showTable = true;
            },
            deleteFile: function (file) {
                let lastFolder = file.lastIndexOf('/');
                let fileName = file.substring(lastFolder + 1);
                let fileFolder = this.folder;
                BootstrapDialog.show({
                    type   : BootstrapDialog.TYPE_DANGER,
                    title  : 'Borrar',
                    message: '¿Desea borrar el fichero "' + fileName + '"?',
                    buttons: [{
                        label   : 'Sí',
                        cssClass: 'btn-danger',
                        action  : function (dialog) {
                            datasetsDetails.showDetails = false;
                            dialog.close();
                            server.send({
                                channel: "datafiles",
                                type   : "delete",
                                data   : {
                                    folder: fileFolder,
                                    name  : fileName
                                }
                            }).then(result => {
                                datasetsVue.files(datafilesVue.id);
                            }).catch(err => {
                                BootstrapDialog.alert({
                                    title  : 'Error',
                                    message: err.message || err.data.error,
                                    type   : BootstrapDialog.TYPE_WARNING
                                });
                                datasetsDetails.showDetails = true;
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
            download  : function (file) {
                var link = document.createElement("a");
                link.download = file.substring(file.lastIndexOf('/') + 1);
                link.href = file;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                delete link;
            }
        }
    });

    datasetsDetails = new Vue({
        el     : '#datasetsDetails',
        data   : {showDetails: false, item: {}},
        methods: {
            toList: function () {
                this.showDetails      = false;
                datasetsVue.showTable = true;
            },
            save  : function (item) {
                datasetsDetails.showDetails = false;
                (item.id ?
                        server.send({
                            channel: 'datasets',
                            type   : 'put',
                            data   : {
                                id    : item.id,
                                record: item
                            }
                        }) :
                        server.send({
                            channel: 'datasets',
                            type   : 'post',
                            data   : item
                        })
                ).then((detail) => {
                    return server.send({
                        channel: 'datasets',
                        type   : 'get'
                    });
                }).then(result => {
                    datasetsVue.data      = result.data;
                    datasetsVue.showTable = true;
                }).catch(err => {
                    BootstrapDialog.alert({
                        title  : 'Error',
                        message: err.message || err.data.error,
                        type   : BootstrapDialog.TYPE_WARNING
                    });
                    datasetsDetails.showDetails = true;
                });
            }
        }
    });

    Server(`ws://${config.server || 'localhost:8082'}`)
        .then(srv => {
            server = srv;
            return server.send({
                channel: 'datasets',
                type   : 'get'
            });
        })
        .then(result => {
            datasetsVue.data      = result.data;
            datasetsVue.showTable = true;
        })
        .catch(err => {
            console.error(err);
            BootstrapDialog.alert({
                title  : 'Error',
                message: err.message,
                type   : BootstrapDialog.TYPE_WARNING
            });
        });

})();

var srv;
Server(`ws://${config.server || 'localhost:8082'}`).then(function(ws) {
    srv = ws;
}).catch(function(err) {
    console.error(err);
});

function stop(e) {
    e.stopPropagation();
    e.preventDefault();
}

function drop(e) {
    stop(e);
    document.getElementById('inputFiles').files = e.dataTransfer.files;
    handleFiles(e.dataTransfer.files);
}

function handleFiles(files) {
    for (let i = 0; i < files.length; i++) {
        fileRead(files[i], sendToServer);
    }
}

function fileRead(file, cb) {
    var reader = new FileReader();
    reader.onload = function(e) {
        cb(file.name, e.target.result);
    };
    reader.readAsText(file);
}

function sendToServer(fileName, fileContent) {
    var div = document.createElement('div');
    div.innerHTML = fileName + ' (' + formatBytes(fileContent.length, 0) + ') - <span class="progress">0</span>% ';
    var progress = div.getElementsByTagName('span')[0];
    document.getElementById('progress').appendChild(div);
    srv.sendFile({
        channel: "datafiles",
        type: "post",
        folder : folder,
        name   : fileName
    }, fileContent, function(pro) {
        console.log(pro);
        progress.innerHTML = pro;
    })
}

function formatBytes(bytes) {
    if(bytes == 0) return '0 Bytes';
    var k = 1024,
        sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}