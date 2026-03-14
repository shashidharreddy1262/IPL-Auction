import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './app/LandingPage';
import AuctionRoomPage from './app/AuctionRoomPage';
import RoomResultsPage from './app/RoomResultsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/room/:roomId" element={<AuctionRoomPage />} />
        <Route path="/results/:roomId" element={<RoomResultsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

