import React from 'react';
import TextareaAutosize from 'react-textarea-autosize';

const FlashcardItem = ({ card, index, totalCards, isAutoFetch, onChange, onBlur, onRemove, onApplySuggestion }) => {
  return (
    <div className={`flashcard-editor glass-panel group ${card.isDeleting ? 'deleting' : ''}`}>
      {totalCards > 1 && (
        <button className="btn-remove-card opacity-0 group-hover:opacity-100" title="Xóa thẻ này" onClick={() => onRemove(index)}>
          <span className="material-symbols-outlined">delete</span>
        </button>
      )}
      
      <div className="flashcard-grid">
        <div className="flashcard-side">
          <div className="side-title">MẶT TRƯỚC</div>
          <div className="input-group">
            <label>Từ vựng / Thuật ngữ</label>
            <input 
              type="text" className="modern-input font-bold" placeholder="Nhập từ..." 
              value={card.word} onChange={(e) => onChange(index, 'word', e.target.value)} onBlur={() => onBlur(index)} 
            />
          </div>
          <div className="input-group mt-3">
            <label>Phiên âm (IPA)</label>
            <input 
              type="text" className="modern-input" placeholder="/.../" 
              value={card.pronunciation} onChange={(e) => onChange(index, 'pronunciation', e.target.value)} 
            />
          </div>
        </div>

        <div className="flashcard-side">
          <div className="side-title">MẶT SAU</div>
          <div className="input-group flex-col">
            <div className="label-row">
              <label>Ý nghĩa</label>
              {card.suggestionData && !card.meaning.trim() && !isAutoFetch && (
                <button className="suggestion-inline-btn" onClick={() => onApplySuggestion(index)}>
                  <span className="material-symbols-outlined">auto_awesome</span>
                  Gợi ý: <strong>{card.suggestionData.part_of_speech ? `(${card.suggestionData.part_of_speech})` : ''} {card.suggestionData.meaning}</strong>
                </button>
              )}
            </div>
            <TextareaAutosize 
              className="modern-input" minRows={2} placeholder="Định nghĩa..." 
              value={card.meaning} onChange={(e) => onChange(index, 'meaning', e.target.value)} 
            />
          </div>
          <div className="input-group mt-3 flex-col">
            <label>Câu ví dụ</label>
            <TextareaAutosize 
              className="modern-input" minRows={2} placeholder="Ngữ cảnh sử dụng..." 
              value={card.example_sentence} onChange={(e) => onChange(index, 'example_sentence', e.target.value)} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardItem;