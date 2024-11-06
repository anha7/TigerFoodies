import React, { useState } from 'react';

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

function PostingAndModal({card}) {
    const [isModalActive, setIsModalActive] = useState(false);

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

function Modal({card, setIsModalActive}) {
    return (
        <div onClick={function() {
            setIsModalActive(false)
        }} className="modal-root">
            <div className = 'modal-card' onClick = {e => e.stopPropagation()}>
                <div className='modal-card-top'>
                    <h1>{card.title}</h1>
                    <p className="posted-at">Posted {formatTimeAgo(card.posted_at)}</p>
                </div>
                <div 
                className="modal-card-image"
                style={{ backgroundImage: `url(${card.photo_url})`}}
                >
                </div>
                <h3>Location: {card.location}</h3>
                <h3>Dietary Restrictions: {card.dietary_tags.join(', ')}</h3>
                <h3>Allergens: {card.allergies.join(', ')}</h3>
                <h3>Description: {card.description}</h3>
            </div>
        </div>
    );
}

export default PostingAndModal;