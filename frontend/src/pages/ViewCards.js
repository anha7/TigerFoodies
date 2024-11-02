// src/pages/ViewCards.js

//----------------------------------------------------------------------

// Imports
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ViewCards.css'; // Import custom CSS file
import matheyImage from './media/mathey.png';

//----------------------------------------------------------------------

const ViewCards = () => {
    // State to store fetched cards
    const [net_id, setUserId] = useState("");
    const [cards, setCards] = useState([]);
    const navigate = useNavigate();

//----------------------------------------------------------------------

    // Fetch net_id when the component loads
    useEffect(() => {
        fetch(`/get_user`)
            .then(response => response.json())
            .then(data => {
                if (data.net_id) {
                    setNetID(data.net_id);
                } else {
                    // window.location.href = '/'; // Redirect to homepage if not authenticated
                }
            })
            .catch(error => {
                console.error('Error fetching net_id:', error);
                // window.location.href = '/';
            })
    }, []);

//----------------------------------------------------------------------

    // Send request to fetch user's cards from the back-end
    const fetchUserCards = async () => {
        try {
            const response = await fetch(`/api/cards/${net_id}`, {
                method: 'GET'
            });
            const data = await response.json();
            setCards(data);
        } catch (error) {
            console.error('Error fetching user cards:', error);
        }
    };

    // Handle sending net_id to the backend to retrieve cards
    const handleSendNetId = async () => {
        await fetchUserCards();
    }

//----------------------------------------------------------------------

    // Send request to delete cards
    const handleDeleteCard = async (card_id) => {
        try {
            const response = await fetch(`/api/cards/${card_id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setCards(cards.filter((card) => card.card_id !== card_id));
            } else {
                console.warn('Backend delete endpoint not available.');
            }
        } catch (error) {
            console.error('Error deleting card:', error);
        }
    };

//----------------------------------------------------------------------

    // Handle editing cards
    const handleEditCard = (cardId) => {
        navigate(`/edit/${cardId}`, {state: {cardId}});
    };

//----------------------------------------------------------------------

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
                {/* Page name */}
                <div className="page-name"> <h2> My Cards </h2> </div>
                
                {/* Display list of user's free food cards */}
                <div className="viewcards-card-list">
                    {cards.map((card) => (
                        <div className='viewcards-container'>
                            <div key={card.card_id} className="card">
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
                            {/* Makes the edit and delete buttons */}
                            <div className="card-actions">
                                <button 
                                    className="edit-button"
                                    onClick={() => handleEditCard(card.card_id)}
                                >
                                    EDIT
                                </button>
                                <button 
                                    className="delete-button"
                                    onClick={() => handleDeleteCard(card.card_id)}
                                >
                                    DELETE
                                </button>
                            </div>
                        </div>
                    ))}
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