// voice-activity-detection-processor.js
class VoiceActivityDetectionProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    // Your voice activity detection logic goes here.
    // inputs is an array of input audio data.
    // outputs is an array where you can push your output audio data.
    // parameters is an object for parameter data.

    // Post a message to the main thread
    this.port.postMessage(inputs[0][0]);

    return true; // keep the processor alive
  }
}

registerProcessor('vad-processor', VoiceActivityDetectionProcessor);