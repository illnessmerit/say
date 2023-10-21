(ns clj.core
  (:gen-class)
  (:require [cheshire.core :refer [parse-string]]
            [clj-http.client :as client]
            [clojure.java.io :as io]
            [libpython-clj2.python :as py]
            [libpython-clj2.require :refer [require-python]]))

(py/initialize! :python-executable "../.venv/bin/python")

(require-python '[builtins :as python])
(require-python '[numpy :as np])
(require-python 'pyaudio)
(require-python '[subprocess :as sp])
(require-python 'torch)

; https://github.com/snakers4/silero-vad/blob/cb92cdd1e33cc1eb9c4ae3626bf3cd60fc660976/utils_vad.py#L207
(def chunk-size 1536)

; 16 bits per sample
(def sample-format pyaudio/paInt16)

(def channels 1)

; https://github.com/snakers4/silero-vad/blob/cb92cdd1e33cc1eb9c4ae3626bf3cd60fc660976/utils_vad.py#L207
(def fs 16000)

(def filename "output.mp3")

(def p (pyaudio/PyAudio))

(def stream (py/call-attr-kw p "open" [] {:format sample-format
                                          :channels channels
                                          :rate fs
                                          :frames_per_buffer chunk-size
                                          :input true}))

(defn read-chunk []
  (py/call-attr stream "read" chunk-size))

(def model (first (py/call-attr torch/hub "load" "snakers4/silero-vad" "silero_vad")))

; https://github.com/snakers4/silero-vad/blob/cb92cdd1e33cc1eb9c4ae3626bf3cd60fc660976/examples/pyaudio-streaming/pyaudio-streaming-examples.ipynb?short_path=da46792#L117-L123
(defn int2float [sound]
  (let [abs-max (py/call-attr sound "max")
        sound (py/call-attr sound "astype" "float32")]
    (if (> abs-max 0)
      (py/call-attr sound "__mul__" (/ 1 32768)))
    (py/call-attr sound "squeeze")))

(defn vad? [audio-chunk]
  (let [audio-int16 (np/frombuffer audio-chunk np/int16)
        audio-float32 (int2float audio-int16)
        confidence (model (torch/from_numpy audio-float32) fs)]
    (<= 0.5 (py/call-attr confidence "item"))))

(def empty-bytes (python/bytes "" "utf-8"))

(defn process-and-save-audio [frames]
  ; https://stackoverflow.com/a/63794529
  (let [raw-pcm (py/call-attr empty-bytes "join" frames)
        l (sp/Popen ["lame" "-" "-r" "-m" "m" "-s" "16" filename] :stdin sp/PIPE)]
    (py/call-attr-kw l "communicate" [] {:input raw-pcm})))

(defn continuously-record [frames vad]
  (let [chunk (read-chunk)
        vad* (vad? chunk)]
    (if vad*
      (recur (conj frames chunk) true)
      (do (if vad
            (process-and-save-audio frames))
          (recur [] false)))))

(defn post-request [api-key]
  (let [url "https://api.deepgram.com/v1/listen?smart_format=true&model=nova&language=en-US"
        headers {"Authorization" (str "Token " api-key)}
        body (io/file filename)]
    (-> url
        (client/post {:headers headers :body body})
        :body
        (parse-string true)
        :results
        :channels
        first
        :alternatives
        first
        :paragraphs)))

(defn -main
  [& args]
  (continuously-record [] false))
