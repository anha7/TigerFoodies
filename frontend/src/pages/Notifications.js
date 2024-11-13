// Import stateemnts
import React, { useEffect, useState } from 'react';

//----------------------------------------------------------------------

// notifications functional component
const Notifications = ({ isModalActive, setIsModalActive, net_id }) => {
    const [dietary_tags, setDietary] = useState([]);
    const [allergies, setAllergies] = useState([]);
    const [subscribed_to_desktop_notifications, setSubscribed] = useState(false);
    let notification; // Define a variable to store the notification instance

    //----------------------------------------------------------------------
    useEffect(() => {
        if (!("Notification" in window)) {
            console.log("Browser does not support desktop notification");
        } else {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    console.log("Notification permission granted");
                } else {
                    console.log("Notification permission denied");
                }
            });
        }
    }, []);

    // Show a desktop notification
    const showNotification = () => {
        if (Notification.permission === "granted") {
            const options = {
                body: 'Your notification preferences have been saved!',
                dir: 'ltr',
            };
            notification = new Notification("TigerFoodies Update", options);
            setTimeout(() => {
                notification.close();
            }, 5000); // Auto-close notification after 5 seconds
        }
    };

    //----------------------------------------------------------------------

    // Sets dietary preferences
    const handleDietaryChange = (event) => {
        const { value, checked } = event.target;
        setDietary((prevDietary) =>
        checked ? [...prevDietary, value] : prevDietary.filter((d) => d !== value)
        );
    };

    //----------------------------------------------------------------------
        
    // Sets allergens
    const handleAllergiesChange = (event) => {
        const { value, checked } = event.target;
        setAllergies((prevAllergies) =>
        checked ? [...prevAllergies, value] : prevAllergies.filter((d) => d !== value)
        );
    };

    const handleSubscribed = (event) => {
        setSubscribed(event.target.checked);
    };

    //----------------------------------------------------------------------

    // Functional component to close modal
    const handleCloseModal = () => {
        setIsModalActive(false);
    }

    const tagsUpdate = async (e) => {
        e.preventDefault(); // Prevent default form submission
        const preferencesData  = {
            net_id: net_id,
            dietary_tags: dietary_tags, 
            allergies: allergies,
            subscribed_to_desktop_notifications: subscribed_to_desktop_notifications
        };
        
        // FIX THIS FOR DATABASE 
        try {
            const response = await fetch(`/api/preferences`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(preferencesData), // Send card data as JSON
            });

            if (response.ok) {
                console.log('Preferences successfully updates');
                
                if (subscribed_to_desktop_notifications) {
                    if (Notification.permission == "granted") {
                        const permission = await Notification.requestPermission();
                        if (permission === "granted") {
                            showNotification();
                        }
                    } else {
                        console.log('Not subscribed for Notifications');
                    }
                }

                handleCloseModal();
            } else {
                console.error('Error editing preferences');
            }
        } catch (error) {
            console.error('Error updating the preferences:', error);
        }
    };

    return (
        <>
            {isModalActive && (
                <div className="modal-root" onClick={handleCloseModal}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="notifications-title">
                            <h2>Set Up Notifications</h2>
                        </div>
                        <form className="notifications-form">
                            <div className="dietary_tags">
                                <h4>Dietary Tags (Select all that apply): </h4>
                                <label><input type="checkbox" name="dietary_tags" value="Halal" checked={dietary_tags.includes('Halal')} onChange={handleDietaryChange}/> Halal</label>
                                <label><input type="checkbox" name="dietary_tags" value="Kosher" checked={dietary_tags.includes('Kosher')} onChange={handleDietaryChange}/> Kosher</label>
                                <label><input type="checkbox" name="dietary_tags" value="Vegetarian" checked={dietary_tags.includes('Vegetarian')} onChange={handleDietaryChange}/> Vegetarian</label>
                                <label><input type="checkbox" name="dietary_tags" value="Vegan" checked={dietary_tags.includes('Vegan')} onChange={handleDietaryChange}/> Vegan</label>
                                <label><input type="checkbox" name="dietary_tags" value="Gluten-Free" checked={dietary_tags.includes('Gluten-Free')} onChange={handleDietaryChange}/> Gluten-Free</label>
                            </div>
                            
                            {/* Allergens field */}
                            <div className="allergies">
                                <h4>Allergens (Select all that apply): </h4>
                                <label><input type="checkbox" name="allergies" value="Nuts" checked={allergies.includes('Nuts')} onChange={handleAllergiesChange}/> Nuts</label>
                                <label><input type="checkbox" name="allergies" value="Dairy" checked={allergies.includes('Dairy')} onChange={handleAllergiesChange}/> Dairy</label>
                                <label><input type="checkbox" name="allergies" value="Shellfish" checked={allergies.includes('Shellfish')} onChange={handleAllergiesChange}/> Shellfish</label>
                            <h4>Desktop Notifications: </h4>
                            <label><input type="checkbox" name="subscribed_to_desktop_notifications" value="Subscribed" checked={subscribed_to_desktop_notifications} onChange={handleSubscribed}/> Subscribe to Desktop Notifications </label>
                            <button onClick={tagsUpdate}>Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default Notifications