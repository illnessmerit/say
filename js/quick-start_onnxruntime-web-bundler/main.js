// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// see also advanced usage of importing ONNX Runtime Web:
// https://github.com/microsoft/onnxruntime-inference-examples/tree/main/js/importing_onnxruntime-web
const ort = require('onnxruntime-web');
const zeroes = Array(2 * 64).fill(0)
let h = new ort.Tensor("float32", zeroes, [2, 1, 64]);
let c = new ort.Tensor("float32", zeroes, [2, 1, 64]);
const sr = new ort.Tensor("int64", [16000n])

// async function blobToFloat32Array(blob) {
//     return new Promise((resolve, reject) => {
//         let fileReader = new FileReader();
//         fileReader.onload = event => {
//             let arrayBuffer = event.target.result;
//             let audioContext = new (window.AudioContext || window.webkitAudioContext)();
//             audioContext.decodeAudioData(arrayBuffer, buffer => {
//                 let float32Array = buffer.getChannelData(0); // get data for the first channel
//                 resolve(float32Array);
//             }, reject);
//         };
//         fileReader.onerror = reject;
//         fileReader.readAsArrayBuffer(blob);
//     });
// }

// use an async context to call onnxruntime functions.
async function main(session, audioFrame) {
    try {
        // create a new session and load the specific model.
        //

        const t = new ort.Tensor("float32", audioFrame, [1, audioFrame.length])
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
        h = results.hn
        c = results.cn
        console.log(results.output.data);

        // read from results
        // const dataC = results.c.data;
        // document.write(`data of result tensor 'c': ${dataC}`);

    } catch (e) {
        console.log(`failed to inference ONNX model: ${e}.`);
    }
}

// navigator.mediaDevices.getUserMedia({ audio: true })
//   .then(function(stream) {
//     const mediaRecorder = new MediaRecorder(stream);
//     let audioChunks = [];

//     mediaRecorder.start();

//     mediaRecorder.addEventListener("dataavailable", function(event) {
//       audioChunks.push(event.data);
//       main(event.data);
//     });

//     mediaRecorder.addEventListener("stop", function() {
//       console.log("stop");
//       const audioBlob = new Blob(audioChunks);
//       const audioUrl = URL.createObjectURL(audioBlob);
//       const audio = new Audio(audioUrl);
//       audio.play();
//     });

//     setTimeout(() => {
//       mediaRecorder.stop();
//     }, 1000);
//   })
//   .catch(function(err) {
//     console.error(err);
//   });

// main.js
let audioContext = new (window.AudioContext || window.webkitAudioContext)();

async function init() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  await audioContext.audioWorklet.addModule("vad-processor.js");
  const vadNode = new AudioWorkletNode(audioContext, "vad-processor");
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(vadNode);
  vadNode.connect(audioContext.destination);
  const session = await ort.InferenceSession.create('./silero_vad.onnx');

 // Listen for messages from the processor
  vadNode.port.onmessage = (event) => {
    console.log("Message from processor:", main(session, new Float32Array(event.data)));
  };
}
document.addEventListener('DOMContentLoaded', (event) => {
  document.querySelector('#startButton').addEventListener('click', function() {
    audioContext.resume().then(() => {
      console.log('Playback resumed successfully');
      init();
    });
  });
});