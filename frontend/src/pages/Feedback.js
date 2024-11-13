// Import stateemnts
import React, { useState } from 'react';

//----------------------------------------------------------------------

// Feedback functional component
const Feedback = ({ isModalActive, setIsModalActive, net_id }) => {
    const [feedbackInput, setFeedbackInput] = useState("");

    // Functional component to close modal
    const handleCloseModal = () => {
        setIsModalActive(false);
    }

    // Functional component to submit feedback to the backend
    const handleSubmit = async () => {
        // Send request to backend
        try {
            const response = await fetch(`/api/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ net_id: net_id, feedback: feedbackInput }),
            });

            // Parse JSON response
            const data = await response.json();

            if (data.success) {
                alert('Feedback sent successfully!');
                setFeedbackInput("");
                handleCloseModal();
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        }
    };

    return (
        <>
            {isModalActive && (
                <div className="modal-root" onClick={handleCloseModal}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="feedback-title">
                            <h2>Report Bugs</h2>
                        </div>
                        <form className="feedback-form">
                            <textarea
                                type="text"
                                placeholder="Report any bugs..."
                                onChange={e => setFeedbackInput(e.target.value)}
                                required
                            />
                            <button onClick={handleSubmit}>Submit</button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default Feedback