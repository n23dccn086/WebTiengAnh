import { useState, useRef, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import useAuthStore from '../../store/authStore';
import styles from './FloatingChat.module.css';
import { playNotification } from '../../utils/sound';

const FloatingChat = () => {
  const { isAuthenticated } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0 });

  // Load saved position
  useEffect(() => {
    const saved = localStorage.getItem('floatingChatPosition');
    if (saved) setPosition(JSON.parse(saved));
  }, []);

  // Drag handlers (only when chat is open)
  const handleMouseDown = (e) => {
    if (!isOpen) return;
    // Only drag from the header
    if (e.target.closest(`.${styles.chatHeader}`)) {
      setIsDragging(true);
      dragRef.current = { startX: e.clientX - position.x, startY: e.clientY - position.y };
      e.preventDefault();
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
        localStorage.setItem('floatingChatPosition', JSON.stringify(position));
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

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const res = await apiClient.post('/ai/chat', {
        message: input,
        chat_history: messages
      });
      const botMessage = { role: 'ai', content: res.data.data.reply };
      setMessages(prev => [...prev, botMessage]);
      playNotification();
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = err.response?.data?.message || 'Lỗi kết nối AI';
      setMessages(prev => [...prev, { role: 'ai', content: `❌ ${errorMsg}` }]);
      playNotification();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className={styles.chatButton} onClick={() => setIsOpen(!isOpen)}>💬</button>
      {isOpen && (
        <div
          className={styles.chatWindow}
          style={{ left: position.x, top: position.y, bottom: 'auto', right: 'auto' }}
          onMouseDown={handleMouseDown}
        >
          <div className={styles.chatHeader}>
            <span>🤖 Trợ lý tiếng Anh</span>
            <button onClick={() => setIsOpen(false)}>✖</button>
          </div>
          <div className={styles.messages}>
            {messages.length === 0 && (
              <div className={styles.welcome}>
                Xin chào! Tôi là trợ lý AI. Hãy hỏi tôi bất kỳ điều gì về tiếng Anh nhé.
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`${styles.message} ${styles[msg.role]}`}>
                <div className={styles.bubble}>{msg.content}</div>
              </div>
            ))}
            {loading && <div className={styles.typing}>AI đang suy nghĩ...</div>}
            <div ref={messagesEndRef} />
          </div>
          <div className={styles.inputArea}>
            <input
              type="text"
              placeholder="Nhập câu hỏi..."
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

export default FloatingChat;