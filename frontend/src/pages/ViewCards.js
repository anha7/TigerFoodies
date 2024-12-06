//----------------------------------------------------------------------
// ViewCards.js
// Authors: Anha Khan, Arika Hassan, Laiba Ali, Mark Gazzerro, Sami Dalu
//----------------------------------------------------------------------

// Import statements
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './ViewCards.css';
import CardDisplay from './CardDisplay';
import editIcon from './media/edit.svg';
import deleteIcon from './media/delete.svg';

//----------------------------------------------------------------------

const ViewCards = ({ net_id }) => {
    // State to list of cards fetched from the backend
    const [cards, setCards] = useState([]);
    // Navigation hook for redirecting users
    const navigate = useNavigate();
    // Ref to store interval ID for periodic polling
    const intervalIDRef = useRef(null)
//----------------------------------------------------------------------

    // Fetch user's cards from the backend when component mounts
    useEffect(() => {
        const fetchUserCards = async () => {
            try {
                let response;
                // If user is an admin, fetch all cards
                if (net_id == 'cs-tigerfoodies') {
                    response = await fetch(`/api/cards`);
                } else {
                    // If user is not an admin, fetch only their cards
                    response = await fetch(`/api/cards/${net_id}`, {
                        method: 'GET'
                    });
                }

                // Parse response data and update the state
                const data = await response.json();
                setCards(data);
            } catch (error) {
                // Otherwise catch error
                console.error('Error fetching user cards:', error);
            }
        };

        // Initial fetch
        fetchUserCards();
        
        // Poll the server for update card data every 60 seconds
        const startPolling = () => {
            intervalIDRef.current = setInterval(fetchUserCards, 60000)
        };
        startPolling();

        // Clean up the interval on component unmount
        return () => {
            if (intervalIDRef.current) {
                clearInterval(intervalIDRef.current);
            }
        }
    }, [net_id]);

//----------------------------------------------------------------------

    // Handle deletion of a card
    const handleDeleteCard = async (card_id) => {
        try {
            // Send a delete request to the server
            const response = await fetch(`/api/cards/${card_id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                // Remove deleted card from the state
                setCards(cards.filter((card) => 
                    card.card_id !== card_id));
            } else {
                // Warn if endpoint is not available
                console.warn('Backend delete endpoint not available.');
            }
        } catch (error) {
            // Catch any errors related to deleting a card
            console.error('Error deleting card:', error);
        }
    };

//----------------------------------------------------------------------

    // Handle navigation to the card editing page
    const handleEditCard = (card_id) => {
        navigate(`/edit/${card_id}`);
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
                <div className="page-name"> 
                    <h2>
                        {net_id === 'cs-tigerfoodies' ? 'All Cards' : 'My Cards'}
                    </h2> 
                </div>
                
                {/* Display list of user's free food cards */}
                <div className="viewcards-card-list">
                    {cards.map((card) => (
                        <div className='viewcards-container'>
                            {/* Displays the edit and delete buttons */}
                            <div className="card-actions">
                                <button className="edit-button" onClick={() => handleEditCard(card.card_id)}>
                                    <img src={editIcon}
                                        alt="editIcon"
                                        height="14px" 
                                    />
                                </button>
                                <button className="delete-button" onClick={() => handleDeleteCard(card.card_id)}>
                                    <img src={deleteIcon}
                                        alt="deleteIcon" 
                                        height="17px"
                                    />
                                </button>
                            </div>

                            {/* Card content rendered by the */}
                            {/* CardDisplay component */}
                            <CardDisplay card = {card} 
                                net_id={net_id}
                            />
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