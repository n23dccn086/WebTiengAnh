// src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import apiClient from '../../services/apiClient';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [stats, setStats] = useState({ current_streak: 0, due_today: 0 });
  const [recentSets, setRecentSets] = useState([]);
  const [systemSetsByService, setSystemSetsByService] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statRes = await apiClient.get('/statistics/overview');
      setStats(statRes.data.data);

      const personalRes = await apiClient.get('/flashcard-sets/personal?limit=4');
      setRecentSets(personalRes.data.data.sets || []);

      const sysRes = await apiClient.get('/flashcard-sets/system');
      const sysData = sysRes.data.data || [];
      
      const grouped = sysData.reduce((acc, set) => {
        const sName = set.service_title || 'Bộ thẻ khác';
        if (!acc[sName]) acc[sName] = [];
        acc[sName].push(set);
        return acc;
      }, {});
      setSystemSetsByService(grouped);

    } catch (error) {
      console.error("Lỗi tải Bảng điều khiển:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSaveSystemSet = async (e, setId, isSaved) => {
    e.stopPropagation(); 
    try {
      if (isSaved) {
        await apiClient.delete(`/flashcard-sets/${setId}/save`);
      } else {
        await apiClient.post(`/flashcard-sets/${setId}/save`);
      }
      fetchDashboardData(); 
    } catch (error) {
      console.error("Lỗi lưu bộ thẻ:", error);
    }
  };

  if (loading) return <div style={{padding: '40px', color: 'white'}}>Đang khởi động trạm vũ trụ...</div>;

  return (
    <div className="dashboard-container">
      
      {/* =========================================
          KHỐI 1: DAILY REVIEW (Chào mừng thanh lịch)
          ========================================= */}
      <section className="welcome-banner">
        <div className="welcome-info">
          <h2>
            Chào buổi {new Date().getHours() < 12 ? 'sáng' : new Date().getHours() < 18 ? 'chiều' : 'tối'}, {user?.full_name?.split(' ')[0] || 'bạn'}!
            {stats.current_streak > 0 && (
              <span className="streak-badge">
                <span className="material-symbols-outlined" style={{fontSize: '14px'}}>local_fire_department</span>
                {stats.current_streak} Day Streak
              </span>
            )}
          </h2>
          <p>{stats.due_today > 0 ? `${stats.due_today} từ vựng cần ôn tập hôm nay` : 'Tuyệt vời! Bạn đã hoàn thành hết mục tiêu hôm nay.'}</p>
        </div>
        <button className="btn-review" onClick={() => navigate('/daily-review')}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
          Vào ôn tập ngay
        </button>
      </section>

      {/* =========================================
          KHỐI 2: AI PDF BANNER (Hai cột có hình ảnh)
          ========================================= */}
      <section className="ai-banner-card">
        <div className="ai-banner-left">
          <div className="ai-icons">
            <div className="ai-icon-mini blue"><span className="material-symbols-outlined" style={{fontSize:'20px'}}>style</span></div>
            <div className="ai-icon-mini green"><span className="material-symbols-outlined" style={{fontSize:'20px'}}>psychology</span></div>
          </div>
          <h3>Create your own flashcards</h3>
          <p>Study exactly what's on your test with AI-powered card generation.</p>
          <button className="btn-ai" onClick={() => navigate('/create-deck')}>
            Create flashcards
          </button>
        </div>
        <div className="ai-banner-right">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2nAwKAQDnnsZVd73NAmR4M3pPo5dlwpymS4UKbvLyRyn3YVxDKUmxI8ceNkA14WtVwbD5yUkvBTELuqua22pKG2ZMeeXdHcEW2_BAtdQ_EnOhijKTI8ahHvCMAxrfpL6mgesUSNbecdplVQ3GqbJcD14IdSIFwdJRcKGxLW_dFhyArFT9-2mDSvpXOqVbnNZv6v9lr5TvZVpahhIX8tOB26TN49MOXKgOo7W2oE4yWlOeXPAfzLN5CYx-aZB3YE606jJwQEtI7vw" 
            alt="AI Flashcards" 
          />
        </div>
      </section>

      {/* =========================================
          KHỐI 3: ĐANG HỌC (Nhỏ gọn / Compact)
          ========================================= */}
      {recentSets.length > 0 && (
        <section>
          <h2 className="section-title">
            <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontVariationSettings: "'FILL' 1" }}>school</span>
            Đang học
          </h2>
          <div className="recents-grid">
            {recentSets.map(set => (
              /* ĐÃ FIX: Chuyển hướng sang /study/:id */
              <div key={set.id} className="recent-card" onClick={() => navigate(`/study/${set.id}`)}>
                <div className="recent-header">
                  <div className="r-icon">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>book</span>
                  </div>
                  <div className="r-info">
                    <h3>{set.title}</h3>
                    <p>by you</p>
                  </div>
                </div>
                
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${set.mastery_progress || 0}%` }}></div>
                </div>
                <div className="progress-stats">
                  <span>{set.mastery_progress || 0}%</span>
                  <span>{set.total_cards} terms</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =========================================
          KHỐI 4: KHÁM PHÁ HỆ THỐNG
          ========================================= */}
      <section>
        <h2 className="section-title">
          <span className="material-symbols-outlined" style={{ color: '#aa3bff', fontVariationSettings: "'FILL' 1" }}>explore</span>
          Khám phá hệ thống
        </h2>

        {Object.entries(systemSetsByService).map(([serviceName, sets]) => (
          <div key={serviceName} className="system-category">
            <h3 className="category-name">{serviceName}</h3>
            
            <div className="horizontal-scroll">
              {sets.map(set => (
                /* ĐÃ FIX: Chuyển hướng sang /study/:id */
                <div key={set.id} className="system-card" onClick={() => navigate(`/study/${set.id}`)}>
                  <h4>{set.title}</h4>
                  <p>{set.description || 'Bộ thẻ chọn lọc giúp bạn nắm vững kiến thức trọng tâm.'}</p>
                  
                  <div className="system-card-footer">
                    <span className="term-badge">{set.total_cards} terms</span>
                    <button 
                      className={`btn-bookmark ${set.is_saved ? 'saved' : ''}`}
                      onClick={(e) => handleSaveSystemSet(e, set.id, set.is_saved)}
                      title={set.is_saved ? "Bỏ lưu" : "Lưu bộ thẻ"}
                    >
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: set.is_saved ? "'FILL' 1" : "'FILL' 0" }}>
                        bookmark
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

    </div>
  );
};

export default Dashboard;