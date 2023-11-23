let inputBuffer = [];
const targetSampleRate = 16000;
const nativeSampleRate = sampleRate;
const targetFrameSize = 1536;
const resample = (audioFrame) => {
  const outputFrames = [];

  for (const sample of audioFrame) {
    inputBuffer.push(sample);
  }

  while (inputBuffer.length > targetFrameSize) {
    const outputFrame = new Float32Array(targetFrameSize);
    let outputIndex = 0;
    let inputIndex = 0;
    while (outputIndex < targetFrameSize) {
      outputFrame[outputIndex] = inputBuffer[inputIndex];
      inputIndex++;
      outputIndex++;
    }
    inputBuffer = inputBuffer.slice(inputIndex);
    outputFrames.push(outputFrame);
  }
  return outputFrames;
};

// voice-activity-detection-processor.js
class VoiceActivityDetectionProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    // Your voice activity detection logic goes here.
    // inputs is an array of input audio data.
    // outputs is an array where you can push your output audio data.
    // parameters is an object for parameter data.
    //
    const frames = resample(inputs[0][0]);
    for (const frame of frames) {
      this.port.postMessage(frame.buffer, [frame.buffer]);
    }

    // Post a message to the main thread
    // this.port.postMessage(inputs[0][0]);

    return true; // keep the processor alive
  }
}

registerProcessor("vad-processor", VoiceActivityDetectionProcessor);
