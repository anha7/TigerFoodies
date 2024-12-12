//----------------------------------------------------------------------
// CreateCard.js
// Authors: Anha Khan, Arika Hassan, Laiba Ali, Mark Gazzerro, Sami Dalu
//----------------------------------------------------------------------

// Import statements
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateEditCard.css'; // Import custom CSS file
import { useLoadScript, Autocomplete } from "@react-google-maps/api";

//----------------------------------------------------------------------

// Specify the Google Maps API libraries to be used
// (Autocomplete functionality)
const LIBRARIES = ["places"];

// Main CreateCard functional component
function CreateCard( { net_id } ) {
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

    // Handle image uploads
    const handleImageChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
    
        // Allowed image types
        const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 
            'image/webp', 'image/heic'];
        if (!validImageTypes.includes(file.type)) {
            alert(
        'Only JPG, JPEG, PNG, WEBP, or HEIC image files are allowed.');
            event.target.value = ""; // Reset the file input
            return;
        }
    
        // Validate image dimensions
        const image = new Image();
        image.src = file;
        image.onload = async () => {
            if (image.width > 2500 || image.height > 2500) {
                alert(
            'Image dimensions must be 2500x2500 pixels or smaller.');
                event.target.value = ""; // Reset the file input
                return;
            }
    
            // Proceed with uploading to Cloudinary
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
            try {
                // Send image to Cloudinary for conversion to URL
                const response = await fetch(CLOUDINARY_URL, {
                    method: 'POST',
                    body: formData,
                });
                const data = await response.json();
                
                // Ensure photo URL was sucessfully created
                if (data.secure_url) {
                    setPhoto(data.secure_url);
                } else {
                    // Otherwise catch the error
                    throw new Error(
            'Failed to retrieve image URL from Cloudinary response.');
                }
            } catch (error) {
                // Catch any other errors related to uploading an image
                console.error('Error uploading the image:', error);
                alert('Image upload failed. Please try again.');
            }
        };
        
        // Validate image
        image.onerror = () => {
            alert('Invalid image file. Please select a valid image.');
            event.target.value = ""; // Reset the file input
        };
    
        // Read the file as a data URL to load its dimensions
        const reader = new FileReader();
        reader.onload = (e) => {
            image.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

//----------------------------------------------------------------------

    // Handles submitting the card to the database
    const handleSubmit = async (e) => {
        // Prevent default form submission
        e.preventDefault();

        // Prompt user to confirm if the information they want to post
        // is correct
        const userConfirmed = window.confirm(
            "Are you sure all information you want to post is correct?");
        
        // Post card if they confirm
        if (userConfirmed) {
            // Validation: ensure location and coordinates are set
            if (!location || !latitude || !longitude) {
                alert(
                    "Please select a valid location from the suggestions.");
                return; // Stop form submission
            }

            // Validation: ensure title isn't empty
            if (!title.trim()) {
                alert(
                    "Title cannot be empty or just whitespace."
                );
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
                const response = await fetch(`/api/cards`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(cardData),
                });

                // Redirect to homepage after successful submission
                if (response.ok) {
                    navigate('/');
                } else {
                    // Otherwise catch error
                    console.error('Error creating card');
                }
            } catch (error) {
                // Catch any errors related to new card submission
                console.error('Error submitting the card:', error);
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

    // Character limits for title and description
    const maxTitleLength = 100;
    const maxDescriptionLength = 250;

    // Render the form
    return (
        <div className="CreateCard">
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
                        <h2> Make a Card </h2> 
                    </div>

                    {/* Card creation form */}
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
                            e.target.value.slice(0, maxTitleLength));
                                        }
                                        markFormDirty();
                                    }}
                                    placeholder="Enter a title..."
                                    maxLength={maxTitleLength}
                                />
                            </h4>
                            <p>{maxTitleLength - title.length}</p>
                        </div>

                        {/* Image upload field */}
                        <div className="photo">
                            <h4>Image: * <br/>
                            <input
                                required
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
                                            borderRadius: '10px'}} />}
                            </div>
                        </div>

                        {/* Location field */}
                        <div className="location">
                            <h4> Location: * <br/> 
                                <Autocomplete
                                    onLoad={(autocomplete) => (
                            autocompleteRef.current = autocomplete)}
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
                        e.target.value.slice(0, maxDescriptionLength));
                                        }
                                        markFormDirty();
                                    }}
                                    placeholder=
        "Enter any extra information, such as specific room numbers..."
                                    maxLength={maxDescriptionLength}
                                />
                            </h4>
                            <p>{maxDescriptionLength - description.length}</p>  
                        </div>   
                        
                        {/* Submit button */}
                        <div className="button">
                            <button type="submit">Add Card</button>
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

export default CreateCard;