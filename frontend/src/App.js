// Imports
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import CreateEditCard from './pages/CreateEditCard';
import ViewCards from './pages/ViewCards';

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
                    const CAS_LOGIN_URL = `https://fed.princeton.edu/cas/login?service=${encodeURIComponent(window.location.href)}` // Redirect if not authenticated
                    window.location.href = CAS_LOGIN_URL;
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        }
        
        authenticate();
    }, []);

    return (
        <Router>
            <div>
            <Routes>
                <Route path="/" element={<Homepage net_id={net_id}/>} />
                <Route path="/post" element={<CreateEditCard net_id={net_id}/>} />
                <Route path="/view" element={<ViewCards net_id={net_id}/>} />
                <Route path="/edit/:card_id" element={<CreateEditCard net_id={net_id}/>} />
            </Routes>
            </div>
        </Router>
    );
}

//----------------------------------------------------------------------
export default App;
