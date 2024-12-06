//----------------------------------------------------------------------
// Feedback.js
// Authors: Anha Khan, Arika Hassan, Laiba Ali, Mark Gazzerro, Sami Dalu
//----------------------------------------------------------------------

// Import stateemnts
import React, { useState } from 'react';

//----------------------------------------------------------------------

// Feedback functional component
const Feedback = ({ isModalActive, setIsModalActive, net_id }) => {
    // State to store user's feedback input
    const [feedbackInput, setFeedbackInput] = useState("");

    // Functional component to close modal
    const handleCloseModal = () => {
        setIsModalActive(false);
    }

    // Send the feedback data to the server
    const handleSubmit = async (e) => {
        // Prevent default form submission
        e.preventDefault();

        // Send post request to the backend with the user's input
        try {
            const response = await fetch(`/api/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ net_id: net_id, 
                    feedback: feedbackInput }),
            });

            if (response.ok) {
                // If feedback sent successfully, alert the user
                alert('Feedback sent successfully!');
                setFeedbackInput("");
                handleCloseModal();
            } else {
                // If the feedback did not send, tell user to try again
                alert('Feedback did not send. Try again.');
            }
        } catch (error) {
            // Otherwise catch any errors related to sending feedback
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        }
    };

    return (
        <>
            {isModalActive && (
                // Render modal only if `isModalActive` is true
                <div className="modal-root" onClick={handleCloseModal}>
                    {/* Modal content */}
                    <div className="modal-card" onClick={e => 
                            e.stopPropagation()}>
                        {/* Modal title */}
                        <div className="feedback-title">
                            <h2>Report Bugs</h2>
                        </div>

                        {/* Feedback form */}
                        <form className="feedback-form">
                            <textarea
                                type="text"
                                placeholder="Report any bugs..."
                                onChange={e => 
                                    setFeedbackInput(e.target.value)}
                                required
                            />
                            <button onClick={handleSubmit}>
                                Submit
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default Feedback