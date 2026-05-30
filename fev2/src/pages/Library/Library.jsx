import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';

import DeckCard from './components/DeckCard';
import AddDeckCard from './components/AddDeckCard';
import './Library.css';

const Library = () => {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('personal');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [sortBy, setSortBy] = useState('newest'); 
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  const [personalSets, setPersonalSets] = useState([]);
  const [systemSets, setSystemSets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ type: '', message: '', visible: false });

  const [editModal, setEditModal] = useState({ visible: false, deckId: null, title: '', description: '' });

  const showToast = useCallback((type, message) => {
    setToast({ type, message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSets = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'personal') {
        const res = await apiClient.get('/flashcard-sets?page=1&limit=50');
        setPersonalSets(res.data.data.sets || []);
      } else {
        const res = await apiClient.get('/flashcard-sets/system');
        setSystemSets(res.data.data || []);
      }
    } catch (err) { showToast('error', 'Failed to load decks.'); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchSets(); }, [activeTab]);

  const handleEditContent = (deck) => navigate(`/edit-deck/${deck.id}`);

  const handleOpenEditInfo = (deck) => {
    setEditModal({ visible: true, deckId: deck.id, title: deck.title, description: deck.description || '' });
  };

  const handleSaveInfo = async () => {
    if (!editModal.title.trim()) { showToast('error', 'Deck name cannot be empty!'); return; }
    try {
      await apiClient.put(`/flashcard-sets/${editModal.deckId}`, { 
        title: editModal.title, 
        description: editModal.description 
      });
      showToast('success', 'Deck info updated successfully.');
      setEditModal({ visible: false, deckId: null, title: '', description: '' });
      fetchSets();
    } catch (err) { showToast('error', 'Error updating deck info.'); }
  };

  const handleDelete = async (deck) => {
    if (deck.is_system) {
      if(!window.confirm('Do you want to remove this system deck from your library?')) return;
      try {
        await apiClient.delete(`/flashcard-sets/${deck.id}/save`);
        showToast('success', 'System deck removed.');
        fetchSets(); 
      } catch (err) { showToast('error', 'Error removing deck.'); }
    } else {
      if(!window.confirm('Are you sure you want to permanently delete this deck? All flashcards will be lost.')) return;
      try {
        await apiClient.delete(`/flashcard-sets/${deck.id}`);
        showToast('success', 'Deck deleted successfully.');
        fetchSets(); 
      } catch (err) { showToast('error', 'Error deleting deck.'); }
    }
  };

  const handleToggleSrs = async (deck) => {
    try {
      await apiClient.put(`/flashcard-sets/${deck.id}/toggle-srs`, {
        is_srs_enabled: !deck.is_srs_enabled,
        daily_new_words: deck.daily_new_words || 20
      });
      showToast('success', `SRS algorithm ${deck.is_srs_enabled ? 'disabled' : 'enabled'}.`);
      fetchSets(); 
    } catch (err) { showToast('error', 'Error changing SRS settings.'); }
  };

  const handleStudy = (deckId) => navigate(`/study/${deckId}`);

  const displaySets = activeTab === 'personal' ? personalSets : systemSets;
  let filteredSets = displaySets.filter(deck => deck.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (sortBy === 'newest') filteredSets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  if (sortBy === 'oldest') filteredSets.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  if (sortBy === 'az') filteredSets.sort((a, b) => a.title.localeCompare(b.title));

  const getSortLabel = () => {
    if(sortBy === 'newest') return 'Newest';
    if(sortBy === 'oldest') return 'Oldest';
    return 'Name A-Z';
  };

  return (
    <div className="library-container">
      {toast.visible && <div className={`toast-notification ${toast.type}`}><p>{toast.message}</p></div>}

      {/* MODAL SỬA THÔNG TIN */}
      {editModal.visible && (
        <div className="edit-info-overlay">
          <div className="edit-info-modal">
            <h3>Edit Deck Info</h3>
            <div className="input-group">
              <label>Deck Name</label>
              <input type="text" className="modern-input" value={editModal.title} onChange={(e) => setEditModal({...editModal, title: e.target.value})} />
            </div>
            <div className="input-group" style={{marginTop: '16px'}}>
              <label>Short Description</label>
              <input type="text" className="modern-input" value={editModal.description} onChange={(e) => setEditModal({...editModal, description: e.target.value})} />
            </div>
            <div className="edit-info-actions">
              <button className="btn-cancel" onClick={() => setEditModal({visible: false})}>Cancel</button>
              <button className="btn-save" onClick={handleSaveInfo}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER BAR (ĐÃ LÀM GỌN VÀ BỎ THANH SEARCH) */}
      <div className="library-header-bar">
        <div className="library-header-info">
          <h1>Your Library</h1>
          <p>Master your knowledge with AI & SRS algorithms.</p>
        </div>
      </div>

      <div className="library-tabs">
        <button className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>Personal</button>
        <button className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>System</button>
      </div>

      <div className="library-content">
        {/* THANH TOOLBAR CHỨA NÚT SẮP XẾP VÀ THANH SEARCH (NẰM CÙNG HÀNG) */}
        <div className="library-toolbar">
          <div className="toolbar-left">
            <div className="custom-sort-wrapper" ref={sortRef}>
              <button className="custom-sort-btn" onClick={() => setSortOpen(!sortOpen)}>
                <span className="material-symbols-outlined">sort</span>
                {getSortLabel()}
                <span className="material-symbols-outlined" style={{fontSize: '16px'}}>expand_more</span>
              </button>
              {sortOpen && (
                <div className="custom-sort-menu">
                  <div className={`sort-item ${sortBy === 'newest' ? 'active' : ''}`} onClick={() => { setSortBy('newest'); setSortOpen(false); }}>Newest</div>
                  <div className={`sort-item ${sortBy === 'oldest' ? 'active' : ''}`} onClick={() => { setSortBy('oldest'); setSortOpen(false); }}>Oldest</div>
                  <div className={`sort-item ${sortBy === 'az' ? 'active' : ''}`} onClick={() => { setSortBy('az'); setSortOpen(false); }}>Name A-Z</div>
                </div>
              )}
            </div>
            <span className="total-count">{filteredSets.length} {filteredSets.length === 1 ? 'deck' : 'decks'}</span>
          </div>

          <div className="toolbar-right">
            <div className="search-box">
              <span className="material-symbols-outlined search-icon">search</span>
              <input type="text" placeholder="Search decks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="grid-wrapper">
          {isLoading && <div className="local-loader"><div className="circular-spinner"></div></div>}
          
          <div className={`deck-grid ${isLoading ? 'loading-blur' : ''}`}>
            {activeTab === 'personal' && !searchQuery && <AddDeckCard />}

            {filteredSets.length > 0 ? (
              filteredSets.map(deck => (
                <DeckCard 
                  key={deck.id} deck={deck} 
                  onEditContent={handleEditContent} onEditInfo={handleOpenEditInfo}
                  onDelete={handleDelete} onToggleSrs={handleToggleSrs}
                  onStudy={handleStudy} 
                />
              ))
            ) : (
              !isLoading && (
                <div className="empty-state">
                  <span className="material-symbols-outlined">search_off</span>
                  <p>No decks found.</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Library;