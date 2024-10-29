// src/pages/CreateEditCard.js

//----------------------------------------------------------------------

// Imports
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CreateEditCard.css'; // Import custom CSS file

const getTime = () => {
    const currentDate = new Date();

    // Convert UTC time to Eastern Time (Princeton's timezone)
    const estOffset = -5;
    const edtOffset = -4; // Different offset for daylight savings

    // Checks whether it is currently daylight savings time
    const isDaylightSaving = currentDate.toLocaleString(
        'en-US', { timeZoneName: 'short'}).includes('EDT');
    const offset = isDaylightSaving ? edtOffset : estOffset;

    // Adjusts timezone to Eastern Time
    const timeOfDay = new Date(
        currentDate.getTime() + offset * 60 * 60 * 1000).getUTCHours();

    // Checks current time of day
    return timeOfDay
};

function CreateEditCard() {
    const [temp_id, setNetID] = useState('')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [photo, setPhoto] = useState('')
    const [location, setLocation] = useState('')
    const [dietary, setDietary] = useState([])
    const [allergies, setAllergies] = useState([])
    // const [postTime, setPostTime] = useState('')
    // const [updateTime, setUpdateTime] = useState('')

    // What does this do??
    const handleDietaryChange = (event) => {
        const { value, checked } = event.target;
        setDietary((prevDietary) =>
          checked ? [...prevDietary, value] : prevDietary.filter((d) => d !== value)
        );
    };
    
    const handleAllergiesChange = (event) => {
        const { value, checked } = event.target;
        setAllergies((prevAllergies) =>
          checked ? [...prevAllergies, value] : prevAllergies.filter((d) => d !== value)
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission
        const cardData = {temp_id, title, description, photo, location, 
            dietary, allergies, getTime, getTime}
        console.log(cardData); // Handle form data
    };
    return (
        <div className="DataContainer">
            {/* Navigation Bar */}
            <nav className = "nav">
                {/* Div to organize items on the left of the navbar */}
                <a href="/"><h1>TigerFoodies</h1></a>
            </nav>
            <div className='body'></div>
        <div className='main' style={{ height: '610px', overflowY: 'scroll' }}>
        <h2> Make A Card </h2>
            <form onSubmit={handleSubmit}>
                <div className="formGroup">
                <h4> Net ID: </h4>
                <input 
                    type="text" 
                    name="net_id"
                    value={temp_id} 
                    onChange={(e) => setNetID(e.target.value)}/>
                </div>

                <div className="formGroup">
                <h4>Title: </h4>
                <input 
                    type="text" 
                    name = "title"
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}/>
                </div>

                <div className="formGroup">
                <h4>Description: </h4>
                <textarea
                    name = "description" 
                    cols="150"
                    rows="40"
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}> </textarea>
                </div>

                <div className="formGroup">
                <h4>Image: </h4>
                <input 
                    type="url" 
                    name = "photo_url"
                    value={photo} 
                    onChange={(e) => setPhoto(e.target.value)}/>
                </div>

                <div className="formGroup">
                <h4> Location: </h4>
                <input 
                    type="text" 
                    name = "location"
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)}/>
                </div>

                <div className="formGroup">
                    <h4>Dietary Tags (Select all that apply)</h4>
                    <label><input type="checkbox" name="dietary" value="Halal" checked={dietary.includes('Halal')} onChange={handleDietaryChange}/> Halal</label>
                    <label><input type="checkbox" name="dietary" value="Kosher" checked={dietary.includes('Kosher')} onChange={handleDietaryChange}/> Kosher</label>
                    <label><input type="checkbox" name="dietary" value="Vegetarian" checked={dietary.includes('Vegetarian')} onChange={handleDietaryChange}/> Vegetarian</label>
                    <label><input type="checkbox" name="dietary" value="Vegan" checked={dietary.includes('Vegan')} onChange={handleDietaryChange}/> Vegan</label>
                    <label><input type="checkbox" name="dietary" value="Gluten Free" checked={dietary.includes('Gluten Free')} onChange={handleDietaryChange}/> Gluten Free</label>
                </div>

                <div className="allergies">
                    <h4>Allergens (Select all that apply)</h4>
                    <label><input type="checkbox" name="allergies" value="Contains Nuts" checked={allergies.includes('Contains Nuts')} onChange={handleAllergiesChange}/> Contains Nuts</label>
                    <label><input type="checkbox" name="allergies" value="Contains Dairy" checked={allergies.includes('Contains Dairy')} onChange={handleAllergiesChange}/> Contains Dairy</label>
                    <label><input type="checkbox" name="allergies" value="Contains Shellfish" checked={allergies.includes('Contains Shellfish')} onChange={handleAllergiesChange}/> Contains Shellfish</label>
                </div>         
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

export default CreateEditCard;

    // card_id SERIAL PRIMARY KEY NOT NULL,
    // net_id CHAR(6) REFERENCES users(net_id) NOT NULL,
    // title VARCHAR(100) NOT NULL,
    // description VARCHAR(250),
    // photo_url VARCHAR(255),
    // location VARCHAR(255) NOT NULL,
    // dietary_tags VARCHAR[] DEFAULT '{}',
    // allergies VARCHAR[] DEFAULT '{}',
    // expiration TIMESTAMP NOT NULL,
    // posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    // updated_at TIMESTAMP