// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// see also advanced usage of importing ONNX Runtime Web:
// https://github.com/microsoft/onnxruntime-inference-examples/tree/main/js/importing_onnxruntime-web
const ort = require('onnxruntime-web');

async function blobToFloat32Array(blob) {
    return new Promise((resolve, reject) => {
        let fileReader = new FileReader();
        fileReader.onload = event => {
            let arrayBuffer = event.target.result;
            let audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContext.decodeAudioData(arrayBuffer, buffer => {
                let float32Array = buffer.getChannelData(0); // get data for the first channel
                resolve(float32Array);
            }, reject);
        };
        fileReader.onerror = reject;
        fileReader.readAsArrayBuffer(blob);
    });
}

// use an async context to call onnxruntime functions.
async function main(data) {
    try {
        // create a new session and load the specific model.
        //
        const session = await ort.InferenceSession.create('./silero_vad.onnx');

        
        let audioFrame = await blobToFloat32Array(data);
        
        const t = new ort.Tensor("float32", audioFrame, [1, audioFrame.length])
        const zeroes = Array(2 * 64).fill(0)
        const h = new ort.Tensor("float32", zeroes, [2, 1, 64]);
        const c = new ort.Tensor("float32", zeroes, [2, 1, 64]);
        const sr = new ort.Tensor("int64", [16000n])
        // prepare inputs. a tensor need its corresponding TypedArray as data
        // feed inputs and run
        //
        const inputs = {
          input: t,
          h: h,
          c: c,
          sr: sr,
        }
        const results = await session.run(inputs);
        console.log(results);

        // read from results
        // const dataC = results.c.data;
        // document.write(`data of result tensor 'c': ${dataC}`);

    } catch (e) {
        document.write(`failed to inference ONNX model: ${e}.`);
    }
}

navigator.mediaDevices.getUserMedia({ audio: true })
  .then(function(stream) {
    const mediaRecorder = new MediaRecorder(stream);
    let audioChunks = [];

    mediaRecorder.start();

    mediaRecorder.addEventListener("dataavailable", function(event) {
      audioChunks.push(event.data);
      main(event.data);
    });

    mediaRecorder.addEventListener("stop", function() {
      console.log("stop");
      const audioBlob = new Blob(audioChunks);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    });

    setTimeout(() => {
      mediaRecorder.stop();
    }, 1000);
  })
  .catch(function(err) {
    console.error(err);
  });
