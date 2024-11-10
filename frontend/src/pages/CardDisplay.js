import React, {useEffect, useState } from 'react';
import commentsIcon from './media/comments-icon.png';
import mapIcon from './media/location-icon.png';
//----------------------------------------------------------------------

// Function to format the time into a relative "time ago" format
const formatTimeAgo = (timestamp) => {
    const currentTime = new Date();
    const postedTime = new Date(timestamp);
    const differenceInSeconds = Math.floor((currentTime - postedTime) / 1000);

    if (differenceInSeconds < 60) {
        return `${differenceInSeconds} second${differenceInSeconds !== 1 ? 's' : ''} ago`;
    } else if (differenceInSeconds < 3600) {
        const minutes = Math.floor(differenceInSeconds / 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
        const hours = Math.floor(differenceInSeconds / 3600);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
}

// Manages card and modal states
// Posting and modal creates card and modal and opens modal when card clicked
function PostingAndModal({card}) {
    const [isModalActive, setIsModalActive] = useState(false);

    // sets isModalActive to true to signal modal opening
    const handleCardClick = () => {
        setIsModalActive(true);
    };

    console.log(card)
    return (
        <div>
            <Card onClick={handleCardClick} card = {card} />
            {isModalActive && 
            <Modal card = {card} setIsModalActive= {setIsModalActive}/>
            }
        </div>
    );
}

// Function that displays card for the dashboard
function Card({ onClick, card }) {
    return (
        <div key={card.card_id} className="card" onClick = {onClick}>
            <div 
                className="card-image"
                style={{ backgroundImage: `url(${card.photo_url})`}}
            >
            </div>
            <div className="card-content">
                <h3>{card.title}</h3>
                <p><b>Location:</b> {card.location}</p>
                <p><b>Dietary Preferences:</b> {card.dietary_tags.join(', ')}</p>
                <p><b>Allergens:</b> {card.allergies.join(', ')}</p>
                <p className="posted-at">Posted {formatTimeAgo(card.posted_at)}</p>
            </div>
        </div>
    );
}

// Function that display all card information for the modal
function Modal({card, setIsModalActive}) {
    const [commentsIsActive, setCommentsIsActive] = useState(false)
     
    // maps will be implemented later, but state must be changed when
    // comments button is clicked

    const [mapsIsActive, setMapsIsActive] = useState(false)

    function handleCommentsButtonClick() {
        setCommentsIsActive(true)
        setMapsIsActive(false)
    }

    function CommentsSection({card_id}) {
        const [comments, setComments] = useState([])

        // Hook that fetches comments data from backend
        useEffect(() => {
            const fetchComments = async () => {
                try{
                    // Fetch and wait for card data from backend
                    const response = await fetch(`/api/comments/${card_id}`);
                    const data = await response.json();
                    // Store fetched data in state
                    setComments(data);
                } catch(error) {
                    console.error('Error fetching cards:', error);
                }
            };
            fetchComments();
        }, []);

        return (
        <div className='modal-comments-section'>
            {
                comments.map((comment_info) => (
                    <div className='modal-comment'>
                        <p>{comment_info.net_id}</p>
                        <p>blah</p>
                        <p>"{comment_info.comment}"</p>
                    </div>
                )
                )
            }
        </div>
        )
    }

    return (
        // Clicking outside modal allows it to close, hence having modal root
        <div onClick={function() {setIsModalActive(false)}} className="modal-root">
            {/* Stopping event propagation prevents clicks inside modal from closing it */}
            <div className = 'modal-card' onClick = {e => e.stopPropagation()}>
                <div className="modal-card-image" style={{ backgroundImage: `url(${card.photo_url})`}} />
                <div className="modal-card-content">
                    <h3>{card.title}</h3>
                    <p><b>Location:</b> {card.location}</p>
                    <p><b>Dietary Preferences:</b> {card.dietary_tags.join(', ')}</p>
                    <p><b>Allergens:</b> {card.allergies.join(', ')}</p>
                    <p><b>Description:</b> {card.description}</p>
                </div>
                <div className = 'modal-footer'>
                    <div className = 'modal-icons'>
                        <button className = "comments-button" onClick = {handleCommentsButtonClick}>
                                <img src={commentsIcon} alt="Comments" height="15px" />
                        </button>
                        <button className= "location-button">
                            <img src={mapIcon} alt="Map" height="15px" />
                        </button>
                    </div>
                    <div><p className="posted-at">Posted {formatTimeAgo(card.posted_at)}</p></div>
                </div> 
                {
                    commentsIsActive && <CommentsSection card_id={card.card_id}/>
                }

            </div>
        </div>
    );
}

export default PostingAndModal;