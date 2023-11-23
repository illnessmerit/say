let mediaRecorder;
let chunks = [];

const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');

startButton.addEventListener('click', function() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function(stream) {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();

            mediaRecorder.ondataavailable = function(e) {
                chunks.push(e.data);
            }

            stopButton.disabled = false;
            startButton.disabled = true;
        })
        .catch(function(err) {
            console.error('The following error occurred: ' + err);
        });
});

stopButton.addEventListener('click', function() {
    mediaRecorder.stop();

    mediaRecorder.onstop = function(e) {
        console.log(chunks);
    }

    stopButton.disabled = true;
    startButton.disabled = false;
});