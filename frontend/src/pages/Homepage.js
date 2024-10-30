// src/pages/Homepage.js

//----------------------------------------------------------------------

// Imports
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css'; // Import custom CSS file
import searchIcon from './media/search-icon.png';
import notificationsIcon from './media/notifications.png';
import plusIcon from './media/plus.png';
import matheyImage from './media/mathey.png';
import hamburgerIcon from './media/hamburger-icon.png';
import preferencesIcon from './media/preferences.png';

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
    // State that stores food filters
    const [foodFilters, setFoodFilters] = useState({
        dietary: {
            vegetarian: false,
            vegan: false,
            halal: false,
            kosher: false,
            gluten: false,
        },
        allergies: {
            nuts: false,
            dairy: false,
            shellfish: false
        }
    });
    // State that stores whether mobile hamburger menu is open
    const [isHamburgerOpen, setHamburgerOpen] = useState(false);
    // State that stores whether mobile preferences is open
    const [isPreferencesOpen, setPreferencesOpen] = useState(false);


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

    // Function that toggles dietary filters and allergen filters
    const handleFilter = (filter, type) => {
        const { name, checked } = filter.target;

        setFoodFilters((prevFoodFilters) => ({
            ...prevFoodFilters,
            [type]: {
                ...prevFoodFilters[type],
                [name]: checked,
            },
        }));
    };

//----------------------------------------------------------------------

    // Function that toggles hamburger menu (for mobile)
    const toggleHamburger = () => {
        setHamburgerOpen(!isHamburgerOpen);

        // If hamburger is open, display the hidden navbar items
        const mobileNavbar = document.querySelector('.mobile-navbar-left');

        if(isHamburgerOpen) {
            mobileNavbar.style.height = "5vh";
            mobileNavbar.style.top = "7vh";
            mobileNavbar.style.zIndex = "0";
        } else {
            mobileNavbar.style.height = "0px";
            mobileNavbar.style.top = "3.5vh";
            mobileNavbar.style.zIndex = "-1";
        }
    }

//----------------------------------------------------------------------

    // Function that toggles small preferences menu (for mobile)
    const toggleSmallPreferences = () => {
        setPreferencesOpen(!isPreferencesOpen);

        // If mobile preferences button is open, display the hidden items
        const preferences = document.querySelector('.mobile-preferences-menu');

        if(isPreferencesOpen) {
            preferences.style.display = "flex";
        } else {
            preferences.style.display = "none";
        }
    }

