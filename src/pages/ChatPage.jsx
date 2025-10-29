// src/pages/ChatPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, LogIn, Sun, Moon, ShieldCheck, WifiOff, LogOut, UserCheck, Eye, EyeOff, MessageSquare, Send, ArrowLeft, Zap, ZapOff } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import EmojiPicker from 'emoji-picker-react';

// IMPORTANT: Change this base URL if your backend is not running at the given IP:PORT.
const BACKEND_BASE_URL = 'http://10.42.0.1:8000';

// Small helper: decode a JWT's payload
const decodeJwtToken = (token) => {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    // decoding failed
    console.error('Failed to decode JWT:', e);
    return null;
  }
};

// A small Zod schema for message validation
const messageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(500, 'Message too long'),
});

// Inline CSS variables and a couple supporting CSS rules injected at runtime
const runtimeStyle = `
:root{
  --discord-blurple:#5865F2;
  --discord-blurple-2:#404EED;
  --bg-deep:#0f1226;
  --bg-mid:#0b0d16;
  --card:#0f1724;
  --muted:#99AAB5;
  --label:#B9BBBE;
  --white:#FFFFFF;
  --danger:#ff6b6b;
  --success:#3ad29f;
  --glass: rgba(255,255,255,0.03);
  --glass-2: rgba(255,255,255,0.02);
  --shadow: 0 8px 30px rgba(2,6,23,0.6);
  --radius: 14px;
  --transition: 0.28s;
  --primary: var(--discord-blurple);
  --secondary: rgba(255,255,255,0.04);
  --foreground: #E6EDF3;
  --muted-foreground: #9AA7B2;
  --background: linear-gradient(180deg, rgba(10,12,20,1) 0%, rgba(5,7,12,1) 100%);
  --chat-bubble: rgba(255,255,255,0.03);
  --chat-bubble-own: linear-gradient(90deg, rgba(88,101,242,0.95), rgba(64,78,237,0.95));
  --primary-glow: rgba(88,101,242,0.95);
  --border: rgba(255,255,255,0.04);
  --chat-input: rgba(255,255,255,0.02);
  --font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  --radius-xl: 14px;
}
body { margin: 0; font-family: var(--font-family); background: var(--background); }
`;

/* ---------- Small inline SVG icons ---------- */
// BellIcon
function BellIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

// PinIcon
function PinIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3v4.5M8 3v4.5M3 9h18" />
      <path d="M17 21H7a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2z" />
    </svg>
  );
}

// SettingsIcon
function SettingsIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09c.83 0 1.58-.58 1.51-1.41a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06c.46.46 1.12.59 1.82.33h.09c.83 0 1.58-.58 1.51-1.41V3a2 2 0 0 1 4 0v.09c0 .83.58 1.58 1.41 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09c0 .83.58 1.58 1.41 1.51H21a2 2 0 0 1 0 4h-.09c-.83 0-1.58.58-1.51 1.41z" />
    </svg>
  );
}

