// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// see also advanced usage of importing ONNX Runtime Web:
// https://github.com/microsoft/onnxruntime-inference-examples/tree/main/js/importing_onnxruntime-web
const ort = require('onnxruntime-web');

navigator.mediaDevices.getUserMedia({ audio: true })
  .then(function(stream) {
    /* use the stream */
  })
  .catch(function(err) {
    /* handle the error */
  });

// use an async context to call onnxruntime functions.
async function main() {
    try {
        // create a new session and load the specific model.
        //
        const session = await ort.InferenceSession.create('./silero_vad.onnx');

        
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

        // read from results
        const dataC = results.c.data;
        document.write(`data of result tensor 'c': ${dataC}`);

    } catch (e) {
        document.write(`failed to inference ONNX model: ${e}.`);
    }
}

main();
