// https://www.electronjs.org/docs/latest/tutorial/quick-start#create-a-web-page
import { app, BrowserWindow, globalShortcut, ipcMain } from "electron";

import { spawn } from "child_process";
import { Readable } from "stream";

import { createClient } from "@deepgram/sdk";

const deepgram = createClient(DEEPGRAM_API_KEY);

// Create a readable stream
const readable = new Readable({
  read() {},
});

// Spawn ffmpeg process
const ffmpeg = spawn("ffmpeg", [
  "-f",
  "f32le",
  "-i",
  "pipe:0",
  "-f",
  "opus",
  "pipe:1",
]);

// Pipe the readable stream to ffmpeg
readable.pipe(ffmpeg.stdin);

ffmpeg.on("close", (code) => {
  console.log(`ffmpeg exited with code ${code}`);
});

ffmpeg.stderr.on("data", (data) => {
  console.error(`ffmpeg stderr: ${data}`);
});

deepgram.listen.prerecorded
  .transcribeFile(
    ffmpeg.stdout,
    {
      model: "nova",
    }
  )
  .then(({ result, error }) => {
    if (error) {
      console.error(error);
      return;
    }
    console.log(result.results.channels[0].alternatives[0].transcript);
  })
  .catch((err) => {
    console.error(err);
  });


const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile("index.html");
};

export const launch = (record) => (process) => () => {
  app.whenReady().then(() => {
    createWindow();

    globalShortcut.register("Command+;", () => {
      console.log("Command+; is pressed");
      readable.push(null); // Indicates end of data
      process();
    });

    ipcMain.on("audio", (_, data) => {
      readable.push(Buffer.from(data.buffer));
      record(data)();
    });
  });
};

export const foo = (buffer) => () => {
  // console.log(buffer);
};
