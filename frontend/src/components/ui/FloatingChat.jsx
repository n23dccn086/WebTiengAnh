import { useState, useRef, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import useAuthStore from '../../store/authStore';
import styles from './FloatingChat.module.css';

const FloatingChat = () => {
  const { isAuthenticated } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isAuthenticated) return null; // chỉ hiện khi đã đăng nhập

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
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = err.response?.data?.message || 'Lỗi kết nối AI';
      setMessages(prev => [...prev, { role: 'ai', content: `❌ ${errorMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className={styles.chatButton} onClick={() => setIsOpen(!isOpen)}>
        💬
      </button>
      {isOpen && (
        <div className={styles.chatWindow}>
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
            <button onClick={handleSend} disabled={loading}>
              Gửi
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChat;