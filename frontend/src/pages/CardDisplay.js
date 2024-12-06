//----------------------------------------------------------------------
// CardDisplay.js
// Authors: Anha Khan, Arika Hassan, Laiba Ali, Mark Gazzerro, Sami Dalu
//----------------------------------------------------------------------

// Import statements
import React, { useEffect, useState, useCallback, useRef } from 'react';
import commentsIcon from './media/comment.svg';
import mapIcon from './media/location.svg';
import locationIcon from './media/description-location.svg';
import dietaryPreferencesIcon from './media/dietary-preferences.svg';
import allergensIcon from './media/allergens.svg';
import backIcon from './media/back.svg';

//----------------------------------------------------------------------

// Utility function to format the time into a relative "time ago" format
const formatTimeAgo = (timestamp) => {
    // Current time
    const currentTime = new Date();
    // Posted time from the timestamp
    const postedTime = new Date(timestamp); 
    // Calculate time difference in seconds
    const differenceInSeconds = Math.floor(
        (currentTime - postedTime) / 1000);
    
    // Return time in appropriate format: seconds, minutes, or hours ago
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

// Main component to display a card and its modal
function CardDisplay({ card, net_id }) {
    // State to track modal visibility
    const [isModalActive, setIsModalActive] = useState(false);
    // Handle card click to show modal
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

// Component to render an individual card
function Card({ onClick, card }) {  
    return (
        <div key={card.card_id} className="card" onClick={onClick}>
            {/* Background image of modal is of the food */}
            <div
                className="card-image"
                style={(card.photo_url && card.photo_url !== "null" &&
                    {backgroundImage: (`url(${card.photo_url})`) })}
            ></div>

            {/* Shorthand information related to food */}
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

                {/* Footer contains posted at time */}
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

// Modal component to display card details and additional options
function Modal({ card, setIsModalActive, net_id }) {
    // State for comments visibility
    const [commentsIsActive, setCommentsIsActive] = useState(false);
    // State for map modal visibility
    const [mapModalActive, setMapModalActive] = useState(false);

    // Handle location button click to open map modal
    const handleLocationClick = () => {
        setMapModalActive(true);
    };
    // Toggle visibiliy of comments section
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
                {/* Background image of modal is of the food */}
                <div
                    className="modal-card-image"
                    style={(card.photo_url && {backgroundImage: `url(${card.photo_url})`})}
                />

                {/* Information related to the food */}
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

                    {/* Footer of modal contains comments and location */}
                    {/* functionality, as well as posted at time */}
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

            {/* Location modal component  */}
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

// Component to manage and display the comments section
function CommentsSection({ card_id, net_id }) {
    // State to store fetched comments
    const [comments, setComments] = useState([]);
    // State to manage the new comment input
    const [newComment, setNewComment] = useState('');
    // Ref that stores interval ID of polling timer
    const intervalIDRef = useRef(null)
    
    // Function to fetch comments from the server
    const fetchComments = useCallback(async () => {
        try {
            // Fetch comments for a specfic card
            const response = await fetch(`/api/comments/${card_id}`);
            const data = await response.json();
            if (Array.isArray(data)) {
                // Update statew with fetch comments
                setComments(data);
            } else {
                // Otherwise return an error
                console.error('Error fetching comments:', data.message 
                    || 'Unknown error');
            }
        } catch (error) {
            // Catch any errors related to fetching a card's comments
            console.error('Error fetching comments:', error);
        }
    }, [card_id]);

    // Effect to fetch comments when the component mounts
    useEffect(() => {
        fetchComments(); // Initial fetch of comments

        // Set up polling to refresh comments every 60 seconds
        const startPolling = () => {
            intervalIDRef.current = setInterval(fetchComments, 60000)
        };

        startPolling();

        // Clean up the interval on component unmount
        return () => {
            if (intervalIDRef.current) {
                clearInterval(intervalIDRef.current);
            };
        }
    }, [card_id, fetchComments]);

    // Function to handle posting a new comment
    const handleCommentPosting = async (e) => {
        // Prevent form submission from freshing the page
        e.preventDefault();

        // Prepare new comment data
        const newCommentData = { comment: newComment, net_id };

        try {
            // Send new comment data to server
            const response = await fetch(`/api/comments/${card_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newCommentData),
            });

            if (response.ok) {
                setNewComment(''); // Clear the input field
                fetchComments(); // Refresh comments after posting
            } else {
                // Otherwise display error
                console.error('Error creating new comment');
            }
        } catch (error) {
            // Display any other errors related to comment submission
            console.error('Error submitting the new comment:', error);
        }
    };

    // Limit character length of a comment
    const maxCommentLength = 200;

    return (
        <div className="modal-comments-section">
            {/* Comments section title */}
            <h3>Comments</h3> 

            {/* All comments of a card */}
            {comments.map((comment_info) => (
                <div className="modal-comment" key={comment_info.posted_at}>
                    <h4>{comment_info.net_id} · {formatTimeAgo(comment_info.posted_at)}</h4>
                    <p>{comment_info.comment}</p>
                </div>
            ))}

            {/* Comment submission form */}
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

// Component to render a modal with an embedded map
function MapModal({ latitude, longitude, setMapModalActive }) {
    // Function to close the map model
    const handleBackClick = () => {
        setMapModalActive(false);
    }

    // Google maps embed URL, dynamically constructed with provided
    // latitude and longitude
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
                    // Close modal when clicking outside of it
                    setMapModalActive(false);
                }
            }}
        >
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Location section title */}
                <div className="map-title">
                    <h2>Location of Food</h2>
                </div>

                {/* Map embed of food location */}
                <div className="map-embed">
                    <iframe
                        src={mapEmbedUrl}
                        title="Google Maps Location"
                        style={{ border: "none" }}
                        allowFullScreen
                    />
                </div>

                {/* Functionality to return to card modal */}
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
