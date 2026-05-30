import React from 'react';

const LETTERS = ['A', 'B', 'C', 'D'];

const QuizBoard = ({ question, selectedOptionId, onSelect, onNext, isReviewMode, answerResult, isAnswered }) => {
  if (!question) return null;
  const isFillInBlank = question.question_type === 'FILL_IN_BLANK';

  const correctOpt = question.options?.find(o => o.is_correct === 1 || o.is_correct === true);
  const correctOptionKey = answerResult?.correct_option_id || correctOpt?.id || correctOpt?.content;

  const shouldShowResult = isReviewMode || isAnswered;

  return (
    <div className="exam-content-wrapper">
      
      {/* 🟢 GOM CHUNG TẤT CẢ VÀO KHUNG CARD ĐỂ KHÔNG BỊ GIẬT LAYOUT */}
      <div className="exam-question-card">
        <h2 className="question-title" style={{ marginBottom: isFillInBlank ? '24px' : '0' }}>
          {isFillInBlank ? "Choose the correct word to complete the sentence below:" : question.content}
        </h2>

        {isFillInBlank && (
           <p className="fill-blank-text">
              {question.content.split('_______').map((part, i, arr) => (
                <React.Fragment key={i}>
                  {part}
                  {i !== arr.length - 1 && <span className="blank-line"></span>}
                </React.Fragment>
              ))}
           </p>
        )}
      </div>

      <div className="exam-options-grid">
        {Array.isArray(question.options) && question.options.map((opt, index) => {
          const optKey = opt.id || opt.content; 
          const isSelected = selectedOptionId === optKey;
          
          let btnClass = "exam-option-btn";

          if (shouldShowResult) {
             btnClass += " lock-hover";
             if (optKey === correctOptionKey) btnClass += " correct";
             else if (isSelected && optKey !== correctOptionKey) btnClass += " incorrect";
             if (isReviewMode) btnClass += " review-mode";
          } else {
             if (isSelected) btnClass += " selected";
          }

          return (
            <button 
              key={optKey} 
              className={btnClass} 
              onClick={() => !shouldShowResult && onSelect(optKey)}
            >
              <div className="exam-option-letter">{LETTERS[index]}</div>
              <span className="option-text">{opt.content}</span>
              
              {/* 🟢 NÚT TIẾP THEO: Thiết kế mới trong suốt, chỉ hiện mũi tên */}
              {!isReviewMode && isSelected && onNext && (
                <div className="inline-next-btn" onClick={(e) => { e.stopPropagation(); onNext(); }}>
                  Tiếp tục <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuizBoard;