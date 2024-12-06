//----------------------------------------------------------------------
// Homepage.js
// Authors: Anha Khan, Arika Hassan, Laiba Ali, Mark Gazzerro, Sami Dalu
//----------------------------------------------------------------------

// Import statements
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Homepage.css'; // Import custom CSS file
import searchIcon from './media/search.svg';
import createIcon from './media/create.svg';
import hamburgerIcon from './media/hamburger.svg';
import preferencesIcon from './media/preferences.svg';
import dietaryPreferencesIcon from './media/dietary-preferences.svg';
import allergensIcon from './media/allergens.svg';
import CardDisplay from './CardDisplay';
import Feedback from './Feedback';

//----------------------------------------------------------------------

// Utility function to determine the greeting based on the current time
// of day
const getGreeting = () => {
    // Create a current data object, returns time in UTC
    const currentDate = new Date();

    // Convert UTC time to Eastern Time (Princeton's timezone)
    const estOffset = -5; // UTC-5 for EST
    const edtOffset = -4; // UTC-4 for EDT

    // Checks whether it is currently daylight savings time
    const isDaylightSaving = currentDate.toLocaleString(
        'en-US', { timeZoneName: 'short'}).includes('EDT');
    // Set offset accordingly
    const offset = isDaylightSaving ? edtOffset : estOffset;

    // Adjusts timezone to Eastern Time
    const timeOfDay = new Date(
        currentDate.getTime() + offset * 60 * 60 * 1000).getUTCHours();

    // Return appropriate greeting based on time of day
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
    // State to store user's search input
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
    // List of cards filtered by user search input and preferences
    const [filteredCards, setFilteredCards] = useState([]);
    // State that stores whether mobile hamburger menu is open
    const [isHamburgerOpen, setHamburgerOpen] = useState(false);
    // State that stores whether mobile preferences is open
    const [isPreferencesOpen, setPreferencesOpen] = useState(false);
    // State for feedback modal visibility
    const [isFeedbackModalActive, setFeedbackModalActive] = 
        useState(false);
    // Reference for interval polling
    const intervalIDRef = useRef(null);

//----------------------------------------------------------------------

    // Function that toggles feedback modal visibility
    const toggleFeedbackModal = () => 
        setFeedbackModalActive(!isFeedbackModalActive);

//----------------------------------------------------------------------

    // Hook that fetches cards and sets greeting when the component
    // mounts
    useEffect(() => {
        // Set greeting message
        setGreeting(getGreeting());

        // Fetch free food listings
        const fetchCards = async () => {
            try{
                const response = await fetch(`/api/cards`);
                const data = await response.json();
                setCards(data); // Store fetched data
                setFilteredCards(data); // Initialize filtered cards
            } catch(error) {
                // Catch any errors related to fetching listings
                console.error('Error fetching cards:', error);
            }
        };

        // Initial fetch
        fetchCards();

        // Poll the backend for new cards every 60 seconds
        const startPolling = () => {
            intervalIDRef.current = setInterval(fetchCards, 60000)
        };
        startPolling();

        // Cleanup interval on component unmount
        return () => {
            if (intervalIDRef.current) {
                clearInterval(intervalIDRef.current);
            }
        }
    }, []);

//----------------------------------------------------------------------

    // Function that handles the search functionality
    const handleSearch = (event) => {
        // Normalize search input
        const query = event.target.value.toLowerCase();
        // Update search input state
        setSearchInput(query);
        // Update filtered cards 
        setFilteredCards(filterCards());
    }

//----------------------------------------------------------------------

    // Function that toggles dietary filters and allergen filters
    // checkboxes
    const handleFilter = (filter, type) => {
        // Extract name and checked state of a specific filter
        const { name, checked } = filter.target;

        setFoodFilters((prevFoodFilters) => ({
            ...prevFoodFilters, // Preserve existing filters
            [type]: {
                ...prevFoodFilters[type],
                [name]: checked, // Update the selected filter
            },
        }));
    };

//----------------------------------------------------------------------

    // Function to filter cards based on search query and preferences
    const filterCards = () => {
        return cards.filter((card) => {
            // Ensure allergies and dietary tags are arrays
            const cardAllergies = Array.isArray(card.allergies) ? 
                card.allergies : [];
            const cardDietaryTags = Array.isArray(card.dietary_tags) ? 
                card.dietary_tags : [];

            // Normalize data for case sensitivity
            const normalizedAllergies = cardAllergies.map((a) => 
                a.toLowerCase());
            const normalizedDietaryTags = cardDietaryTags.map((tag) => 
                tag.toLowerCase());
            
            // Search filtering functionality
            if (searchInput.trim() !== '') {
                const combinedCardText = [
                    card.title,
                    card.location,
                    ...card.dietary_tags,
                    ...card.allergies
                ].join(' ').toLowerCase(); // Combine and normalize text
                                            // for matching
                
               // Exclude card that doesn't match search query
                if (!combinedCardText.includes(searchInput.toLowerCase())) {
                    return false;
                }
            }

            // Allergen filtering
            const selectedAllergens = Object.keys(
                foodFilters.allergies).filter((allergen) => 
                    foodFilters.allergies[allergen]
            ).map((a) => a.toLowerCase()); // Normalize data for case
                                            // sensitivity

            if (selectedAllergens.length > 0) {
                const hasAllergen = selectedAllergens.some((allergen) =>
                    normalizedAllergies.includes(allergen)
                );
                // Exclude card if it has selected allergen
                if (hasAllergen) {
                    return false;
                }
            }

            // Dietary preference filtering
            const activeDietaryPreferences = Object.keys(
                foodFilters.dietary).filter((preference) => 
                    foodFilters.dietary[preference]
            ).map((p) => p.toLowerCase()); // Normalize data for case
                                            // sensitivity

            // No dietary preferences selected, 
            // include all cards that pass the allergen check
            if (activeDietaryPreferences.length === 0) {
                return true;
            }

            // Check if card matches any of the selected dietary 
            // preferences
            const matchesDietaryPreferences = 
                    activeDietaryPreferences.every((preference) => {
                return normalizedDietaryTags.includes(preference);
            });

            // Exclude a card if it doesn't match dietary preferences
            if (!matchesDietaryPreferences) {
                return false;
            }

            // Include card if it passes dietary preference check
            return true;
        });
    };

//----------------------------------------------------------------------

    // Function that toggles mobile hamburger menu
    const toggleHamburger = () => {
        setHamburgerOpen(!isHamburgerOpen);

        // Target the mobile navbar
        const mobileNavbar = 
            document.querySelector('.mobile-navbar-left');
        
        // Define styles based on navbar visibility
        if (isHamburgerOpen) {
            mobileNavbar.style.top = "3.5vh";
            mobileNavbar.style.zIndex = "-1";
            mobileNavbar.style.opacity = '0';
            mobileNavbar.style.visibility = 'hidden';
            mobileNavbar.style.height = '0px';
        } else {
            mobileNavbar.style.top = "7vh";
            mobileNavbar.style.zIndex = "0";
            mobileNavbar.style.visibility = 'visible';
            mobileNavbar.style.opacity = '1';
            mobileNavbar.style.height = '5vh';
        }
    }

//----------------------------------------------------------------------

    // Function that toggles mobile preferences menu
    const toggleSmallPreferences = () => {
        setPreferencesOpen(!isPreferencesOpen);

        // Target preferences navbar
        const preferences = 
            document.querySelector('.mobile-preferences-menu');
        
        // Define styles based on menu visibility
        if (isPreferencesOpen) {
            preferences.style.opacity = '0';
            preferences.style.visibility = 'hidden';
            setTimeout(() => {
                preferences.style.display = 'none';
            }, 300);
        } else {
            preferences.style.display = 'flex';
            setTimeout(() => {
                preferences.style.opacity = '1';
                preferences.style.visibility = 'visible';
            }, 0);
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
                            <img src={createIcon}
                                alt="createIcon"
                                height="12px" />
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
                    {/* Hamburger icon */}
                    <button className="nav-button nav-menu-open" onClick={toggleHamburger}>
                        <img src={hamburgerIcon}
                            alt="Open Menu"
                            height="15px" />
                    </button>
                    
                    {/* Search bar */}
                    <form onSubmit={handleSearch} className="search-form">
                        <div className="search-container">
                            <span className="search-icon">
                                <img src={searchIcon}
                                    alt="SearchIcon"
                                    height="18px" />
                            </span>
                            <input
                                type="text"
                                placeholder=
                            "Search for locations, titles, etc..."
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
                        <img src={createIcon}
                            alt="createIcon"
                            height="12px" />
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
                    {/* Greeting message */}
                    <div className="greeting">
                        <h1>{greeting} {net_id}, welcome to TigerFoodies!</h1>
                    </div>

                    {/* Mobile preferences menu */}
                    <div className="smaller-preferences">
                        <button className="preferences-button" onClick={toggleSmallPreferences}>
                            <img src={preferencesIcon}
                                alt="SearchIcon"
                                height="15px" />
                        </button>
                    </div>

                    {/* Filtering menu for smaller screens */}
                    <aside className="mobile-preferences-menu">
                        {/* Dietary preferences filtering */}
                        <div className="mobile-preferences-selection">
                            <div className="mobile-preferences-header">
                                <h3>Preferences</h3>
                                <img src={dietaryPreferencesIcon}
                                    alt="Dietary Preferences"
                                    height="18px"/>
                            </div>
                            <label>
                                <input type="checkbox"
                                    name="vegetarian" 
                                    checked={foodFilters.dietary['vegetarian']} 
                                    onChange={(filter) => handleFilter(filter, 'dietary')} 
                                />
                                Vegetarian
                            </label>
                            <label>
                                <input type="checkbox"
                                    name="vegan"
                                    checked={foodFilters.dietary['vegan']}
                                    onChange={(filter) => handleFilter(filter, 'dietary')} 
                                />
                                Vegan
                            </label>
                            <label>
                                <input type="checkbox"
                                    name="halal" 
                                    checked={foodFilters.dietary['halal']} 
                                    onChange={(filter) => handleFilter(filter, 'dietary')} 
                                />
                                Halal
                            </label>
                            <label>
                                <input type="checkbox"
                                    name="kosher"
                                    checked={foodFilters.dietary['kosher']}
                                    onChange={(filter) => handleFilter(filter, 'dietary')}
                                />
                                Kosher
                            </label>
                            <label>
                                <input type="checkbox"
                                    name="gluten-free" 
                                    checked={foodFilters.dietary['gluten-free']}
                                    onChange={(filter) => handleFilter(filter, 'dietary')} 
                                />
                                Gluten-Free
                            </label>
                        </div>
                        {/* Allergens filtering */}
                        <div className="mobile-preferences-selection">
                            <div className="mobile-preferences-header">
                                <h3>Allergens</h3>
                                <img src={allergensIcon} alt="Allergens" height="18px" />
                            </div>
                            <label>
                                <input type="checkbox"
                                    name="nuts" 
                                    checked={foodFilters.allergies['nuts']} 
                                    onChange={(filter) => handleFilter(filter, 'allergies')} 
                                />
                                Nuts
                            </label>
                            <label>
                                <input type="checkbox"
                                    name="dairy" 
                                    checked={foodFilters.allergies['dairy']} 
                                    onChange={(filter) => handleFilter(filter, 'allergies')} 
                                />
                                Dairy
                            </label>
                            <label>
                                <input type="checkbox"
                                    name="shellfish" 
                                    checked={foodFilters.allergies['shellfish']}
                                    onChange={(filter) => handleFilter(filter, 'allergies')} 
                                />
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
                
                {/* Sidebar food filtering */}
                <aside className="sidebar">
                    {/* Dietary preferences filtering */}
                    <div className="food-preferences-selection">
                        <div className="preferences-header">
                            <h3>Preferences</h3>
                            <img src={dietaryPreferencesIcon} 
                                alt="Dietary Preferences" 
                                height="18px"
                            />
                        </div>
                        <label>
                            <input type="checkbox"
                                name="vegetarian"
                                checked={foodFilters.dietary['vegetarian']} 
                                onChange={(filter) => handleFilter(filter, 'dietary')} 
                            />
                            Vegetarian
                        </label>
                        <label>
                            <input type="checkbox"
                                name="vegan"
                                checked={foodFilters.dietary['vegan']}
                                onChange={(filter) => handleFilter(filter, 'dietary')} 
                            />
                            Vegan
                        </label>
                        <label>
                            <input type="checkbox"
                                name="halal" 
                                checked={foodFilters.dietary['halal']}
                                onChange={(filter) => handleFilter(filter, 'dietary')} 
                            />
                            Halal
                        </label>
                        <label>
                            <input type="checkbox" 
                                name="kosher" 
                                checked={foodFilters.dietary['kosher']}
                                onChange={(filter) => handleFilter(filter, 'dietary')} 
                            />
                            Kosher
                        </label>
                        <label>
                            <input type="checkbox"
                                name="gluten-free" 
                                checked={foodFilters.dietary['gluten-free']}
                                onChange={(filter) => handleFilter(filter, 'dietary')}
                            />
                            Gluten-Free
                        </label>
                    </div>
                    {/* Allergen filtering */}
                    <div className="food-preferences-selection">
                        <div className="preferences-header">
                            <h3>Allergens</h3>
                            <img src={allergensIcon}
                                alt="Allergens" 
                                height="18px"
                            />
                        </div>
                        <label>
                            <input type="checkbox"
                                name="nuts"
                                checked={foodFilters.allergies['nuts']}
                                onChange={(filter) => handleFilter(filter, 'allergies')} 
                            />
                            Nuts
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                name="dairy" 
                                checked={foodFilters.allergies['dairy']}
                                onChange={(filter) => handleFilter(filter, 'allergies')}
                            />
                            Dairy
                        </label>
                        <label>
                            <input type="checkbox"
                                name="shellfish"
                                checked={foodFilters.allergies['shellfish']}
                                onChange={(filter) => handleFilter(filter, 'allergies')} 
                            />
                            Shellfish
                        </label>
                    </div>
                </aside>
            </main>

            {/* Feedback modal component */}
            <Feedback isModalActive={isFeedbackModalActive} 
                setIsModalActive={setFeedbackModalActive} 
                net_id={net_id}
            />

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

export default Homepage;
