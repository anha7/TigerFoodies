//----------------------------------------------------------------------
// EditCard.js
// Authors: Anha Khan, Arika Hassan, Laiba Ali, Mark Gazzerro, Sami Dalu
//----------------------------------------------------------------------

// Import statements
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import './CreateEditCard.css'; // Import custom CSS file
import { useLoadScript, Autocomplete } from "@react-google-maps/api";

//----------------------------------------------------------------------

// Specify the Google Maps API libraries to be used
// (Autocomplete functionality)
const LIBRARIES = ["places"];

function EditCard({ net_id }) {
    // ID of card to be edited
    const {card_id} = useParams();
    // Card title
    const [title, setTitle] = useState('');
    // Card description
    const [description, setDescription] = useState('');
    // URL of uploaded image
    const [photo, setPhoto] = useState('');
    // Location name/address
    const [location, setLocation] = useState('');
    // Latitude of location
    const [latitude, setLatitude] = useState('');
    // Longitude of location
    const [longitude, setLongitude] = useState('');
    // List of selected dietary preferences
    const [dietary_tags, setDietary] = useState([]);
    // List of selected allergens
    const [allergies, setAllergies] = useState([]);
    // Navigation hook for redirecting the user
    const navigate = useNavigate();
    // Ref for referencing the Autocomplete instance
    const autocompleteRef = useRef(null);
    // State variable that holds whether user accessing edit form
    // is the creator of the card
    const [isAuthorized, setIsAuthorized] = useState(true);

    // Fetch existing card data to pre-fill the form
    useEffect(() => {
        const fetchCard = async () => {        
            try {
                // Retrieve existing card data
                const response = await fetch(`/api/cards/${card_id}`, {
                    method: 'GET',
                });
                if (response.ok) {
                    const data = await response.json();

                    // Check if logged-in user isn't the creator or an
                    // admin
                    if (data.net_id !== net_id && 
                            net_id !== 'cs-tigerfoodies') {
                        // Not authorized to edit
                        setIsAuthorized(false);
                    }

                    // Populate form fields with the existing card data
                    setTitle(data.title || '');
                    setDescription(data.description || '');
                    setPhoto(data.photo_url || '');
                    setLocation(data.location || '');
                    setLatitude(data.latitude || '');
                    setLongitude(data.longitude || '');
                    setDietary(data.dietary_tags || []);
                    setAllergies(data.allergies || []);
                } else {
                    // Otherwise catch errors
                    console.warn(
                        'Backend card information not available.');
                }
            } catch (error) {
                // Catch any errors related to fetching card data
                console.error('Error fetching card data:', error);
            }

        };

        fetchCard();
    }, [card_id, net_id]);

//----------------------------------------------------------------------

    // Load Google Maps API script
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES, // Include "places"
    });
    
    // Display error or loading status if API fails to load
    if (loadError) {
        console.error("Error loading Google Maps API:", loadError);
        return <div>Error loading map</div>;
    }
    if (!isLoaded) {
        return <div>Loading map...</div>;
    }

//----------------------------------------------------------------------

    // Redirect to homepage if the user is not authorized
    if (!isAuthorized) {
        return <Navigate to="/" replace />;
    }

//----------------------------------------------------------------------

    // Handle changes in the Autocomplete input field
    const handlePlaceChanged = () => {
        if (autocompleteRef.current) {
            // Get selected place details
            const place = autocompleteRef.current.getPlace();
            // Extract the shorthand name of a place
            const name = place?.name || ''; 
            // Extract the formatted address
            const address = place?.formatted_address || '';
    
            // Update location state with name or address
            setLocation(name || address);
            
            // Update latitude and longitude if geometry is available
            if (place.geometry) {
                setLatitude(place.geometry.location.lat());
                setLongitude(place.geometry.location.lng());
            }
        }
    };

//----------------------------------------------------------------------

    // Sets dietary preferences
    const handleDietaryChange = (event) => {
        const { value, checked } = event.target;
        setDietary((prevDietary) =>
          checked ? [...prevDietary, value] : 
            prevDietary.filter((d) => d !== value)
        );
    };

//----------------------------------------------------------------------

    // Sets allergens
    const handleAllergiesChange = (event) => {
        const { value, checked } = event.target;
        setAllergies((prevAllergies) =>
          checked ? [...prevAllergies, value] : 
            prevAllergies.filter((d) => d !== value)
        );
    };

//----------------------------------------------------------------------

    // Cloudinary URL and preset for image uploads
    const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/
        ${process.env.REACT_APP_CLOUDINARY_KEY}/image/upload`;
    const CLOUDINARY_UPLOAD_PRESET = 'TigerFoodies';

    // Handle image uploads to Cloudinary
    const handleImageChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        // Add file to form data
        formData.append('file', file);
        // Add upload preset
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        try {
            // Upload image to Cloudinary
            const response = await fetch(CLOUDINARY_URL, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.secure_url) {
                // Update photo state with the secure URL
                setPhoto(data.secure_url);
            } else {
                // Otherwise catch the error
                throw new Error(
            'Failed to retrieve image URL from Cloudinary response');
            }
        } catch (error) {
            // Catch any other errors related to image uploading
            console.error('Error uploading the image:', error);
            alert('Image upload failed. Please try again.');
        }
    };

//----------------------------------------------------------------------
    
    // Handles submitting the card to the database
    const handleSubmit = async (e) => {
        // Prevent default form submission
        e.preventDefault();

        // Validation: Ensure location and coordinates are set
        if (!location || !latitude || !longitude) {
            alert(
                "Please select a valid location from the suggestions.");
            return; // Stop form submission
        }

        // Prepare card data
        const cardData = {
            net_id: net_id,
            title: title, 
            description: description,
            photo_url: photo, 
            location: location,
            latitude: latitude,
            longitude: longitude,
            dietary_tags: dietary_tags, 
            allergies: allergies
        };
        
        try {
            // Send card data to backend
            const response = await fetch(`/api/cards/${card_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(cardData), // Send card data 
            });

            // Redirect to view cards page after successful submission
            if (response.ok) {
                navigate('/view');
            } else {
                // Otherwise catch error
                const errorDetails = await response.json();
                console.error("Failed to edit card:", 
                    errorDetails.message || "Unknown error");
            }
        } catch (error) {
            // Catch any errors related to editing the card
            console.error('Error editing the card:', error);
        }
    };

