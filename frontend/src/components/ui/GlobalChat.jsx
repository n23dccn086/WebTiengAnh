import { useState, useEffect, useRef } from 'react';
import apiClient from '../../services/apiClient';
import useAuthStore from '../../store/authStore';
import styles from './GlobalChat.module.css';

const GlobalChat = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [rawMessages, setRawMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0 });
  const chatContainerRef = useRef(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenMessageIdRef = useRef(null);

  // Đảo ngược để tin mới nhất ở dưới cùng
  const messages = [...rawMessages].reverse();

  // Kiểm tra vị trí cuộn
  const checkScrollPosition = () => {
    const container = chatContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setUserScrolledUp(distanceFromBottom > 50);
  };

  // Lắng nghe sự kiện cuộn
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    container.addEventListener('scroll', checkScrollPosition);
    return () => container.removeEventListener('scroll', checkScrollPosition);
  }, [isOpen]);

  // Auto-scroll khi có tin nhắn mới (nếu không kéo lên)
  useEffect(() => {
    if (!userScrolledUp && chatContainerRef.current && messages.length > 0) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, userScrolledUp]);

  // Fetch tin nhắn và tính unread
  const fetchMessages = async () => {
    try {
      const res = await apiClient.get('/chat/messages?limit=100');
      const newMessages = res.data.data;
      if (isOpen) {
        // Đang mở chat: cập nhật và reset unread
        setRawMessages(newMessages);
        if (newMessages.length > 0) {
          lastSeenMessageIdRef.current = newMessages[0].id;
        }
        setUnreadCount(0);
      } else {
        // Chat đóng: tính tin nhắn mới
        const oldIds = new Set(rawMessages.map(m => m.id));
        const newMsgCount = newMessages.filter(m => !oldIds.has(m.id)).length;
        if (newMsgCount > 0) {
          setUnreadCount(prev => prev + newMsgCount);
        }
        setRawMessages(newMessages);
      }
    } catch (err) {
      console.error('Lỗi tải tin nhắn:', err);
    }
  };

  // Polling 5 giây
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isOpen, rawMessages]); // rawMessages để so sánh khi đóng

  // Lưu vị trí kéo thả
  useEffect(() => {
    const saved = localStorage.getItem('globalChatPosition');
    if (saved) setPosition(JSON.parse(saved));
  }, []);

  // Khi mở chat: cuộn xuống cuối, reset unread
  useEffect(() => {
    if (isOpen && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      setUnreadCount(0);
      if (rawMessages.length > 0) {
        lastSeenMessageIdRef.current = rawMessages[0].id;
      }
    }
  }, [isOpen]);

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

  // Kéo thả chat window
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

  if (!isAuthenticated) return null;

  return (
    <>
      <button className={styles.chatIcon} onClick={() => setIsOpen(!isOpen)}>
        💬
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
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
          <div className={styles.messages} ref={chatContainerRef}>
            {messages.map((msg) => (
              <div key={msg.id} className={`${styles.message} ${msg.user_id === user?.id ? styles.myMessage : styles.otherMessage}`}>
                <div className={styles.bubble}>
                  <span className={styles.userName}>{msg.user_name}</span>
                  <p>{msg.message}</p>
                  <span className={styles.time}>{new Date(msg.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
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