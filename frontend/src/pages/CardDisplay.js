//----------------------------------------------------------------------
// CardDisplay.js
// Authors: Anha Khan, Arika Hassan, Laiba Ali, Mark Gazzerro, Sami Dalu
//----------------------------------------------------------------------

import React, { useEffect, useState, useCallback, useRef } from 'react';
import commentsIcon from './media/comment.svg';
import mapIcon from './media/location.svg';
import locationIcon from './media/description-location.svg';
import dietaryPreferencesIcon from './media/dietary-preferences.svg';
import allergensIcon from './media/allergens.svg';
import backIcon from './media/back.svg';

//----------------------------------------------------------------------

// Function to format the time into a relative "time ago" format
const formatTimeAgo = (timestamp) => {
    const currentTime = new Date();
    const postedTime = new Date(timestamp);
    const differenceInSeconds = Math.floor(
        (currentTime - postedTime) / 1000);

    if (differenceInSeconds < 60) {
        return `${differenceInSeconds} second${
            differenceInSeconds !== 1 ? 's' : ''} ago`;
    } else if (differenceInSeconds < 3600) {
        const minutes = Math.floor(differenceInSeconds / 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
        const hours = Math.floor(differenceInSeconds / 3600);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
};

//----------------------------------------------------------------------

// Displays a card and manages modal state
function CardDisplay({ card, net_id }) {
    const [isModalActive, setIsModalActive] = useState(false);

    const handleCardClick = useCallback(() => {
        setIsModalActive(true);
    }, []);

    return (
        <div className="card-and-modal-container">
            <Card onClick={handleCardClick} card={card} />
            {isModalActive && (
                <Modal card={card}
                    setIsModalActive={setIsModalActive}
                    net_id={net_id} 
                />
            )}
        </div>
    );
};

//----------------------------------------------------------------------

// Component for rendering individual cards
function Card({ onClick, card }) {
    return (
        <div key={card.card_id} className="card" onClick={onClick}>
            <div
                className="card-image"
                style={{ backgroundImage: `url(${card.photo_url})` }}
            ></div>
            <div className="card-content">
                <div className="card-content-main">
                    <h3>{card.title}</h3>
                    <p>
                        <img src={locationIcon}
                            alt="Location"
                            height="14px" /> 
                        {card.location}
                    </p>
                    <p>
                        <img src={dietaryPreferencesIcon} 
                            alt="Dietary Preferences"
                            height="14px" />
                        {card.dietary_tags?.join(', ') || ' '}
                    </p>
                    <p>
                        <img src={allergensIcon}
                            alt="Allergens"
                            height="14px" /> 
                        {card.allergies?.join(', ') || ' '}
                    </p>
                </div>
                <div className="card-content-footer">
                    <p className="posted-at">
                        Posted {formatTimeAgo(card.posted_at)}
                    </p>
                </div>
            </div>
        </div>
    );
};

//----------------------------------------------------------------------

// Modal component for displaying card details and comments
function Modal({ card, setIsModalActive, net_id }) {
    const [commentsIsActive, setCommentsIsActive] = useState(false);
    const [mapModalActive, setMapModalActive] = useState(false);

    const handleLocationClick = () => {
        setMapModalActive(true);
    };

    const handleCommentsButtonClick = () => {
        setCommentsIsActive(!commentsIsActive);
    };

    return (
        <div
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    setIsModalActive(false);
                }
            }}
            className={`modal-root ${mapModalActive ? 'no-overlay' : ''}`}
        >
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div
                    className="modal-card-image"
                    style={{ backgroundImage: `url(${card.photo_url})` }}
                />
                <div className="modal-card-content">
                    <div className="main-modal-content">
                        <h3>{card.title}</h3>
                        <p>
                            <b>Location:</b> {card.location}
                        </p>
                        <p>
                            <b>Preferences:</b> {card.dietary_tags?.join(', ') || 'None'}
                        </p>
                        <p>
                            <b>Allergens:</b> {card.allergies?.join(', ') || 'None'}
                        </p>
                        <p>
                            <b>Description:</b> {card.description}
                        </p>
                    </div>
                    <div className="modal-footer">
                        <div className="modal-icons">
                            <button className="comments-button" onClick={handleCommentsButtonClick}>
                                <img src={commentsIcon} 
                                    alt="Comments" 
                                    height="15px" />
                            </button>
                            {card.net_id !== 'cs-tigerfoodies' && (
                                <button className="location-button" onClick={handleLocationClick}>
                                    <img src={mapIcon} 
                                        alt="Map" 
                                        height="15px" />
                                </button>
                            )}
                        </div>
                        <div>
                            <p className="posted-at">
                                Posted {formatTimeAgo(card.posted_at)}
                            </p>
                        </div>
                    </div>
                    <div className="comments-portion">
                        {commentsIsActive && (
                            <CommentsSection
                                card_id={card.card_id}
                                net_id={net_id}
                            />
                        )}
                    </div>
                </div>
            </div>
            {mapModalActive && (
                <MapModal
                    latitude={card.latitude}
                    longitude={card.longitude}
                    setMapModalActive={setMapModalActive}
                />
            )}
        </div>
    );
};

