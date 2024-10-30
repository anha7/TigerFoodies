// src/pages/ViewCards.js

//----------------------------------------------------------------------

// Imports
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ViewCards.css'; // Import custom CSS file
import matheyImage from './media/mathey.png';

const ViewCards = () => {
    // State to store fetched cards
    const [cards, setCards] = useState([]);
    const navigate = useNavigate();

    // Hook that fetches user's cards from the back-end
    useEffect(() => {
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
        <div className="viewcards">
            {/* Navigation Bar */}
            <nav className = "viewcards-navbar">
                <div className = "nav">
                    {/* Button that redirects to homepages */}
                    <a href="/"><h1>TigerFoodies</h1></a>
                </div>
            </nav>
            
            {/* Main content container for user's card dashboard */}
            <div className="viewcards-main">
                <div className="page-name"> <h2> My Cards </h2> </div>
                
                {/* Display list of user's free food cards */}
                <div className="viewcards-card-list">
                    {cards.map((card) => (
                        <div key={card.card_id} className="card" style={{ backgroundImage: `url(${card.photo_url})` }}>
                            <div 
                                className="card-image"
                                style={{ backgroundImage: `url(${card.photo_url})`}}
                            >
                            </div>
                            <div className="card-content">
                                <h3>{card.title}</h3>
                                <p>Location: {card.location}</p>
                                <p>Dietary Restrictions: {card.dietary_tags.join(', ')}</p>
                                <p>Allergens: {card.allergies.join(', ')}</p>
                                <p className="posted-at">Posted at {card.posted_at}</p>
                            </div>
                        </div>
                    ))}

                    {/* Fake card for design purposes */}
                    <div className="viewcards-container">
                        {/* Displays card information */}
                        <div className="card">
                            <div 
                                className="card-image"
                                style={{ backgroundImage: `url(${matheyImage})`}}
                            >
                            </div>
                            <div className="card-content"> 
                                <h3>title</h3>
                                <p>location</p>
                                <p>dietary restrictions</p>
                                <p>allergens</p>
                                <p className="posted-at">posted at</p>
                            </div>
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
                    <div className="viewcards-container">
                        {/* Displays card information */}
                        <div className="card">
                            <div 
                                className="card-image"
                                style={{ backgroundImage: `url(${matheyImage})`}}
                            >
                            </div>
                            <div className="card-content"> 
                                <h3>title</h3>
                                <p>location</p>
                                <p>dietary restrictions</p>
                                <p>allergens</p>
                                <p className="posted-at">posted at</p>
                            </div>
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
                    <div className="viewcards-container">
                        {/* Displays card information */}
                        <div className="card">
                            <div 
                                className="card-image"
                                style={{ backgroundImage: `url(${matheyImage})`}}
                            >
                            </div>
                            <div className="card-content"> 
                                <h3>title</h3>
                                <p>location</p>
                                <p>dietary restrictions</p>
                                <p>allergens</p>
                                <p className="posted-at">posted at</p>
                            </div>
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
                    <div className="viewcards-container">
                        {/* Displays card information */}
                        <div className="card">
                            <div 
                                className="card-image"
                                style={{ backgroundImage: `url(${matheyImage})`}}
                            >
                            </div>
                            <div className="card-content"> 
                                <h3>title</h3>
                                <p>location</p>
                                <p>dietary restrictions</p>
                                <p>allergens</p>
                                <p className="posted-at">posted at</p>
                            </div>
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
                    <div className="viewcards-container">
                        {/* Displays card information */}
                        <div className="card">
                            <div 
                                className="card-image"
                                style={{ backgroundImage: `url(${matheyImage})`}}
                            >
                            </div>
                            <div className="card-content"> 
                                <h3>title</h3>
                                <p>location</p>
                                <p>dietary restrictions</p>
                                <p>allergens</p>
                                <p className="posted-at">posted at</p>
                            </div>
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
                    <div className="viewcards-container">
                        {/* Displays card information */}
                        <div className="card">
                            <div 
                                className="card-image"
                                style={{ backgroundImage: `url(${matheyImage})`}}
                            >
                            </div>
                            <div className="card-content"> 
                                <h3>title</h3>
                                <p>location</p>
                                <p>dietary restrictions</p>
                                <p>allergens</p>
                                <p className="posted-at">posted at</p>
                            </div>
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
            </div>

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