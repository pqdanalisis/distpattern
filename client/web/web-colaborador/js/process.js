(function () {

    document.getElementById('process').style.display='block';
    var myWorker = new Worker("js/worker.js");

    document.getElementById('cancel').addEventListener('click', function() {
        myWorker.terminate();
        document.getElementById('process').style.display='none';
        document.getElementById('end').style.display='block';
    });
    myWorker.addEventListener("message", function(val) {
        document.getElementById('message').innerHTML = val.data;
        if (val.data === 'Preparing tasks...') {
           document.getElementById('processing').setAttribute('src', './images/processing' + ((0 | Math.random() * 20) + 1) + '.gif');
        } else if (val.data && val.data.substring(0,16) === 'Waiting tasks...') {
            document.getElementById('processing').setAttribute('src', './images/none.png');
        }

    });

})();