//----------------------------------------------------------------------

// Component for managing and displaying comments
function CommentsSection({ card_id, net_id }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    // Ref that stores interval ID of polling timer
    const intervalIDRef = useRef(null)
    
    // Function to fetch comments from the server
    const fetchComments = useCallback(async () => {
        try {
            const response = await fetch(`/api/comments/${card_id}`);
            const data = await response.json();
            if (Array.isArray(data)) {
                setComments(data);
            } else {
                console.error('Error fetching comments:', data.message 
                    || 'Unknown error');
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    }, [card_id]);

    // Effect to fetch comments initially
    useEffect(() => {
        fetchComments(); // Fetch comments when the component mounts

        // fetches cards from the backend every 60 seconds
        const startPolling = () => {
            intervalIDRef.current = setInterval(fetchComments, 60000)
        };

        startPolling();

        // Clean up the interval id on unmount
        return () => {
            if (intervalIDRef.current) {
                clearInterval(intervalIDRef.current);
            };
        }
    }, [card_id, fetchComments]);

    // Function to handle posting a new comment
    const handleCommentPosting = async (e) => {
        e.preventDefault();

        const newCommentData = { comment: newComment, net_id };

        try {
            const response = await fetch(`/api/comments/${card_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newCommentData),
            });

            if (response.ok) {
                setNewComment(''); // Clear the input field
                fetchComments(); // fetch again so user can see theirs
            } else {
                console.error('Error creating new comment');
            }
        } catch (error) {
            console.error('Error submitting the new comment:', error);
        }
    };

    const maxCommentLength = 200;

    return (
        <div className="modal-comments-section">
            <h3>Comments</h3>
            {comments.map((comment_info) => (
                <div className="modal-comment" key={comment_info.posted_at}>
                    <h4>{comment_info.net_id} · {formatTimeAgo(comment_info.posted_at)}</h4>
                    <p>{comment_info.comment}</p>
                </div>
            ))}
            <form className="comment-form" onSubmit={handleCommentPosting}>
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => {
                        if (e.target.value.length <= maxCommentLength) {
                            setNewComment(e.target.value);
                        }
                    }}
                    placeholder="Add comment..."
                    required
                />
                <button>Post</button>
            </form>
        </div>
    );
}

//----------------------------------------------------------------------

// Component for map modal
function MapModal({ latitude, longitude, setMapModalActive }) {
    const handleBackClick = () => {
        setMapModalActive(false);
    }

    const mapEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=
        ${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
        &q=${latitude},${longitude}
        &center=${latitude},${longitude}
        &zoom=15`;

    return (
        <div
            className="modal-root"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    setMapModalActive(false);
                }
            }}
        >
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="map-title">
                    <h2>Location of Food</h2>
                </div>
                <div className="map-embed">
                    <iframe
                        src={mapEmbedUrl}
                        title="Google Maps Location"
                        style={{ border: "none" }}
                        allowFullScreen
                    />
                </div>
                <div className="map-close">
                    <button onClick={handleBackClick}>
                        <img src={backIcon} height="18px"/>
                    </button>
                </div>
            </div>
        </div>
    );
}

//----------------------------------------------------------------------

export default CardDisplay;