/* ---------- ChatPage Component ---------- */
function ChatPage({ userData, token, handleLogout, setPage, isDarkMode, toggleDarkMode }) {
  const { channel = 'general', userId: paramUserId } = useParams();
  const navigate = useNavigate();

  const effectiveUserId = userData?.sub || paramUserId;
  const effectiveToken = token;

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-generated', 'chat-runtime-style');
    styleEl.innerHTML = runtimeStyle;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(messageSchema),
    defaultValues: { message: '' },
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userPanelOpen, setUserPanelOpen] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [chatStatus, setChatStatus] = useState('Ready to connect.');
  const [selectedChannel, setSelectedChannel] = useState(channel);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState(() => {
    try {
      const raw = localStorage.getItem('pinnedMessages');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  // Persist pinned messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pinnedMessages', JSON.stringify(pinnedMessages));
    } catch (e) { /* ignore */ }
  }, [pinnedMessages]);

  const socketRef = useRef(null);

  useEffect(() => {
    // Clean-up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const handlePinMessage = (msg) => {
    if (pinnedMessages.some(m => m.id === msg.id)) {
      setPinnedMessages(prev => prev.filter(m => m.id !== msg.id));
      toast.info('Message unpinned', { description: msg.text, duration: 2000 });
    } else {
      setPinnedMessages(prev => [...prev, msg]);
      toast.success('Message pinned', { description: msg.text, duration: 2000 });
    }
  };

  // Emoji picker handler - emojiData object includes `emoji` property
  const handleEmojiClick = (emojiObject, event) => {
    const curr = getValues('message') || '';
    const next = curr + (emojiObject?.emoji || '');
    setValue('message', next, { shouldDirty: true, shouldTouch: true });
    setShowEmojiPicker(false);
  };

  const handleConnect = () => {
    console.log("Button Pressed");
    console.log(effectiveToken, effectiveUserId);
    
    if (!effectiveToken || !effectiveUserId) {
      setChatStatus('Authentication details are missing (no token or user ID).'); 
      toast.error('Missing authentication details', { description: 'No token or user ID', duration: 4000 });
      return;
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      setChatStatus('Already connected.');
      toast.info('Already connected', { duration: 3000 });
      return;
    }

    // Build a ws URL from BACKEND_BASE_URL (http://host:port)
    const wsDomain = BACKEND_BASE_URL.replace(/^https?:\/\//, '');
    const wsBaseUrl = `ws://${wsDomain}/user/${encodeURIComponent(effectiveUserId)}/websocketTest`;
    const fullUrl = `${wsBaseUrl}?token=${encodeURIComponent(effectiveToken)}&user_id=${encodeURIComponent(effectiveUserId)}`;

    console.log('[WS DEBUG] Connecting to:', fullUrl);
    console.log('[WS DEBUG] effectiveUserId:', effectiveUserId);
    console.log('[WS DEBUG] effectiveToken:', effectiveToken);

    setChatStatus('Connecting to WebSocket...');
    toast.info('Connecting to chat...', { duration: 3000 });

    try {
      const ws = new WebSocket(fullUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setChatStatus('Connection successful!');
        setMessages([{ id: Date.now(), user: 'System', text: 'Welcome to the live chat!', channel: selectedChannel }]);
        toast.success('Connected to chat', { duration: 3000 });
      };

      ws.onmessage = (event) => {
        // Try to parse as JSON, fallback to plain text
        let data = null;
        let isJson = false;
        try {
          data = JSON.parse(event.data);
          isJson = true;
        } catch (e) {
          data = event.data;
        }

        // Always extract and log the message text
        let extractedText = '';
        if (isJson && data && typeof data === 'object') {
          if (typeof data.text === 'string') {
            extractedText = data.text;
          } else if (typeof data.text === 'object' && data.text !== null && typeof data.text.text === 'string') {
            extractedText = data.text.text;
          }
        } else if (typeof data === 'string') {
          try {
            const parsed = JSON.parse(data);
            if (parsed && typeof parsed.text === 'string') {
              extractedText = parsed.text;
            } else {
              extractedText = data;
            }
          } catch {
            extractedText = data;
          }
        }
        if (extractedText) {
          console.log('Extracted message:', extractedText);
        }

        if (isJson && data && typeof data === 'object') {
          console.log('[WS DEBUG] Received JSON data:', data);
          console.log(typeof data);
          // console.log the message field of data json 
          
          
          toast.message('New messaage received', { description: JSON.stringify(data.message), duration: 2500 });

          //create message blob with the data.message
          setMessages((prev) => [...prev, { id: Date.now(), user: data.id || 'Other', text: data.message, channel: selectedChannel }]);
        } else {
          // If plain text, treat as a message from another user (left side)
          setMessages((prev) => {
            const updated = [...prev, { id: Date.now(), user: 'Other', text: extractedText, channel: selectedChannel }];
            // Only print if extracted id from token does not match current id
            const extractedId = userData?.sub;
            const currentId = effectiveUserId;
            if (extractedId && currentId && extractedId !== currentId) {
              console.log('[WS] All messages after non-JSON:', updated);
            }
            return updated;
          });
          toast.warning('Non-JSON message received', { description: extractedText, duration: 2500 });
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setChatStatus("Disconnected. Click 'Connect' to try again.");
        socketRef.current = null;
        toast.error('Disconnected from chat', { duration: 3000 });
      };

      ws.onerror = (err) => {
        console.error('WebSocket encountered error:', err);
        setIsConnected(false);
        setChatStatus('Connection error. Check console and backend logs.');
        toast.error('WebSocket error', { description: 'Check backend logs', duration: 4000 });
        if (ws) ws.close();
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setChatStatus('Failed to create WebSocket. See console.');
      toast.error('Failed to create WebSocket', { duration: 4000 });
    }
  };

  const handleDisconnect = () => {
    if (socketRef.current) {
      socketRef.current.close();
      toast.info('Disconnecting...', { duration: 2000 });
    }
  };

  const handleSendMessage = (data) => {
    if (!isConnected || !socketRef.current) {
      toast.error('Not connected to chat', { duration: 2000 });
      return;
    }
    const payload = { text: data.message, channel: selectedChannel };
    try {
      socketRef.current.send(JSON.stringify(payload));
      const ownMsg = { id: Date.now(), user: 'You', text: data.message, channel: selectedChannel };
      setMessages(prev => [...prev, ownMsg]);
      toast.success('Message sent', { description: data.message, duration: 2000 });
      setValue('message', '');
    } catch (e) {
      console.error('Send failed', e);
      toast.error('Send failed', { description: e.message || 'Unknown error', duration: 3000 });
    }
  };

  // Basic UI
  return (
    <>
      <Toaster position="top-right" richColors />
      <div style={{
        minHeight: '100vh',
        background: 'var(--background)',
        display: 'flex',
        fontFamily: 'var(--font-family)',
        position: 'relative',
      }}>
        {/* Hamburger for sidebar (mobile/tablet) */}
        <button
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 100,
            background: 'var(--card)',
            border: 'none',
            borderRadius: 8,
            padding: 8,
            display: 'none',
          }}
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(s => !s)}
        >
          <span style={{ fontSize: 22 }}>☰</span>
        </button>

        {/* Sidebar */}
        <aside
          style={{
            width: sidebarOpen ? 264 : 0,
            minWidth: sidebarOpen ? 264 : 0,
            background: 'var(--card)',
            borderRight: sidebarOpen ? '1px solid var(--border)' : 'none',
            display: sidebarOpen ? 'flex' : 'none',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'width 0.3s',
            zIndex: 99,
            position: 'relative',
          }}
          className="sidebar"
        >
          <div>
            <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
              <span style={{ color: 'var(--foreground)', fontWeight: 600, fontSize: 20 }}>My Server</span>
            </div>
            <div style={{ padding: '16px 0 0 0' }}>
              <div style={{ padding: '0 20px 8px', color: 'var(--muted-foreground)', fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>TEXT CHANNELS</div>
              {['general', 'random'].map(ch => (
                <button
                  key={ch}
                  style={{
                    width: '100%',
                    background: selectedChannel === ch ? 'var(--secondary)' : 'transparent',
                    color: selectedChannel === ch ? 'var(--foreground)' : 'var(--muted-foreground)',
                    textAlign: 'left',
                    padding: '8px 20px',
                    border: 'none',
                    borderRadius: 8,
                    marginBottom: 4,
                    fontWeight: 500,
                    fontSize: 15,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => {
                    setSelectedChannel(ch);
                    if (paramUserId) navigate(`/chat/${paramUserId}/${ch}`);
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--secondary)'}
                  onMouseOut={e => e.currentTarget.style.background = selectedChannel === ch ? 'var(--secondary)' : 'transparent'}
                >
                  <span style={{ marginRight: 8, verticalAlign: 'middle' }}>#</span>{ch}
                </button>
              ))}
            </div>

            <div style={{ padding: '16px 0 0 0' }}>
              <div style={{ padding: '0 20px 8px', color: 'var(--muted-foreground)', fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>ONLINE USERS</div>
              <div style={{ padding: '0 20px' }}>
                {onlineUsers.length === 0 ? (
                  <div style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>No users online</div>
                ) : (
                  onlineUsers.map((user, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                        {user.email ? user.email.slice(0, 2).toUpperCase() : 'US'}
                      </div>
                      <span style={{ color: 'var(--foreground)', fontSize: 14 }}>{user.email || user.name || 'User'}</span>
                      {user.role && <span style={{ color: 'var(--muted-foreground)', fontSize: 12, marginLeft: 4 }}>{user.role}</span>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* User Panel */}
          <div
            style={{
              height: userPanelOpen ? 64 : 0,
              borderTop: '1px solid var(--border)',
              background: 'var(--card)',
              display: userPanelOpen ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px',
              transition: 'height 0.3s',
            }}
            className="user-panel"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
                {userData?.email ? userData.email.slice(0, 2).toUpperCase() : 'US'}
              </div>
              <div>
                <div style={{ color: 'var(--foreground)', fontWeight: 600, fontSize: 14 }}>{userData?.email || 'User'}</div>
                <div style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{userData?.role || 'Member'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--secondary)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <SettingsIcon />
              </button>
              <button style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--danger)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={handleLogout} title="Logout">
                <LogOut color="#fff" size={16} />
              </button>
            </div>
          </div>
        </aside>

        {/* Chat Area */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header */}
          <div style={{ height: 56, display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', padding: '0 24px', justifyContent: 'space-between', background: 'var(--card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--muted-foreground)', fontWeight: 700, fontSize: 18 }}><MessageSquare size={20} style={{ marginRight: 4 }} />#{selectedChannel}</span>
              <span style={{
                background: isConnected ? 'hsl(146, 71%, 40%)' : 'var(--muted)',
                color: '#fff',
                borderRadius: 999,
                padding: '2px 8px',
                fontSize: 12,
                fontWeight: 600,
                marginLeft: 8,
              }}>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <BellIcon color="var(--muted-foreground)" size={20} />
              <PinIcon color="var(--muted-foreground)" size={20} />
              <UserCheck color="var(--muted-foreground)" size={20} />
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Pinned messages */}
            {pinnedMessages.filter(msg => msg.channel === selectedChannel).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
                  <PinIcon style={{ marginRight: 6, verticalAlign: 'middle' }} />Pinned Messages
                </div>
                {pinnedMessages.filter(msg => msg.channel === selectedChannel).map((msg) => (
                  <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-end', gap: 12, maxWidth: '70%', alignSelf: msg.user === 'You' ? 'flex-end' : 'flex-start', background: 'var(--glass)', borderRadius: 12, padding: '8px 12px', marginBottom: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>
                      {msg.user ? msg.user.slice(0, 2).toUpperCase() : 'US'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--primary-glow)', marginBottom: 2 }}>{msg.user || 'User'}</div>
                      <div>{msg.text}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 6 }}>{new Date(msg.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <button onClick={() => handlePinMessage(msg)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', marginLeft: 8 }} title="Unpin"><PinIcon size={18} /></button>
                  </div>
                ))}
              </div>
            )}

            {/* Regular messages */}
            {messages.filter(msg => msg.channel === selectedChannel).length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 16, marginTop: 40 }}>No messages yet. Start the conversation!</div>
            ) : (
              messages.filter(msg => msg.channel === selectedChannel).map((msg, idx) => {
                // WhatsApp-like alignment: own messages right, others left, system center
                const isOwn = msg.user === 'You' || (userData?.email && msg.user === userData.email);
                const isSystem = msg.user === 'System';
                const isPinned = pinnedMessages.some(m => m.id === msg.id);
                // For WhatsApp logic: only own messages are right, all others (including backend) are left
                const flexDirection = isSystem ? 'row' : isOwn ? 'row-reverse' : 'row';
                const alignSelf = isSystem ? 'center' : isOwn ? 'flex-end' : 'flex-start';

                // For non-own, non-system messages, show 'User [userId]' and the value of the 'text' property
                let displayName = '';
                let displayText = msg.text;
                if (!isOwn && !isSystem) {
                  // Extract userId from msg.userId or msg.user
                  let userId = '';
                  if (msg.userId) {
                    userId = msg.userId;
                  } else if (msg.user && msg.user !== 'Other') {
                    userId = msg.user;
                  } else {
                    userId = 'Unknown';
                  }
                  displayName = `User ${userId}`;
                  // If msg.text is an object, extract its 'text' property
                  if (typeof msg.text === 'object' && msg.text !== null && typeof msg.text.text === 'string') {
                    displayText = msg.text.text;
                  } else if (typeof msg.text === 'string') {
                    try {
                      const parsed = JSON.parse(msg.text);
                      if (parsed && typeof parsed.text === 'string') {
                        displayText = parsed.text;
                      } else {
                        displayText = msg.text;
                      }
                    } catch {
                      displayText = msg.text;
                    }
                  } else {
                    displayText = '';
                  }
                  // Log to console: User [userId]: [displayText]
                  if (displayText && userId !== 'Unknown') {
                    console.log(`User ${userId}: ${displayText}`);
                  }
                } else if (isSystem) {
                  displayName = 'System';
                } else if (isOwn) {
                  displayName = userData?.email || 'You';
                }

                return (
                  <div key={idx} style={{
                    display: 'flex',
                    flexDirection,
                    alignItems: 'flex-end',
                    gap: 12,
                    maxWidth: '70%',
                    alignSelf,
                  }}>
                    {!isSystem && (
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: isOwn ? 'var(--primary)' : 'var(--secondary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>
                        {isOwn ? (userData?.email ? userData.email.slice(0, 2).toUpperCase() : 'YO') : 'US'}
                      </div>
                    )}
                    <div style={{
                      background: isSystem ? 'var(--card-bg)' : isOwn ? 'var(--chat-bubble-own)' : 'var(--chat-bubble)',
                      color: isSystem ? 'var(--text-muted)' : isOwn ? '#fff' : 'var(--foreground)',
                      borderRadius: 'var(--radius-xl)',
                      padding: '12px 20px',
                      boxShadow: isOwn ? 'var(--shadow)' : 'none',
                      fontSize: 15,
                      fontWeight: 500,
                      maxWidth: '100%',
                      position: 'relative',
                      textAlign: isSystem ? 'center' : 'left',
                      margin: isSystem ? '0 auto' : undefined,
                    }}>
                      <div style={{ fontWeight: 600, color: isSystem ? 'var(--text-muted)' : isOwn ? 'var(--primary-glow)' : 'var(--foreground)', marginBottom: 2 }}>
                        {(!isOwn && !isSystem) ? displayName : displayName}
                      </div>
                      <div>{(!isOwn && !isSystem) ? displayText : msg.text}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 6 }}>{new Date(msg.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    {!isSystem && (
                      <button onClick={() => handlePinMessage(msg)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isPinned ? 'var(--primary)' : 'var(--muted-foreground)', marginLeft: 8 }} title={isPinned ? "Unpin" : "Pin"}><PinIcon size={18} /></button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSubmit(handleSendMessage)} style={{ borderTop: '1px solid var(--border)', background: 'var(--card)', padding: 16, display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            <button type="button" style={{ width: 40, height: 40, borderRadius: '50%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setShowEmojiPicker(s => !s)}>
              <span role="img" aria-label="emoji">😊</span>
            </button>
            {showEmojiPicker && (
              <div style={{ position: 'absolute', bottom: 56, left: 12, zIndex: 30 }}>
                <EmojiPicker onEmojiClick={handleEmojiClick} theme={isDarkMode ? 'dark' : 'light'} height={350} width={320} />
              </div>
            )}
            <input
              type="text"
              {...register('message')}
              placeholder={isConnected ? 'Type a message...' : 'Connect to chat first'}
              style={{
                flex: 1,
                background: 'var(--chat-input)',
                color: 'var(--foreground)',
                border: 'none',
                borderRadius: 'var(--radius)',
                padding: '0 16px',
                height: 40,
                fontSize: 15,
                outline: 'none',
                boxShadow: isConnected ? '0 0 0 2px var(--primary)' : 'none',
                transition: 'box-shadow 0.2s',
              }}
              aria-label="New message"
              disabled={!isConnected}
            />
            <button type="submit" disabled={!isConnected} style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', boxShadow: 'var(--shadow)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isConnected ? 'pointer' : 'not-allowed', transition: 'opacity 0.2s' }} aria-label="Send message">
              <Send color="#fff" size={18} />
            </button>

            {!isConnected ? (
              <button type="button" onClick={handleConnect} style={{ marginLeft: 12, background: 'var(--success)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '0 16px', height: 40, fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: 'var(--shadow)' }}>
                <Zap size={16} style={{ marginRight: 6 }} />Connect
              </button>
            ) : (
              <button type="button" onClick={handleDisconnect} style={{ marginLeft: 12, background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '0 16px', height: 40, fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: 'var(--shadow)' }}>
                <ZapOff size={16} style={{ marginRight: 6 }} />Disconnect
              </button>
            )}

            {errors.message && (
              <span style={{ color: 'var(--danger)', fontSize: 13, position: 'absolute', left: 60, bottom: 8 }}>{errors.message.message}</span>
            )}
          </form>
        </main>

        {/* Responsive CSS for hamburger buttons */}
        <style>{`
          @media (max-width: 900px) {
            .sidebar-toggle { display: block !important; }
            .sidebar { position: absolute; left: 0; top: 0; height: 100vh; box-shadow: 0 2px 16px rgba(0,0,0,0.18); }
            .userpanel-toggle { display: block !important; }
          }
        `}</style>
      </div>
    </>
  );
}

export default ChatPage;
