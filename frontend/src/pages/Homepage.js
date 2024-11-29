//----------------------------------------------------------------------
// Homepage.js
// Authors: Anha Khan, Arika Hassan, Laiba Ali, Mark Gazzerro, Sami Dalu
//----------------------------------------------------------------------

// Imports
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css'; // Import custom CSS file
import searchIcon from './media/search.svg';
import createIcon from './media/create.svg';
import hamburgerIcon from './media/hamburger.svg';
import preferencesIcon from './media/preferences.svg';
import CardDisplay from './CardDisplay'; // to view extended card info
import Feedback from './Feedback';
import { io } from "socket.io-client";

//----------------------------------------------------------------------

// Connection to flask-socketio server
const socket = io();

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
const Homepage = ({ net_id }) => {
    // State to store fetched cards
    const [cards, setCards] = useState([]);
    // State to store search input
    const [searchInput, setSearchInput] = useState('');
    // State that stores greeting to reflect time of day
    const [greeting, setGreeting] = useState('');
    // State that stores food filters
    const [foodFilters, setFoodFilters] = useState({
        dietary: {
            "vegetarian": false,
            "vegan": false,
            "halal": false,
            "kosher": false,
            "gluten-free": false,
        },
        allergies: {
            "nuts": false,
            "dairy": false,
            "shellfish": false
        }
    });
    const [filteredCards, setFilteredCards] = useState([]);
    // State that stores whether mobile hamburger menu is open
    const [isHamburgerOpen, setHamburgerOpen] = useState(false);
    // State that stores whether mobile preferences is open
    const [isPreferencesOpen, setPreferencesOpen] = useState(false);
    // State for feedback modal
    const [isFeedbackModalActive, setFeedbackModalActive] = useState(false);

//----------------------------------------------------------------------

    // function that toggles feedback modal
    const toggleFeedbackModal = () => setFeedbackModalActive(!isFeedbackModalActive);
//----------------------------------------------------------------------

    // Hook that fetches card data from the backend and sets greeting
    useEffect(() => {
        // Set greeting
        setGreeting(getGreeting());

        const fetchCards = async () => {
            try{
                // Fetch and wait for card data from backend
                const response = await fetch(`/api/cards`);
                const data = await response.json();
                // Store fetched data in state
                setCards(data);
                setFilteredCards(data);
            } catch(error) {
                console.error('Error fetching cards:', error);
            }
        };

        fetchCards();

         // Fetch cards again if there are updates from the server
         socket.on("card created", () => fetchCards());
         socket.on("card edited", () => fetchCards());
         socket.on("card deleted", () => fetchCards());

        // Clean up the socket connection on unmount
        return () => socket.close();
    }, []);

//----------------------------------------------------------------------

    // Function that handles the search functionality
    const handleSearch = (event) => {
        // Update search input state
        const query = event.target.value.toLowerCase();
        setSearchInput(query);

        // Call filter cards function to filter cards based on search query
        setFilteredCards(filterCards());
    }

//----------------------------------------------------------------------

    // Function that toggles dietary filters and allergen filters checkboxes
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

    // Function to filter cards based on search query and preferences
    const filterCards = () => {
        return cards.filter((card) => {
            // Ensure card.allergies and card.dietary_tags are arrays
            const cardAllergies = Array.isArray(card.allergies) ? card.allergies : [];
            const cardDietaryTags = Array.isArray(card.dietary_tags) ? card.dietary_tags : [];

            // Normalize data for case sensitivity
            const normalizedAllergies = cardAllergies.map((a) => a.toLowerCase());
            const normalizedDietaryTags = cardDietaryTags.map((tag) => tag.toLowerCase());
            
            // Search filtering functionality
            if (searchInput.trim() !== '') {
                const combinedCardText = [
                    card.title,
                    card.location,
                    ...card.dietary_tags,
                    ...card.allergies
                ].join(' ').toLowerCase(); // Combine and normalize case
    
                if (!combinedCardText.includes(searchInput.toLowerCase())) {
                    return false; // Exclude if the search query doesn't match
                }
            }

            // Check for allergy filters (allergies take precedence)
            const selectedAllergens = Object.keys(foodFilters.allergies).filter(
                (allergen) => foodFilters.allergies[allergen]
            ).map((a) => a.toLowerCase()); // Normalize selected allergens for comparison

            if (selectedAllergens.length > 0) {
                const hasAllergen = selectedAllergens.some((allergen) =>
                    normalizedAllergies.includes(allergen)
                );
                if (hasAllergen) {
                    return false; // Exclude card if it has a selected allergen
                }
            }

            // Check for dietary preference filters
            const activeDietaryPreferences = Object.keys(foodFilters.dietary).filter(
                (preference) => foodFilters.dietary[preference]
            ).map((p) => p.toLowerCase()); // Normalize for comparison

            // No dietary preferences selected, include all cards that pass the allergen check
            if (activeDietaryPreferences.length === 0) {
                return true;
            }

            // Check if card matches any of the selected dietary preferences
            const matchesDietaryPreferences = activeDietaryPreferences.every((preference) => {
                return normalizedDietaryTags.includes(preference);
            });

            // Exclude a card if it doesn't match dietary prefs
            if (!matchesDietaryPreferences) {
                return false;
            }

            // Include card if it passes dietary preference check
            return true;
        });
    };

//----------------------------------------------------------------------

    // Function that toggles hamburger menu (for mobile)
    const toggleHamburger = () => {
        setHamburgerOpen(!isHamburgerOpen);

        // Target the mobile navbar
        const mobileNavbar = document.querySelector('.mobile-navbar-left');

        if (isHamburgerOpen) {
            // Set opacity and visibility to hidden before fully hiding
            mobileNavbar.style.top = "3.5vh";
            mobileNavbar.style.zIndex = "-1";
            mobileNavbar.style.opacity = '0';
            mobileNavbar.style.visibility = 'hidden';
            mobileNavbar.style.height = '0px';
        } else {
            // Make it visible first
            mobileNavbar.style.top = "7vh";
            mobileNavbar.style.zIndex = "0";
            mobileNavbar.style.visibility = 'visible';
            mobileNavbar.style.opacity = '1';
            mobileNavbar.style.height = '5vh';
        }
    }

//----------------------------------------------------------------------

    // Function that toggles small preferences menu (for mobile)
    const toggleSmallPreferences = () => {
        setPreferencesOpen(!isPreferencesOpen);

        // If mobile preferences button is open, display the hidden items
        const preferences = document.querySelector('.mobile-preferences-menu');
        
        if (isPreferencesOpen) {
            // Set visibility and opacity to hidden before hiding
            preferences.style.opacity = '0';
            preferences.style.visibility = 'hidden';
    
            // Use a timeout to hide after the transition ends
            setTimeout(() => {
                preferences.style.display = 'none';
            }, 300); // Matches the CSS transition duration
        } else {
            // Make it visible first
            preferences.style.display = 'flex';
    
            // Delay the opacity and visibility change to let it render
            setTimeout(() => {
                preferences.style.opacity = '1';
                preferences.style.visibility = 'visible';
            }, 0); // No delay to show immediately
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
                    <Link to="/post">
                        <button className="nav-button">
                            <img src={createIcon} alt="createIcon" height="12px" />
                        </button>
                    </Link>
                    {/* View my cards button */}
                    <Link to="/view">
                        <button className="nav-button">
                            View My Cards
                        </button>
                    </Link>
                    {/* Report bugs button */}
                    <button className="nav-button" onClick={toggleFeedbackModal}>
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
                            <span className="search-icon">
                                <img src={searchIcon} alt="SearchIcon" height="18px" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search for locations, titles, etc..."
                                value={searchInput}
                                onChange={handleSearch}
                                className="search-bar"
                            />
                        </div>
                    </form>
                </div>
            </nav>

            {/* Container for navbar buttons on mobile view */}
            <div className="mobile-navbar-left">
                {/* Create card button */}
                <Link to="/post">
                    <button className="nav-button">
                        <img src={createIcon} alt="createIcon" height="12px" />
                    </button>
                </Link>
                {/* View my cards button */}
                <Link to="/view">
                    <button className="nav-button">
                        View My Cards
                    </button>
                </Link>
                {/* Report bugs button */}
                <button className="nav-button" onClick={toggleFeedbackModal}>
                    Report Bugs...
                </button>
            </div>
            
            {/* Main content layout */}
            <main>
                {/* Div for left side content */}
                <div className="content-container">
                    {/* Welcome section */}
                    <div className="greeting">
                        <h1>{greeting} {net_id}, welcome to TigerFoodies!</h1>
                    </div>

                    {/* Div for preferences layout for when screen is smaller */}
                    <div className="smaller-preferences">
                        <button className="preferences-button" onClick={toggleSmallPreferences}>
                            <img src={preferencesIcon} alt="SearchIcon" height="15px" />
                        </button>
                    </div>
                    <aside className="mobile-preferences-menu">
                        {/* Section for dietary preferences */}
                        <div className="mobile-preferences-selection">
                            <h3>Preferences</h3>
                            <label>
                                <input type="checkbox" name="vegetarian" checked={foodFilters.dietary['vegetarian']} onChange={(filter) => handleFilter(filter, 'dietary')} />
                                Vegetarian
                            </label>
                            <label>
                                <input type="checkbox" name="vegan" checked={foodFilters.dietary['vegan']} onChange={(filter) => handleFilter(filter, 'dietary')} />
                                Vegan
                            </label>
                            <label>
                                <input type="checkbox" name="halal" checked={foodFilters.dietary['halal']} onChange={(filter) => handleFilter(filter, 'dietary')} />
                                Halal
                            </label>
                            <label>
                                <input type="checkbox" name="kosher" checked={foodFilters.dietary['kosher']} onChange={(filter) => handleFilter(filter, 'dietary')} />
                                Kosher
                            </label>
                            <label>
                                <input type="checkbox" name="gluten-free" checked={foodFilters.dietary['gluten-free']} onChange={(filter) => handleFilter(filter, 'dietary')} />
                                Gluten-Free
                            </label>
                        </div>

                        {/* Section for allergy filtering */}
                        <div className="mobile-preferences-selection">
                            <h3>Allergens</h3>
                            <label>
                                <input type="checkbox" name="nuts" checked={foodFilters.allergies['nuts']} onChange={(filter) => handleFilter(filter, 'allergies')} />
                                Nuts
                            </label>
                            <label>
                                <input type="checkbox" name="dairy" checked={foodFilters.allergies['dairy']} onChange={(filter) => handleFilter(filter, 'allergies')} />
                                Dairy
                            </label>
                            <label>
                                <input type="checkbox" name="shellfish" checked={foodFilters.allergies['shellfish']} onChange={(filter) => handleFilter(filter, 'allergies')} />
                                Shellfish
                            </label>
                        </div>
                    </aside>
                    
                    {/* Display list of active free food cards */}
                    <div className="card-list">
                        {filterCards().map((card) => (
                            <CardDisplay card = {card} net_id = {net_id}/>
                        ))}
                    </div>
                </div>
                
                {/* Right sidebar with dietary preferences and allergy filters */}
                <aside className="sidebar">
                    {/* Section for dietary preferences */}
                    <div className="food-preferences-selection">
                        <h3>Preferences</h3>
                        <label>
                            <input type="checkbox" name="vegetarian" checked={foodFilters.dietary['vegetarian']} onChange={(filter) => handleFilter(filter, 'dietary')} />
                            Vegetarian
                        </label>
                        <label>
                            <input type="checkbox" name="vegan" checked={foodFilters.dietary['vegan']} onChange={(filter) => handleFilter(filter, 'dietary')} />
                            Vegan
                        </label>
                        <label>
                            <input type="checkbox" name="halal" checked={foodFilters.dietary['halal']} onChange={(filter) => handleFilter(filter, 'dietary')} />
                            Halal
                        </label>
                        <label>
                            <input type="checkbox" name="kosher" checked={foodFilters.dietary['kosher']} onChange={(filter) => handleFilter(filter, 'dietary')} />
                            Kosher
                        </label>
                        <label>
                            <input type="checkbox" name="gluten-free" checked={foodFilters.dietary['gluten-free']} onChange={(filter) => handleFilter(filter, 'dietary')} />
                            Gluten-Free
                        </label>
                    </div>

                    {/* Section for allergy filtering */}
                    <div className="food-preferences-selection">
                        <h3>Allergens</h3>
                        <label>
                            <input type="checkbox" name="nuts" checked={foodFilters.allergies['nuts']} onChange={(filter) => handleFilter(filter, 'allergies')} />
                            Nuts
                        </label>
                        <label>
                            <input type="checkbox" name="dairy" checked={foodFilters.allergies['dairy']} onChange={(filter) => handleFilter(filter, 'allergies')} />
                            Dairy
                        </label>
                        <label>
                            <input type="checkbox" name="shellfish" checked={foodFilters.allergies['shellfish']} onChange={(filter) => handleFilter(filter, 'allergies')} />
                            Shellfish
                        </label>
                    </div>
                </aside>
            </main>

            {/* Feedback modal component */}
            <Feedback isModalActive={isFeedbackModalActive} setIsModalActive={setFeedbackModalActive} net_id={net_id} />

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
