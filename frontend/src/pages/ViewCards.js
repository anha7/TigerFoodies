// src/pages/ViewCards.js

//----------------------------------------------------------------------

// Imports
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ViewCards.css'; // Import custom CSS file
import matheyImage from './media/mathey.png';

//  Gets time and gives greeting
const getGreeting = () => {
  const currentDate = new Date();

  // Convert UTC time to Eastern Time (Princeton's timezone)
  const estOffset = -5;
  const edtOffset = -4; // Different offset for daylight savings

  // Checks whether it is currently daylight savings time
  const isDaylightSaving = currentDate.toLocaleString(
      'en-US', { timeZoneName: 'short'}).includes('EDT');
  const offset = isDaylightSaving ? edtOffset : estOffset;

  // Adjusts timezone to Eastern Time
  const timeOfDay = new Date(
      currentDate.getTime() + offset * 60 * 60 * 1000).getUTCHours();

  // Checks current time of day
  if (timeOfDay >= 0 && timeOfDay < 12) {
    return "Good morning";
  } else if (timeOfDay >= 12 && timeOfDay < 17) {
    return "Good afternoon";
  } else {
    return "Good evening";
  }
};

const ViewCards = () => {
  // State to store fetched cards
  const [cards, setCards] = useState([]);
  // State that stores greeting to reflect time of day
  const [greeting, setGreeting] = useState('');
  const navigate = useNavigate();

  // Hook that fetches card data from the backend and sets greeting
  useEffect(() => {
    setGreeting(getGreeting());

    const fetchCards = async () => {
        try{
            // Fetch and wait for card data from backend
            const response = await fetch('/api/cards');
            const data = await response.json();
            // Store fetched data in state
            setCards(data);
        } catch(error) {
            console.error('Error fetching cards:', error);
        }
    };

    fetchCards();
  }, []);

  // Handle deleting cards
  const handleDeleteCard = async (cardId) => {
    try {
      const response = await fetch(`/api/cards/${cardId}`, { method: 'DELETE' });
      if (response.ok) {
      setCards(cards.filter(card => card.card_id !== cardId));
      } else {
        console.warn('Backend delete endpoint not available.')
      }
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  // Handle editing carda
  const handleEditCard = (cardId) => {
    navigate(`/edit/${cardId}`, {state: {cardId}});
};

  return (
    <div className="homepage">
      {/* Navigation Bar */}
      <nav className = "navigationbar">
        {/* Div to organize items on the left of the navbar */}
        <a href="/"><h1>TigerFoodies</h1></a>
          {/* Placeholder for netid login*/}
      <div className="login-box">
      <button className="login-button">Login</button>
      <input type='text' />
      </div>
      </nav>
      <h2> My Cards </h2>
      <main>

      {/* Display list of active free food cards */}
      <div className="viewcards-card-list">
        {cards.map((card) => (
            <div key={card.card_id} className="viewcards-card" style={{ backgroundImage: `url(${card.photo_url})` }}>
                <div 
                    className="viewcards-card-image"
                    style={{ backgroundImage: `url(${card.photo_url})`}}
                >
                </div>
                <div className="viewcards-card-content">
                    <h3>{card.title}</h3>
                    <p>Location: {card.location}</p>
                    <p>Dietary Restrictions: {card.dietary_tags.join(', ')}</p>
                    <p>Allergens: {card.allergies.join(', ')}</p>
                    <p className="posted-at">Posted at {card.posted_at}</p>
                </div>
            </div>
        ))}
        {/* Fake card for design purposes */}
        {/* Makes the card */}
        <div className="viewcards-card">
            <div 
                className="viewcards-card-image"
                style={{ backgroundImage: `url(${matheyImage})`}}
            >
            </div>
            <div className="viewcards-card-content"> 
                <h3>title</h3>
                <p>location</p>
                <p>dietary restrictions</p>
                <p>allergens</p>
                <p className="posted-at">posted at</p>
            </div>
            {/* Makes the edit and delete buttons */}
        <div className="card-actions">
                <button 
                    className="edit-button"
                    onClick={() => handleEditCard(cards.card_id)}
                >
                    EDIT
                </button>
                <button 
                    className="delete-button"
                    onClick={() => handleDeleteCard(cards.card_id)}
                >
                    DELETE
                </button>
            </div>
        </div>
        {/* Fake card for design purposes */}
        <div className="viewcards-card">
            <div 
                className="viewcards-card-image"
                style={{ backgroundImage: `url(${matheyImage})`}}
            >
            </div>
            <div className="viewcards-card-content"> 
                <h3>title</h3>
                <p>location</p>
                <p>dietary restrictions</p>
                <p>allergens</p>
                <p className="posted-at">posted at</p>
            </div>
            {/* Makes the edit and delete buttons */}
        <div className="card-actions">
                <button 
                    className="edit-button"
                    onClick={() => handleEditCard(cards.card_id)}
                >
                    EDIT
                </button>
                <button 
                    className="delete-button"
                    onClick={() => handleDeleteCard(cards.card_id)}
                >
                    DELETE
                </button>
            </div>
        </div>
        {/* Fake card for design purposes */}
        {/* Makes the card */}
        <div className="viewcards-card">
            <div 
                className="viewcards-card-image"
                style={{ backgroundImage: `url(${matheyImage})`}}
            >
            </div>
            <div className="viewcards-card-content"> 
                <h3>title</h3>
                <p>location</p>
                <p>dietary restrictions</p>
                <p>allergens</p>
                <p className="posted-at">posted at</p>
            </div>
            {/* Makes the edit and delete buttons */}
        <div className="card-actions">
                <button 
                    className="edit-button"
                    onClick={() => handleEditCard(cards.card_id)}
                >
                    EDIT
                </button>
                <button 
                    className="delete-button"
                    onClick={() => handleDeleteCard(cards.card_id)}
                >
                    DELETE
                </button>
            </div>
        </div>
        {/* Fake card for design purposes */}
        {/* Makes the card */}
        <div className="viewcards-card">
            <div 
                className="viewcards-card-image"
                style={{ backgroundImage: `url(${matheyImage})`}}
            >
            </div>
            <div className="viewcards-card-content"> 
                <h3>title</h3>
                <p>location</p>
                <p>dietary restrictions</p>
                <p>allergens</p>
                <p className="posted-at">posted at</p>
            </div>
            {/* Makes the edit and delete buttons */}
        <div className="card-actions">
                <button 
                    className="edit-button"
                    onClick={() => handleEditCard(cards.card_id)}
                >
                    EDIT
                </button>
                <button 
                    className="delete-button"
                    onClick={() => handleDeleteCard(cards.card_id)}
                >
                    DELETE
                </button>
            </div>
        </div>
    </div>
    </main>

    {/* Footer */}
    <footer>
        <p>
        Created by Anha Khan '26, Arika Hassan '26, Laiba Ali '26, Mark Gazzerro '25, Sami Dalu '27
        </p>
    </footer>

    </div>
  );
};

export default ViewCards;