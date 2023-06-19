import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PongGame from './PongGame';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/pong" element={<PongGame />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
