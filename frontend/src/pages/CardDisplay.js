import React, { useEffect, useState, useCallback, useRef } from 'react';
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
                <Modal card={card} setIsModalActive={setIsModalActive} net_id={net_id} />
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
                    <p><b>Location:</b> {card.location}</p>
                    <p><b>Dietary Preferences:</b> {card.dietary_tags?.join(', ') || 'None'}</p>
                    <p><b>Allergens:</b> {card.allergies?.join(', ') || 'None'}</p>
                </div>
                <div className="card-content-footer">
                    <p className="posted-at">Posted {formatTimeAgo(card.posted_at)}</p>
                </div>
            </div>
        </div>
    );
};

//----------------------------------------------------------------------

// Modal Component for displaying card details and comments
function Modal({ card, setIsModalActive, net_id }) {
    const [commentsIsActive, setCommentsIsActive] = useState(false);
    const socket = useRef(io("http://127.0.0.1:5000"));

    const handleLocationClick = () => {
        if (card.location_url) {
            window.open(card.location_url, "_blank");
        } else {
            alert("No location link available.");
        }
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
            className="modal-root"
        >
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div
                    className="modal-card-image"
                    style={{ backgroundImage: `url(${card.photo_url})` }}
                />
                <div className="modal-card-content">
                    <div className="main-modal-content">
                        <h3>{card.title}</h3>
                        <p><b>Location:</b> {card.location}</p>
                        <p><b>Dietary Preferences:</b> {card.dietary_tags?.join(', ') || 'None'}</p>
                        <p><b>Allergens:</b> {card.allergies?.join(', ') || 'None'}</p>
                        <p><b>Description:</b> {card.description}</p>
                    </div>
                    <div className="modal-footer">
                        <div className="modal-icons">
                            <button className="comments-button" onClick={handleCommentsButtonClick}>
                                <img src={commentsIcon} alt="Comments" height="15px" />
                            </button>
                            {card.net_id !== 'cs-tigerfoodies' && (
                                <button className="location-button" onClick={handleLocationClick}>
                                    <img src={mapIcon} alt="Map" height="15px" />
                                </button>
                            )}
                        </div>
                        <div>
                            <p className="posted-at">Posted {formatTimeAgo(card.posted_at)}</p>
                        </div>
                    </div>
                    <div className="comments-portion">
                        {commentsIsActive && (
                            <CommentsSection
                                card_id={card.card_id}
                                net_id={net_id}
                                socket={socket.current}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

//----------------------------------------------------------------------

// Component for managing and displaying comments
function CommentsSection({ card_id, net_id, socket }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    const fetchComments = useCallback(async () => {
        try {
            const response = await fetch(`/api/comments/${card_id}`);
            const data = await response.json();
            if (Array.isArray(data)) {
                setComments(data);
            } else {
                console.error('Error fetching comments:', data.message || 'Unknown error');
                setComments([]);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    }, [card_id]);

    useEffect(() => {
        fetchComments();

        const handleNewComment = (card_of_new_comment) => {
            if (card_of_new_comment === card_id) {
                fetchComments();
            }
        };

        socket.on("comment created", handleNewComment);

        return () => {
            socket.off("comment created", handleNewComment);
        };
    }, [card_id, fetchComments, socket]);

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
                setNewComment('');
            } else {
                console.error('Error creating new comment');
            }
        } catch (error) {
            console.error('Error submitting the new comment:', error);
        }
    };

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
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add comment..."
                    required
                />
                <button type="submit">Post</button>
            </form>
        </div>
    );
}

//----------------------------------------------------------------------

export default CardDisplay;
