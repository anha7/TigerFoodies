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
    // Check if there's new info in the form
    const [isFormDirty, setIsFormDirty] = useState(false);

//----------------------------------------------------------------------

    // Fetch existing card data to pre-fill the form when component
    // mounts
    useEffect(() => {
        const fetchCard = async () => {        
            try {
                // Retrieve existing card data
                const response = await fetch(`/api/cards/${card_id}`, {
                    method: 'GET',
                });

                // Unauthorized or forbidden access, redirect to homepage
                if (response.status === 403 || response.status === 401 ||
                        response.status === 404 || response.status === 500) {
                    navigate("/", { replace: true });
                    return;
                }
    
                if (response.ok) {
                    const data = await response.json();
                    
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

    // Warn users attempting to refresh / close the page when they have
    // unsaved form data
    useEffect(() => {
        const unloadCallback = (event) => {
            if (isFormDirty) {
              event.preventDefault();
              event.returnValue = "";
              return "";
            }
          };
          window.addEventListener("beforeunload", unloadCallback);
          return () => 
            window.removeEventListener("beforeunload", unloadCallback);
    }, [isFormDirty]); 

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
    const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_KEY}/image/upload`;
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

        // Prompt user to confirm if the information they want to edit
        // is correct
        const userConfirmed = window.confirm(
            "Are you sure all information you want to edit is correct?");
        
        // Edit card if they confirm
        if (userConfirmed) {
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
        }
    };

//----------------------------------------------------------------------

const handleNavigation = () => {
    // Check if user really wants to leave page if they have edited
    // the form in anyway
    if (isFormDirty) {
        const confirmLeave = window.confirm(
            "Form data will be lost. Are you sure you want to leave?"
        )

        // Don't redirect if they don't want to leave yet
        if (!confirmLeave) return;
    }

    // Redirect to homepage if they confirmed they want to leave
    navigate("/");
}

//----------------------------------------------------------------------

// Functional component that marks form as being modified by user
const markFormDirty = () => {
    if (!isFormDirty) {
        setIsFormDirty(true);
    }
}

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
                <a 
                    onClick={(e) => {
                        // Prevent default link behavior
                        e.preventDefault();
                        handleNavigation();
                    }}
                    href="/"
                >
                    <h1>TigerFoodies</h1>
                </a>
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
                                    } else {
                                        setTitle(
                    e.target.value.length.slice(0, maxTitleLength));
                                    }
                                    markFormDirty();
                                }}
                                placeholder="Enter a title..."/> 
                            </h4>
                            <p>{maxTitleLength - title.length}</p>
                        </div>

                        {/* Image upload field */}
                        <div className="photo">
                            <h4>Image: * <br/>
                            <input
                                type="file"
                                name="photo_url"
                                onChange={(e) => {
                                    handleImageChange(e);
                                    markFormDirty();
                                }}
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
                                        onChange={(e) => {
                                            setLocation(e.target.value);
                                            markFormDirty();
                                        }}
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
                                    onChange={(e) => {
                                        handleDietaryChange(e);
                                        markFormDirty();
                                    }}/>
                                Halal
                            </label>
                            <label>
                                <input type="checkbox"
                                    name="dietary_tags"
                                    value="Kosher"
                                    checked={dietary_tags.includes('Kosher')}
                                    onChange={(e) => {
                                        handleDietaryChange(e);
                                        markFormDirty();
                                    }}/> 
                                Kosher
                            </label>
                            <label>
                                <input type="checkbox"
                                    name="dietary_tags"
                                    value="Vegetarian"
                                    checked={dietary_tags.includes('Vegetarian')}
                                    onChange={(e) => {
                                        handleDietaryChange(e);
                                        markFormDirty();
                                    }}/> 
                                Vegetarian
                            </label>
                            <label>
                                <input type="checkbox"
                                    name="dietary_tags"
                                    value="Vegan"
                                    checked={dietary_tags.includes('Vegan')}
                                    onChange={(e) => {
                                        handleDietaryChange(e);
                                        markFormDirty();
                                    }}/> 
                                Vegan
                            </label>
                            <label>
                                <input type="checkbox"
                                    name="dietary_tags"
                                    value="Gluten-Free"
                                    checked={dietary_tags.includes('Gluten-Free')}
                                    onChange={(e) => {
                                        handleDietaryChange(e);
                                        markFormDirty();
                                    }}/>
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
                                    onChange={(e) => {
                                        handleAllergiesChange(e);
                                        markFormDirty();
                                    }}/>
                                Nuts
                            </label>
                            <label>
                                <input type="checkbox"
                                    name="allergies"
                                    value="Dairy"
                                    checked={allergies.includes('Dairy')} 
                                    onChange={(e) => {
                                        handleAllergiesChange(e);
                                        markFormDirty();
                                    }}/>
                                Dairy
                            </label>
                            <label>
                                <input type="checkbox"
                                    name="allergies"
                                    value="Shellfish"
                                    checked={allergies.includes('Shellfish')}
                                    onChange={(e) => {
                                        handleAllergiesChange(e);
                                        markFormDirty();
                                    }}/>
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
                                    } else {
                                        setDescription(
                    e.target.value.length.slice(0, maxDescriptionLength));
                                    }
                                    markFormDirty();
                                }}
                                placeholder=
    "Enter any extra information, such as specific room numbers..."
                                /> 
                            </h4>
                            <p>{maxDescriptionLength - description.length}</p>
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

//----------------------------------------------------------------------

export default EditCard;