//----------------------------------------------------------------------

    // Return the JSX code for the homepage
    return (
        <div className="homepage">

            {/* Navigation Bar */}
            <nav className = "navbar">
                {/* Div to organize items on the left of the navbar */}
                <div className = "navbar-left">
                    {/* Create card button */}
                    <button className="nav-button">
                        <Link to="/post">
                            <img src={plusIcon} alt="createIcon" height="15px" />
                        </Link>
                    </button>
                    {/* View my cards button */}
                    <button className="nav-button">
                        <Link to="/view">View My Cards</Link>
                    </button>
                    {/* Report bugs button */}
                    <button className="nav-button">
                        Report Bugs...
                    </button>
                </div>

                {/* Div to organize items on the right of the navbar */}
                <div className="navbar-right">
                    
                    {/* Hamburger icon to condense left navbar buttons on smaller screens */}
                    <button className="nav-button nav-menu-open" onClick={toggleHamburger}>
                        <img src={hamburgerIcon} alt="Open Menu" height="15px" />
                    </button>
                    
                    {/* Search bar */}
                    <form onSubmit={handleSearch} className="search-form">
                        <div className="search-container">
                            <span class="search-icon">
                                <img src={searchIcon} alt="SearchIcon" height="15px" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search for locations, titles, etc..."
                                value={searchInput}
                                onChange={(query) => 
                                    setSearchInput(query.target.value)}
                                className="search-bar"
                            />
                        </div>
                    </form>

                    {/* Notifications button */}
                    <button className="nav-button">
                        <img src={notificationsIcon} alt="Notifications" height="15px" />
                    </button>
                </div>
            </nav>

            {/* Container for navbar buttons on mobile view */}
            <div className="mobile-navbar-left">
                {/* Create card button */}
                <button className="nav-button">
                    <Link to="/post">
                        <img src={plusIcon} alt="createIcon" height="15px" />
                    </Link>
                </button>
                {/* View my cards button */}
                <button className="nav-button">
                    <Link to="/view">View My Cards</Link>
                </button>
                {/* Report bugs button */}
                <button className="nav-button">
                    Report Bugs...
                </button>
            </div>
            
            {/* Main content layout */}
            <main>
                {/* Div for left side content */}
                <div className="content-container">
                    {/* Welcome section */}
                    <div className="greeting">
                        <h1>{greeting}, welcome to TigerFoodies!</h1>
                    </div>

                    {/* Div for preferences layout for when screen is smaller */}
                    <div className="smaller-preferences">
                        <button className="preferences-button" onClick={toggleSmallPreferences}>
                            <img src={preferencesIcon} alt="SearchIcon" height="15px" />
                        </button>
                    </div>
                    <aside className="mobile-preferences-menu">
                        {/* Section for dietary preferences */}
                        <div className="mobile-food-preference-selection">
                            <h3>Dietary Preferences</h3>
                            <label>
                                <input type="checkbox" name="vegetarian" checked={foodFilters.dietary.vegetarian} onChange={(filter) => handleFilter(filter, 'dietary')} />
                                Vegetarian
                            </label>
                            <label>
                                <input type="checkbox" name="vegan" checked={foodFilters.dietary.vegan} onChange={(filter) => handleFilter(filter, 'dietary')} />
                                Vegan
                            </label>
                            <label>
                                <input type="checkbox" name="halal" checked={foodFilters.dietary.halal} onChange={(filter) => handleFilter(filter, 'dietary')} />
                                Halal
                            </label>
                            <label>
                                <input type="checkbox" name="kosher" checked={foodFilters.dietary.kosher} onChange={(filter) => handleFilter(filter, 'dietary')} />
                                Kosher
                            </label>
                            <label>
                                <input type="checkbox" name="gluten" checked={foodFilters.dietary.gluten} onChange={(filter) => handleFilter(filter, 'dietary')} />
                                Gluten-Free
                            </label>
                        </div>

                        {/* Section for allergy filtering */}
                        <div className="mobile-food-preference-selection">
                            <h3>Allergies</h3>
                            <label>
                                <input type="checkbox" name="nuts" checked={foodFilters.allergies.nuts} onChange={(filter) => handleFilter(filter, 'allergies')} />
                                Nuts
                            </label>
                            <label>
                                <input type="checkbox" name="dairy" checked={foodFilters.allergies.dairy} onChange={(filter) => handleFilter(filter, 'allergies')} />
                                Dairy
                            </label>
                            <label>
                                <input type="checkbox" name="shellfish" checked={foodFilters.allergies.shellfish} onChange={(filter) => handleFilter(filter, 'allergies')} />
                                Shellfish
                            </label>
                        </div>
                    </aside>
                    
                    {/* Display list of active free food cards */}
                    <div className="card-list">
                        {cards.map((card) => (
                            <div key={card.card_id} className="card" style={{ backgroundImage: `url(${card.photo_url})` }}>
                                <div 
                                    className="card-image"
                                    style={{ backgroundImage: `url(${card.photo_url})`}}
                                >
                                </div>
                                <div className="card-content">
                                    <h3>{card.title}</h3>
                                    <p>Location: {card.location}</p>
                                    <p>Dietary Restrictions: {card.dietary_tags.join(', ')}</p>
                                    <p>Allergens: {card.allergies.join(', ')}</p>
                                    <p className="posted-at">Posted at {card.posted_at}</p>
                                </div>
                            </div>
                        ))}
                        {/* Fake card for design purposes */}
                        <div className="card">
                            <div 
                                className="card-image"
                                style={{ backgroundImage: `url(${matheyImage})`}}
                            >
                            </div>
                            <div className="card-content"> 
                                <h3>title</h3>
                                <p>location</p>
                                <p>dietary restrictions</p>
                                <p>allergens</p>
                                <p className="posted-at">posted at</p>
                            </div>
                        </div>
                        {/* Fake card for design purposes */}
                        <div className="card">
                            <div 
                                className="card-image"
                                style={{ backgroundImage: `url(${matheyImage})`}}
                            >
                            </div>
                            <div className="card-content"> 
                                <h3>title</h3>
                                <p>location</p>
                                <p>dietary restrictions</p>
                                <p>allergens</p>
                                <p className="posted-at">posted at</p>
                            </div>
                        </div>
                        {/* Fake card for design purposes */}
                        <div className="card">
                            <div 
                                className="card-image"
                                style={{ backgroundImage: `url(${matheyImage})`}}
                            >
                            </div>
                            <div className="card-content"> 
                                <h3>title</h3>
                                <p>location</p>
                                <p>dietary restrictions</p>
                                <p>allergens</p>
                                <p className="posted-at">posted at</p>
                            </div>
                        </div>
                        {/* Fake card for design purposes */}
                        <div className="card">
                            <div 
                                className="card-image"
                                style={{ backgroundImage: `url(${matheyImage})`}}
                            >
                            </div>
                            <div className="card-content"> 
                                <h3>title</h3>
                                <p>location</p>
                                <p>dietary restrictions</p>
                                <p>allergens</p>
                                <p className="posted-at">posted at</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Right sidebar with dietary preferences and allergy filters */}
                <aside className="sidebar">
                    {/* Section for dietary preferences */}
                    <div className="food-preferences-selection">
                        <h3>Dietary Preferences</h3>
                        <label>
                            <input type="checkbox" name="vegetarian" checked={foodFilters.dietary.vegetarian} onChange={(filter) => handleFilter(filter, 'dietary')} />
                            Vegetarian
                        </label>
                        <label>
                            <input type="checkbox" name="vegan" checked={foodFilters.dietary.vegan} onChange={(filter) => handleFilter(filter, 'dietary')} />
                            Vegan
                        </label>
                        <label>
                            <input type="checkbox" name="halal" checked={foodFilters.dietary.halal} onChange={(filter) => handleFilter(filter, 'dietary')} />
                            Halal
                        </label>
                        <label>
                            <input type="checkbox" name="kosher" checked={foodFilters.dietary.kosher} onChange={(filter) => handleFilter(filter, 'dietary')} />
                            Kosher
                        </label>
                        <label>
                            <input type="checkbox" name="gluten" checked={foodFilters.dietary.gluten} onChange={(filter) => handleFilter(filter, 'dietary')} />
                            Gluten-Free
                        </label>
                    </div>

                    {/* Section for allergy filtering */}
                    <div className="food-preferences-selection">
                        <h3>Allergies</h3>
                        <label>
                            <input type="checkbox" name="nuts" checked={foodFilters.allergies.nuts} onChange={(filter) => handleFilter(filter, 'allergies')} />
                            Nuts
                        </label>
                        <label>
                            <input type="checkbox" name="dairy" checked={foodFilters.allergies.dairy} onChange={(filter) => handleFilter(filter, 'allergies')} />
                            Dairy
                        </label>
                        <label>
                            <input type="checkbox" name="shellfish" checked={foodFilters.allergies.shellfish} onChange={(filter) => handleFilter(filter, 'allergies')} />
                            Shellfish
                        </label>
                    </div>
                </aside>
            </main>

            {/* Footer */}
            <footer>
                <p>
                Created by Anha Khan '26, Arika Hassan '26, Laiba Ali '26, Mark Gazzerro '25, Sami Dalu '27
                </p>
            </footer>
        </div>
    );
};

export default Homepage;
