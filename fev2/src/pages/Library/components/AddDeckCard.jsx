import React from 'react';
import { useNavigate } from 'react-router-dom';

const AddDeckCard = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="add-deck-card"
      onClick={() => navigate('/create-deck')}
    >
      <div className="add-deck-content">
        <div className="add-icon-wrapper">
          <span className="material-symbols-outlined">add</span>
        </div>
        <h3>Create New Deck</h3>
        <p>Start a new learning journey</p>
      </div>
    </div>
  );
};

export default AddDeckCard;