//----------------------------------------------------------------------

    // Character limit for title and description
    const maxTitleLength = 100;
    const maxDescriptionLength = 250;

    // Render the form
    return (
        <div className="EditCard">

            {/* Navigation Bar */}
            <nav className = "nav">
                {/* Button that redirects to homepages */}
                <a href="/"><h1>TigerFoodies</h1></a>
            </nav>

            {/* Main content container for form data */}
            <div className='main' >
                <div className="entire-form">
                    {/* Name of page */}
                    <div className="page-name">
                        <h2>Edit Card</h2> 
                    </div>

                    {/* Card editing form */}
                    <form onSubmit={handleSubmit}>
                        {/* Title field */}
                        <div className="title">
                            <h4>Title: * <br/>
                            <input 
                                required
                                type="text" 
                                name = "title"
                                value={title} 
                                onChange={(e) => {
                                    if (e.target.value.length <= maxTitleLength) {
                                        setTitle(e.target.value);
                                    }
                                }}
                                placeholder="Enter a title..."/> 
                            </h4>
                        </div>

                        {/* Image upload field */}
                        <div className="photo">
                            <h4>Image: * <br/>
                            <input
                                type="file"
                                name="photo_url"
                                onChange={handleImageChange}
                                className="upload-button"
                            />
                            </h4>
                            <div className='uploadedImage'>
                                {photo && <img src={photo}
                                    alt="Uploaded preview" 
                                    style={{ width: '100%', 
                                            height: 'auto', 
                                            borderRadius: '8px'}} />}
                            </div>
                        </div>


                        {/* Location field */}
                        <div className="location">
                            <h4> Location: * <br/> 
                                <Autocomplete
                                    onLoad={(autocomplete) => {
                                        autocompleteRef.current = autocomplete;
                                
                                        // Set the autocomplete input value to preloaded location
                                        if (autocomplete && location) {
                                            const input = autocomplete.gm_accessors_.input.input;
                                            input.value = location;
                                        }
                                    }}
                                    onPlaceChanged={handlePlaceChanged}
                                >
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => 
                                            setLocation(e.target.value)}
                                        placeholder="Enter a location..."
                                    />
                                </Autocomplete>
                            </h4>
                        </div>

                        {/* Dietary preferences field */}
                        <div className="dietary_tags">
                            <h4>Preferences:</h4>
                            <label>
                                <input type="checkbox" 
                                    name="dietary_tags"
                                    value="Halal"
                                    checked={dietary_tags.includes('Halal')}
                                    onChange={handleDietaryChange}/>
                                Halal
                            </label>
                            <label>
                                <input type="checkbox"
                                    name="dietary_tags"
                                    value="Kosher"
                                    checked={dietary_tags.includes('Kosher')}
                                    onChange={handleDietaryChange}/> 
                                Kosher
                            </label>
                            <label>
                                <input type="checkbox"
                                    name="dietary_tags"
                                    value="Vegetarian"
                                    checked={dietary_tags.includes('Vegetarian')}
                                    onChange={handleDietaryChange}/> 
                                Vegetarian
                            </label>
                            <label>
                                <input type="checkbox"
                                    name="dietary_tags"
                                    value="Vegan"
                                    checked={dietary_tags.includes('Vegan')}
                                    onChange={handleDietaryChange}/> 
                                Vegan
                            </label>
                            <label>
                                <input type="checkbox"
                                    name="dietary_tags"
                                    value="Gluten-Free"
                                    checked={dietary_tags.includes('Gluten-Free')}
                                    onChange={handleDietaryChange}/>
                                Gluten-Free
                            </label>
                        </div>
                        
                        {/* Allergens field */}
                        <div className="allergies">
                            <h4>Allergens:</h4>
                            <label>
                                <input type="checkbox" 
                                    name="allergies" 
                                    value="Nuts" 
                                    checked={allergies.includes('Nuts')} 
                                    onChange={handleAllergiesChange}/>
                                Nuts
                            </label>
                            <label>
                                <input type="checkbox"
                                    name="allergies"
                                    value="Dairy"
                                    checked={allergies.includes('Dairy')} 
                                    onChange={handleAllergiesChange}/>
                                Dairy
                            </label>
                            <label>
                                <input type="checkbox"
                                    name="allergies"
                                    value="Shellfish"
                                    checked={allergies.includes('Shellfish')}
                                    onChange={handleAllergiesChange}/>
                                Shellfish
                            </label>
                        </div>

                        {/* Description field */}    
                        <div className="description"> 
                            <h4>Description: <br/>
                            <textarea
                                type='text'
                                name = "description" 
                                value={description} 
                                onChange={(e) => {
                                    if (e.target.value.length <= maxDescriptionLength) {
                                        setDescription(e.target.value);
                                    }
                                }}
                                placeholder=
    "Enter any extra information, such as specific room numbers..."
                                /> 
                            </h4>
                        </div>   
                        
                        {/* Submit button */}
                        <div className="button">
                            <button type="submit">Submit Card</button>
                        </div>
                    </form>
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

export default EditCard;