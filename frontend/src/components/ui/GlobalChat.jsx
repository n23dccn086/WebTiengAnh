import { useState, useEffect, useRef } from 'react';
import apiClient from '../../services/apiClient';
import useAuthStore from '../../store/authStore';
import styles from './GlobalChat.module.css';

const GlobalChat = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0 });

  useEffect(() => {
    if (!isAuthenticated) return;
    const saved = localStorage.getItem('globalChatPosition');
    if (saved) setPosition(JSON.parse(saved));
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const fetchMessages = async () => {
    try {
      const res = await apiClient.get('/chat/messages?limit=50');
      setMessages(res.data.data);
    } catch (err) {
      console.error('Lỗi tải tin nhắn:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      await apiClient.post('/chat/send', { message: input });
      setInput('');
      await fetchMessages();
    } catch (err) {
      console.error('Lỗi gửi tin nhắn:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (e) => {
    if (!isOpen) return;
    if (e.target.closest(`.${styles.chatHeader}`)) {
      setIsDragging(true);
      dragRef.current = { startX: e.clientX - position.x, startY: e.clientY - position.y };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragRef.current.startX,
        y: e.clientY - dragRef.current.startY,
      });
    };
    const handleMouseUp = () => {
      if (isDragging) {
        localStorage.setItem('globalChatPosition', JSON.stringify(position));
        setIsDragging(false);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isAuthenticated) return null;

  return (
    <>
      <button className={styles.chatIcon} onClick={() => setIsOpen(!isOpen)}>
        💬
      </button>
      {isOpen && (
        <div
          className={styles.chatWindow}
          style={{ left: position.x, top: position.y }}
          onMouseDown={handleMouseDown}
        >
          <div className={styles.chatHeader}>
            <span>🌍 Trò chuyện chung</span>
            <button onClick={() => setIsOpen(false)}>✖</button>
          </div>
          <div className={styles.messages}>
            {messages.map((msg) => (
              <div key={msg.id} className={`${styles.message} ${msg.user_id === user?.id ? styles.myMessage : styles.otherMessage}`}>
                <div className={styles.bubble}>
                  <span className={styles.userName}>{msg.user_name}</span>
                  <p>{msg.message}</p>
                  <span className={styles.time}>{new Date(msg.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className={styles.inputArea}>
            <input
              type="text"
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} disabled={loading}>Gửi</button>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalChat;