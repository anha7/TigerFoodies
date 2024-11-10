// src/pages/CreateCard.js

//----------------------------------------------------------------------

// Imports
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateEditCard.css'; // Import custom CSS file

//----------------------------------------------------------------------

function CreateCard( { net_id } ) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState('');
    const [location, setLocation] = useState('');
    const [dietary_tags, setDietary] = useState([]);
    const [allergies, setAllergies] = useState([]);
    const navigate = useNavigate(); // Initialize useNavigate

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
        const cardData = {
            net_id: net_id,
            title: title, 
            description: description,
            photo_url: photo, 
            location: location,
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
                    {/* <div className="photo">
                        <h4>Image: * <br/>
                        <input 
                            required
                            type="text" 
                            name = "photo_url"
                            onChange={handleImageChange}
                            // onChange={(e) => setPhoto(e.target.value)}
                            // <div className='storeImage'> <img src={photo} style={{ width: 200, height: 200 }} alt="No Images"/> </div>
                            />
                        </h4>
                    </div> */}
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
                    {photo && <img src={photo} alt="Uploaded preview" style={{ width: 200, height: 200, marginTop: '10px' }} />}
                    </h4>
                    </div>

                    {/* Location field */}
                    <div className="location">
                        <h4> Location: * <br/> 
                        <input 
                            required
                            type="text" 
                            name = "location"
                            value={location} 
                            onChange={(e) => setLocation(e.target.value)}/>
                        </h4>
                    </div>

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