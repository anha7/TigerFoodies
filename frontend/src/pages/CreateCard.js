// src/pages/CreateCard.js

//----------------------------------------------------------------------

// Imports
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateEditCard.css'; // Import custom CSS file
// import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";

//----------------------------------------------------------------------
const LIBRARIES = ["places"];

function CreateCard( { net_id } ) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState('');
    const [location, setLocation] = useState('');
    const [location_url, setLocationUrl] = useState('');
    const [dietary_tags, setDietary] = useState([]);
    const [allergies, setAllergies] = useState([]);
    const navigate = useNavigate(); // Initialize useNavigate
    const autocompleteRef = useRef(null);
    // const [marker, setMarker] = useState(null);

    // const mapContainerStyle = {
    //     width: "100%",
    //     height: "400px",
    // };
    
    // const center = {
    //     lat: 40.343094, // Example: New York City
    //     lng: -74.655086,
    // };

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES, // Include places library for autocomplete
    });
    
    if (loadError) {
        console.error("Error loading Google Maps API:", loadError);
        return <div>Error loading map</div>;
    }
    if (!isLoaded) {
        console.log("Google Maps API is loading...");
        return <div>Loading map...</div>;
    }

//----------------------------------------------------------------------

    const handlePlaceChanged = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            const address = place?.formatted_address || '';
            setLocation(address);
    
            if (place.geometry) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                setLocationUrl(`https://www.google.com/maps?q=${lat},${lng}`);
                console.log(location_url);
            }
        }
    };
    
//----------------------------------------------------------------------
    // // Handles Map Click
    // const handleMapClick = (event) => {
    //     const lat = event.latLng.lat();
    //     const lng = event.latLng.lng();
    //     setMarker({ lat, lng });
    //     // Generate Google Maps link
    //     setLocationLink(`https://www.google.com/maps?q=${lat},${lng}`);
    // };

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

//----------------------------------------------------------------------

    const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/devcgtjkx/image/upload';
    const CLOUDINARY_UPLOAD_PRESET = 'TigerFoodies';

    // Sets image
    // Update to handle async function
    const handleImageChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
   
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
   
        try {
            const response = await fetch(CLOUDINARY_URL, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
   
            if (data.secure_url) {
                setPhoto(data.secure_url); // Successfully uploaded
                console.log('Uploaded Image URL:', data.secure_url); // Confirm URL in console
            } else {
                throw new Error('Failed to retrieve image URL from Cloudinary response');
            }
        } catch (error) {
            console.error('Error uploading the image:', error);
            alert('Image upload failed. Please try again.'); // Inform the user
        }
    };

//----------------------------------------------------------------------

    // Handles submitting the card to the database
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission

        // Validation: Ensure location and location_url are set
        if (!location || !location_url) {
            alert("Please select a valid location from the suggestions.");
            return; // Stop form submission
        }
        
        const cardData = {
            net_id: net_id,
            title: title, 
            description: description,
            photo_url: photo, 
            location: location,
            location_url: location_url,
            dietary_tags: dietary_tags, 
            allergies: allergies
        };
        
        try {
            const response = await fetch(`/api/cards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(cardData), // Send card data as JSON
            });

            if (response.ok) {
                console.log('Card successfully created');
                navigate('/'); // Redirect to homepage after successful card creation
            } else {
                console.error('Error creating card');
            }
        } catch (error) {
            console.error('Error submitting the card:', error);
        }
    };

//----------------------------------------------------------------------

    return (
        <div className="CreateCard">

            {/* Navigation Bar */}
            <nav className = "nav">
                {/* Button that redirects to homepages */}
                <a href="/"><h1>TigerFoodies</h1></a>
            </nav>

            {/* Main content container for form data */}
            <div className='main' >
                <div className="entire-form">
                    <div className="page-name"> <h2> Make a Card </h2> </div>

                    <form onSubmit={handleSubmit}>
                        {/* Title field */}
                        <div className="title">
                            <h4>Title: * <br/>
                            <input 
                                required
                                type="text" 
                                name = "title"
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)}/> </h4>
                        </div>

                        {/* Field to upload food image */}
                        <div className="photo">
                        <h4>Image: * <br/>
                        <input
                            required
                            type="file"
                            name="photo_url"
                            // accept="image/*"
                            onChange={handleImageChange}
                            className="upload-button"
                        />
                        </h4>
                        <div className='uploadedImage'>
                            {photo && <img src={photo} alt="Uploaded preview" style={{ width: '100%', height: 'auto', borderRadius: '8px'}} />}
                        </div>
                        </div>

                        {/* Location field */}
                        <div className="location">
                            <h4> Location: * <br/> 
                                <Autocomplete
                                    onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                                    onPlaceChanged={handlePlaceChanged}
                                    >
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Enter a location"
                                    />
                                </Autocomplete>
                            </h4>
                        </div>

                        {/* Location Link info */}
                        {/* <div className='locationlink'>
                            <h4>Location Link:</h4>
                            <GoogleMap
                                mapContainerStyle={mapContainerStyle}
                                zoom={12}
                                center={center}
                                onClick={handleMapClick}
                            >
                                {marker && <Marker position={marker} />}
                            </GoogleMap>
                            {locationLink && (
                                <p>
                                    Selected Location:{" "}
                                    <a href={locationLink} target="_blank" rel="noopener noreferrer">
                                        {locationLink}
                                    </a>
                                </p>
                            )}
                        </div> */}

                        {/* Dietary preferences field */}
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
                        </div>

                        {/* Description field */}    
                        <div className="description"> 
                            <h4>Description: <br/>
                            <textarea
                                type='text'
                                name = "description" 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)}/> 
                            </h4>     
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

export default CreateCard;