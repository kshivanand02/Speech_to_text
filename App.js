import { useState, useRef } from "react";
import "./App.css";

const DEEPGRAM_API_KEY = "9c735f15a690c88b27f35b94db8657adf34f7a49"; // Replace with your key

export default function App() {
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const socketRef = useRef(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    const socket = new WebSocket(
      `wss://api.deepgram.com/v1/listen?punctuate=true&language=en`,
      ["token", DEEPGRAM_API_KEY]
    );

    socketRef.current = socket;

    socket.onopen = () => {
      mediaRecorder.start(250); // send chunks every 250ms
      mediaRecorder.ondataavailable = (e) => {
        if (socket.readyState === 1) {
          socket.send(e.data);
        }
      };
    };

    socket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      const transcriptText = data.channel?.alternatives[0]?.transcript;
      if (transcriptText) {
        setTranscript((prev) => prev + " " + transcriptText);
      }
    };

    socket.onclose = () => console.log("WebSocket closed");
    socket.onerror = (e) => console.error("WebSocket error:", e);

    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (socketRef.current) {
      socketRef.current.close();
    }
    setIsRecording(false);
  };

  return (
    <div className="container">
      <h1>🎙️ Live Speech to Text</h1>
      <textarea
        value={transcript}
        placeholder="Your voice will appear here..."
        readOnly
      />
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? "🛑 Stop" : "▶️ Start"}
      </button>
    </div>
  );
}
