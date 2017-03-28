(function (root) {
    "use strict";

    if (typeof fetch === 'undefined') {
        var fetch = require('node-fetch');
    }
    function returnFunction(code) {
        return new Promise((resolve, reject) => {
            try {
                resolve(eval('(() => { return ' + code + '})()'));
            } catch (err) {
                reject(err);
            }
        });
    }

    function runtask(server, task, progress) {

        return new Promise((resolve, reject) => {

            console.log('TASK', task);

            let inputfile;
            // Get file
            fetch(task.inputfile)
                .then(response => {
                    return response.json();
                })
                .then(file => {
                    inputfile = file;
                    return returnFunction(task.algorithm);
                })
                .then(algorithm => {
                    progress(0);
                    try {
                        algorithm(
                            inputfile,
                            percent => {
                                progress(task.name + ' - processed: ' + (Math.round(percent * 100) / 100) + '%')
                            },
                            result => {
                                let fileContent = JSON.stringify(result);
                                server.sendFile(
                                    {
                                        channel: "datafiles",
                                        type   : "post",
                                        folder : task.resultfile.split('/')[0],
                                        name   : task.resultfile.split('/')[1],
                                    },
                                    fileContent,
                                    percent => {
                                        progress(task.name + ' - uploading: ' + (Math.round(percent * 100) / 100) + '%');
                                    }
                                )
                                    .then(() => {
                                        resolve(task.id);
                                    });
                            }
                        );
                    } catch (err) {
                        reject(err);
                    }
                })
                .catch(err => {
                    console.error(err);
                });
        });

    }

    // Export for node and browser
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            module.exports = runtask;
        }
        exports.runtask = runtask;
    } else {
        root.runtask = runtask;
    }

})(this);