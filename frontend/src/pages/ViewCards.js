//----------------------------------------------------------------------
// ViewCards.js
// Authors: Anha Khan, Arika Hassan, Laiba Ali, Mark Gazzerro, Sami Dalu
//----------------------------------------------------------------------

// Imports
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './ViewCards.css'; // Import custom CSS file
import CardDisplay from './CardDisplay'; // To view extended card info
import editIcon from './media/edit.svg';
import deleteIcon from './media/delete.svg';
import { socket } from '../Socket';

//----------------------------------------------------------------------

const ViewCards = ({ net_id }) => {
    // State to store fetched cards
    const [cards, setCards] = useState([]);
    const navigate = useNavigate();

//----------------------------------------------------------------------

    // Send request to fetch user's cards from the back-end
    useEffect(() => {
        const fetchUserCards = async () => {
            try {
                let response;
                if (net_id == 'cs-tigerfoodies') { // Grant cs-tigerfoodies admin perms
                    response = await fetch(`/api/cards`);
                } else {
                    response = await fetch(`/api/cards/${net_id}`, {
                        method: 'GET'
                    });
                }
                const data = await response.json();
                setCards(data);
            } catch (error) {
                console.error('Error fetching user cards:', error);
            }
        };

        fetchUserCards();

        // Fetch cards again if there are updates from the server
        socket.on("card created", () => fetchUserCards());
        socket.on("card edited", () => fetchUserCards());
        socket.on("card deleted", () => fetchUserCards());

        // Close socket whenever component is dismounted
        return () => {
            socket.off('card created', setCards);
            socket.off('card edited', setCards);
            socket.off('card deleted', setCards);
        };
    }, [net_id]);

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
                <div className="page-name"> <h2>{net_id === 'cs-tigerfoodies' ? 'All Cards' : 'My Cards'}</h2> </div>
                
                {/* Display list of user's free food cards */}
                <div className="viewcards-card-list">
                    {cards.map((card) => (
                        <div className='viewcards-container'>
                            {/* Makes the edit and delete buttons */}
                            <div className="card-actions">
                                <button className="edit-button" onClick={() => handleEditCard(card.card_id)}>
                                    <img src={editIcon} alt="editIcon" height="14px" />
                                </button>
                                <button className="delete-button" onClick={() => handleDeleteCard(card.card_id)}>
                                    <img src={deleteIcon} alt="deleteIcon" height="17px" />
                                </button>
                            </div>
                            {/* Get card info */}
                            <CardDisplay card = {card}/>
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