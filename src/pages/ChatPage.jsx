import React, { useEffect, useState } from "react";
import { getToken, logout } from "../utils/auth";

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat?token=${getToken()}`);
    setSocket(ws);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    ws.onclose = () => console.log("WebSocket closed");

    return () => ws.close();
  }, []);

  const sendMessage = () => {
    if (socket && input.trim()) {
      socket.send(JSON.stringify({ text: input }));
      setInput("");
    }
  };

  return (
    <div className="chat-container">
      <header>
        <h2>Student Chat</h2>
        <button onClick={logout}>Logout</button>
      </header>

      <div className="chat-box">
        {messages.map((msg, i) => (
          <div key={i} className="msg">{msg.text}</div>
        ))}
      </div>

      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatPage;
