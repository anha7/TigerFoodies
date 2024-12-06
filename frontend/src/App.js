//----------------------------------------------------------------------
// App.js
// Authors: Anha Khan, Arika Hassan, Laiba Ali, Mark Gazzerro, Sami Dalu
//----------------------------------------------------------------------

// Import statements
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } 
    from 'react-router-dom';
import Homepage from './pages/Homepage';
import CreateCard from './pages/CreateCard';
import ViewCards from './pages/ViewCards';
import EditCard from './pages/EditCard'

//----------------------------------------------------------------------

// Set routes to each page
function App() {
    // Define a state to store user's NetId
    const [net_id, setNetID] = useState('');
    
    // Ensure user is CAS authenticated on component mount
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
                    // Retry after a delay
                    setTimeout(authenticate, 1000);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        }
        
        authenticate();
    }, []);

    // Logic to clean up URL on component mount
    useEffect(() => {
        const url = new URL(window.location.href);
        if (url.searchParams.has('ticket')) {
            // Remove the "ticket" parameter and update the URL
            url.searchParams.delete('ticket');
            window.history.replaceState({},
                document.title, url.pathname + url.search);
        }
    }, []);

    // Define valid routes
    return (
        <Router>
            <div>
                <Routes>
                    {/* Homepage Route */}
                    <Route path="/" element={<Homepage
                        net_id={net_id}/>} />
                    {/* Card Creation Route */}
                    <Route path="/post" element={<CreateCard 
                        net_id={net_id}/>} />
                    {/* View Your Own Card's Route */}
                    <Route path="/view" element={<ViewCards
                        net_id={net_id}/>} />
                    {/* Editing Card Route */}
                    <Route path="/edit/:card_id" 
                        element={<EditCard/>} />
                    {/* Fallback Route */}
                    <Route path="*"element={<Navigate to="/" 
                        replace state={{ net_id }}/>}/>
                </Routes>
            </div>
        </Router>
    );
}

//----------------------------------------------------------------------

export default App;