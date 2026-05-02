import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Lobby from './pages/Lobby';
import GameRoom from './pages/GameRoom';

export default function App() {
  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/room/:id" element={<GameRoom />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}
