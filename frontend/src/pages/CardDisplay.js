import React, {useEffect, useState } from 'react';
import commentsIcon from './media/comments-icon.png';
import mapIcon from './media/location-icon.png';
import io from 'socket.io-client';
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
function CardDisplay({card, net_id}) {
    const [isModalActive, setIsModalActive] = useState(false);


    // sets isModalActive to true to signal modal opening
    const handleCardClick = () => {
        setIsModalActive(true);
    };

    return (
        <div className="card-and-modal-container">
            <Card onClick={handleCardClick} card = {card} />
            {isModalActive &&
            <Modal card={card} setIsModalActive={setIsModalActive} net_id={net_id}/>
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
                <div className="card-content-main">
                    <h3>{card.title}</h3>
                    <p><b>Location:</b> {card.location}</p>
                    <p><b>Dietary Preferences:</b> {card.dietary_tags.join(', ')}</p>
                    <p><b>Allergens:</b> {card.allergies.join(', ')}</p>
                </div>
                <div className="card-content-footer">
                    <p className="posted-at">Posted {formatTimeAgo(card.posted_at)}</p>
                </div>
            </div>
        </div>
    );
}


// Function that display all card information for the modal
function Modal({card, setIsModalActive, net_id}) {
    const [commentsIsActive, setCommentsIsActive] = useState(false)

    // connection to flask-socketio server
    const socket = io("http://127.0.0.1:5000") 
    // Function to handle location button click
    function handleLocationClick() {
        if (card.location_url) {
            window.open(card.location_url, "_blank"); // Opens in a new tab
        } else {
            alert("No location link available.");
        }
    }

    function handleCommentsButtonClick() {
        setCommentsIsActive(!commentsIsActive)
    }

    function CommentsSection({card_id, net_id}) {
        const [comments, setComments] = useState([])
        const [newComment, setNewComment] = useState('')

        // Hook that fetches comments data from backend
        useEffect(() => {
            const fetchComments = async () => {
                try{
                    // Fetch and wait for card data from backend
                    const response = await fetch(`/api/comments/${card_id}`);
                    const data = await response.json();
                    // Set card data
                    if (Array.isArray(data)) {
                        setComments(data);
                    } else {
                        console.error('Error fetching comments:', data.message || 'Unknown error');
                        setComments([]); // Set comments to an empty array if there’s an error
                    }
                } catch(error) {
                    console.error('Error fetching cards:', error);
                }
            };
            fetchComments();

            socket.on("comment created", card_of_new_comment => {
                if (card_of_new_comment === card_id) {
                    fetchComments()
                }
            })

            // Close socket whenever component is dismounted
            return () => socket.close()
        }, []);

        // Handles comment submission
        const handleCommentPosting = async (e) => {
            e.preventDefault(); // Prevent default form submission
           
            const newCommentData = {
                comment: newComment,
                net_id: net_id
            };
           
            try {
                const response = await fetch(`/api/comments/${card_id}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newCommentData), // Send card data as JSON
                });
   
                if (response.ok) {
                    setNewComment('');

                    const fetchComments = async () => {
                        try{
                            // Fetch and wait for card data from backend
                            const response = await fetch(`/api/comments/${card_id}`);
                            const data = await response.json();
                            // Set card data
                            if (Array.isArray(data)) {
                                setComments(data);
                            } else {
                                console.error('Error fetching comments:', data.message || 'Unknown error');
                                setComments([]); // Set comments to an empty array if there’s an error
                            }
                        } catch(error) {
                            console.error('Error fetching cards:', error);
                        }
                    };
                    fetchComments();
                } else {
                    console.error('Error creating new comment');
                }
            } catch (error) {
                console.error('Error submitting the new comment:', error);
            }
        }

        return (
            <div className='modal-comments-section'>
                <h3>Comments</h3>
                {/* Display all comments */}
                {comments.map((comment_info) => (
                    <div className='modal-comment'> 
                        <h4>{comment_info.net_id} · {formatTimeAgo(comment_info.posted_at)}</h4>
                        <p>{comment_info.comment}</p>
                    </div>
                ))}
                {/* Form to submit new comments */}
                <form className='comment-form'>
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder= "Add comment..."
                        required
                    />
                    <button onClick={handleCommentPosting}>Post</button>
                </form>
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
                    <div className = 'main-modal-content'>
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
                            { card.net_id != 'cs-tigerfoodies' && (
                                <button className= "location-button" onClick={handleLocationClick}>
                                    <img src={mapIcon} alt="Map" height="15px" />
                                </button>
                            )
                            }
                        </div>
                        <div><p className="posted-at">Posted {formatTimeAgo(card.posted_at)}</p></div>
                    </div>
                    <div className='comments-portion'>
                        {commentsIsActive && <CommentsSection card_id={card.card_id} net_id={net_id}/>}
                    </div>
                </div>
            </div>
        </div>
    );
}


export default CardDisplay;