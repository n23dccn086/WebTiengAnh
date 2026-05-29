import React, { useState, useRef, useEffect } from 'react';

const DeckCard = ({ deck, onEditContent, onEditInfo, onDelete, onToggleSrs, onStudy }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const progress = deck.mastery_progress || 0; 
  const sourceLabel = deck.is_system ? 'SYSTEM COLLECTION' : 
                     (deck.document_id ? 'PDF EXTRACTION' : 'MANUAL ENTRY');
  const sourceIcon = deck.is_system ? 'auto_awesome_mosaic' : 
                    (deck.document_id ? 'auto_awesome' : 'edit_document');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    // THÊM ONCLICK VÀO ĐÂY ĐỂ BẤM ĐƯỢC TOÀN BỘ THẺ
    <div className="deck-card" onClick={() => onStudy(deck.id)}>
      <div className="deck-card-header">
        <div className="deck-source">
          <span className="material-symbols-outlined">{sourceIcon}</span>
          {sourceLabel}
        </div>
        
        <div className="deck-menu-wrapper" ref={menuRef}>
          {/* DÙNG stopPropagation ĐỂ KHÔNG BỊ CHẠY VÀO LỆNH onStudy KHI BẤM MENU */}
          <button className="btn-icon-menu" onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}>
            <span className="material-symbols-outlined">more_vert</span>
          </button>
          
          {showMenu && (
            <div className="deck-dropdown-menu">
              {!deck.is_system && (
                <>
                  <button className="menu-btn" onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEditInfo(deck); }}>
                    <span className="material-symbols-outlined">edit_note</span> Edit Info
                  </button>
                  <button className="menu-btn" onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEditContent(deck); }}>
                    <span className="material-symbols-outlined">style</span> Edit Cards
                  </button>
                </>
              )}
              
              <div className="menu-btn toggle-row" onClick={(e) => { e.stopPropagation(); onToggleSrs(deck); }}>
                <div className="toggle-label">
                  <span className="material-symbols-outlined">psychology</span>
                  SRS Algorithm
                </div>
                <label className="menu-switch">
                  <input type="checkbox" checked={deck.is_srs_enabled === 1} readOnly />
                  <span className="menu-slider"></span>
                </label>
              </div>

              <div className="dropdown-divider"></div>
              
              <button className="menu-btn text-danger" onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(deck); }}>
                <span className="material-symbols-outlined">delete</span> 
                {deck.is_system ? 'Remove from Library' : 'Delete Deck'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="deck-card-body">
        <h3 className="deck-title">{deck.title}</h3>
        <div className="deck-progress-container">
          <div className="progress-info">
            <span>Mastery Progress</span>
            <span className="progress-percent">{progress}%</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      <div className="deck-card-footer">
        <div className="deck-meta">
          <span className="material-symbols-outlined">style</span>
          <span>{deck.total_cards || 0} cards</span>
        </div>
        <div className="btn-play-deck" title="Study Now">
          <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>play_arrow</span>
        </div>
      </div>
    </div>
  );
};

export default DeckCard;