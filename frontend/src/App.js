//----------------------------------------------------------------------
// App.js
// Authors: Anha Khan, Arika Hassan, Laiba Ali, Mark Gazzerro, Sami Dalu
//----------------------------------------------------------------------

// Imports
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Homepage from './pages/Homepage';
import CreateCard from './pages/CreateCard';
import ViewCards from './pages/ViewCards';
import EditCard from './pages/EditCard'

//----------------------------------------------------------------------

// Set routes to each page
function App() {
    // Define a state to store user's NetId
    const [net_id, setNetID] = useState('');
    
    // Assure user is CAS authenticated
    useEffect(() => {
        const authenticate = async () => {
            try {
                const response = await fetch(`/get_user`);
                const data = await response.json();
                if (data.net_id) {
                    setNetID(data.net_id);
                } else {
                    // Retry or prompt login if net_id is missing
                    console.warn('Net ID is not set, retrying...');
                    setTimeout(authenticate, 2000); // Retry after a delay
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        }
        
        authenticate();
    }, []);

    // Cleanup URL logic
    useEffect(() => {
        const url = new URL(window.location.href);
        if (url.searchParams.has('ticket')) {
            // Remove the "ticket" parameter and update the URL
            url.searchParams.delete('ticket');
            window.history.replaceState({}, document.title, url.pathname + url.search);
        }
    }, []); // This runs once when the app loads

    return (
        <Router>
            <div>
            <Routes>
                <Route path="/" element={<Homepage net_id={net_id}/>} />
                <Route path="/post" element={<CreateCard net_id={net_id}/>} />
                <Route path="/view" element={<ViewCards net_id={net_id}/>} />
                <Route path="/edit/:card_id" element={<EditCard/>} />

                {/* Fallback Route */}
                <Route path="*"element={<Navigate to="/" replace state={{ net_id }}/>}/>
            </Routes>
            </div>
        </Router>
    );
}

//----------------------------------------------------------------------
export default App;
