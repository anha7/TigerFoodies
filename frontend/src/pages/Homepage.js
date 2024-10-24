// src/pages/Homepage.js

// Imports
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css'; // Import custom CSS file

//----------------------------------------------------------------------

// Function to determine the greeting based on the current time of day
const getGreeting = () => {
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
    if (timeOfDay >= 0 && timeOfDay < 12) {
        return "Good morning";
    } else if (timeOfDay >= 12 && timeOfDay < 17) {
        return "Good afternoon";
    } else {
        return "Good evening";
    }
};

//----------------------------------------------------------------------

// Hompage functional component
const Homepage = () => {
    // State to store fetched cards
    const [cards, setCards] = useState([]);
    // State to store search input
    const [searchInput, setSearchInput] = useState('');
    // State that stores greeting to reflect time of day
    const [greeting, setGreeting] = useState('');
    // State that stores dietary filter
    const [dietaryFilters, setDietaryFilters] = useState([]);
    // State that stores allergens
    const [allergyFilters, setAllergyFilters] = useState([]);

//----------------------------------------------------------------------

    // Hook that fetches card data from the backend and sets greeting
    useEffect(() => {
        setGreeting(getGreeting());

        const fetchCards = async () => {
            try{
                // Fetch and wait for card data from backend
                const response = await fetch('/api/cards');
                const data = await response.json();
                // Store fetched data in state
                setCards(data);
            } catch(error) {
                console.error('Error fetching cards:', error);
            }
        };

        fetchCards();
    }, []);

//----------------------------------------------------------------------

    // Function that handles the search functionality
    const handleSearch = (query) => {
        // Prevent page from reloading
        query.preventDefault();
        
        // Placeholder for search functionality
        console.log("This is the search query", query);
    }

//----------------------------------------------------------------------

    // Function that handles dietary filters and allergen filters
    const handleFilter = (filter, type) => {
        const { name, checked } = filter.target;

        // sets dietary filter
        if (type === 'dietary') {
            if (checked) {
                setDietaryFilters((prevFilters) => [...prevFilters, name])
            } else {
                setDietaryFilters((prevFilters) => prevFilters.filter((filter) => filter !== name));
            }
        // sets allergy filters
        } else if (type == 'allergy') {
            if (checked) {
                setAllergyFilters((prevFilters) => [...prevFilters, name])
            } else {
                setAllergyFilters((prevFilters) => prevFilters.filter((filter) => filter !== name));
            }
        }
    }

//----------------------------------------------------------------------

    // Return the JSX code for the homepage
    return (
        <div className="homepage">

            {/* Navigation Bar */}
            <nav className = "navbar">
                {/* Create card button */}
                <button className="nav-button">
                    <Link to="/post">+</Link>
                </button>

                {/* View my cards button */}
                <button className="nav-button">
                    <Link to="/view">View My Cards</Link>
                </button>

                {/* Report bugs button */}
                <button className="nav-button">
                    Report Bugs...
                </button>

                {/* Search bar */}
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        placeholder="Search for location, title, etc..."
                        value={searchInput}
                        onChange={(query) => 
                            setSearchInput(query.target.value)}
                        className="search-bar"
                    />
                </form>

                {/* Notifications button */}
                <button className="nav-button">
                    🔔
                </button>
            </nav>
            
            {/* Main content layout */}
            <main>
                <div className="content-container">
                    {/* Welcome section */}
                    <div className="greeting">
                        <h1>{greeting}! Welcome to TigerFoodies!</h1>
                    </div>
                    
                    {/* Display list of active free food cards */}
                    <div className="card-list">
                        {cards.map((card) => (
                            <div key={card.card_id} className="card">
                                <div className="card-content">
                                    <h3>{card.title}</h3>
                                    <img src={card.photo_url} alt="Food" className="card-image" />
                                    <p>Location: {card.location}</p>
                                    <p>Dietary Restrictions: {card.dietary_tags.join(', ')}</p>
                                    <p>Allergens: {card.allergies.join(', ')}</p>
                                    <p>Posted at {card.posted_at}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Siderbar with dietary preferences and allergy filters */}
                <aside className="sidebar">
                    {/* Section for dietary preferences */}
                    <div className="filter-section">
                        <h2>Dietary Preferences</h2>
                        <label>
                            <input type="checkbox" name="vegetarian" onChange={(filter) => handleFilter(filter, 'dietary')} />
                            Vegetarian
                        </label>
                        <label>
                            <input type="checkbox" name="vegan" onChange={(filter) => handleFilter(filter, 'dietary')} />
                            Vegan
                        </label>
                        <label>
                            <input type="checkbox" name="halal" onChange={(filter) => handleFilter(filter, 'dietary')} />
                            Halal
                        </label>
                        <label>
                            <input type="checkbox" name="kosher" onChange={(filter) => handleFilter(filter, 'dietary')} />
                            Kosher
                        </label>
                    </div>

                    {/* Section for allergy filtering */}
                    <div className="filter-section">
                        <h2>Allergies</h2>
                        <label>
                            <input type="checkbox" name="nuts" onChange={(filter) => handleFilter(filter, 'allergy')} />
                            Nuts
                        </label>
                        <label>
                            <input type="checkbox" name="gluten" onChange={(filter) => handleFilter(filter, 'allergy')} />
                            Gluten
                        </label>
                        <label>
                            <input type="checkbox" name="dairy" onChange={(filter) => handleFilter(filter, 'allergy')} />
                            Dairy
                        </label>
                        <label>
                            <input type="checkbox" name="shellfish" onChange={(filter) => handleFilter(filter, 'allergy')} />
                            Shellfish
                        </label>
                    </div>
                </aside>
            </main>

            {/* Footer */}
            <footer>
                Created by Anha Khan '26, Arika Hassan '26, Laiba Ali '26, Mark Gazzerro '26, Sami Dalu '26
            </footer>
        </div>
    );
};

export default Homepage;
