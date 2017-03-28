(() => {
    sessionStorage.removeItem('xc1w2654das');
    if (typeof config !== 'object') {
        config = {};
    }
    let server;
    document.getElementById("login").addEventListener("click", (event) => {
        console.log('click');
        let usr = document.getElementById('usr').value;
        let pwd = document.getElementById('pwd').value;
        if (!usr || !pwd) {
            BootstrapDialog.alert({
                title  : 'Error',
                message: 'Usuario y Password son datos obligatorios',
                type   : BootstrapDialog.TYPE_WARNING
            });
            return;
        }
        (server ? Promise.resolve(server) : Server(`ws://${config.server || 'localhost:8082'}`))
            .then(srv => {
                server = srv;
                return server.send({
                    channel: 'users',
                    type   : 'login',
                    data   : {
                        usr: usr,
                        pwd: pwd
                    }
                });
            }).then(login => {
                sessionStorage.setItem('xc1w2654das', JSON.stringify(login.data));
                return window.location.href = "proceso.html";
            }).catch(err => {
                BootstrapDialog.alert({
                    title  : 'Error',
                    message: err.message || err.data.error,
                    type   : BootstrapDialog.TYPE_WARNING
                });
            });

    });
})();
