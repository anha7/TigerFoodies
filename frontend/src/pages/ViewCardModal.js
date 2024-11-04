// src/pages/ViewCardModal.js

//----------------------------------------------------------------------

// Imports
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ViewCardModal.css'; // Import custom CSS file

  
  return (
    <div className='modal'>
      <div key={card.card_id} className="modal-card">
          <button onClick>Close Modal</button>
          <div 
              className="modal-card-image"
              style={{ backgroundImage: `url(${card.photo_url})`}}
          >
          </div>
          <div className="modal-card-content">
              <h3>{card.title}</h3>
              <p>Location: {card.location}</p>
              <p>Dietary Restrictions: {card.dietary_tags.join(', ')}</p>
              <p>Allergens: {card.allergies.join(', ')}</p>
              <p className="posted-at">Posted at {card.posted_at}</p>
          </div>
      </div>
      </div>
  );