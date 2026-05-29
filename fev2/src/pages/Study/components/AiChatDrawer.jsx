import React from 'react';

const AiChatDrawer = ({ chatHistory, chatInput, setChatInput, onSendChat, chatEndRef }) => {
  return (
    <aside className="ai-drawer">
      <div className="ai-header">
        <span className="material-symbols-outlined" style={{ color: 'var(--accent-hover)' }}>auto_awesome</span> 
        AI Tutor
      </div>
      
      <div className="ai-chat-area custom-scrollbar">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`chat-message-row ${msg.role === 'user' ? 'user-row' : 'ai-row'}`}>
            <div className={`chat-bubble ${msg.role}`}>
              <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--accent-hover)">$1</strong>') }} />
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={onSendChat} className="ai-input-area">
        <input 
          type="text" 
          value={chatInput} 
          onChange={e => setChatInput(e.target.value)} 
          placeholder="Nhờ AI giải thích thêm..." 
          className="chat-input"
        />
        <button type="submit" disabled={!chatInput.trim()} className="btn-send-chat">
          <span className="material-symbols-outlined">arrow_upward</span>
        </button>
      </form>
    </aside>
  );
};

export default AiChatDrawer;