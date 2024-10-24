// Imports
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import CreateEditCard from './pages/CreateEditCard';
import ViewCards from './pages/ViewCards';

//----------------------------------------------------------------------

// Set routes to each page
function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/post" element={<CreateEditCard />} />
          <Route path="/view" element={<ViewCards />} />
          <Route path="/edit/:card_id" element={<CreateEditCard />} />
        </Routes>
      </div>
    </Router>
  );
}

//----------------------------------------------------------------------
export default App;
