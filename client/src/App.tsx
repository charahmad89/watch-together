import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WatchPartyProvider, useWatchParty } from './contexts/WatchPartyContext';
import { AuthProvider } from './contexts/AuthContext';
import { LandingPage } from './components/LandingPage';
import { WatchRoom } from './components/WatchRoom';
import { AuthPage } from './components/AuthPage';
import { MovieLibrary } from './components/MovieLibrary';
import { Dashboard } from './components/Dashboard';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

function AppContent() {
  const { room } = useWatchParty();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={room ? <Navigate to="/watch" /> : <LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/movies" element={<MovieLibrary />} />
          <Route path="/profile" element={<Dashboard />} />
          <Route path="/watch" element={room ? <WatchRoom /> : <Navigate to="/" />} />
        </Routes>
      </div>
      {!room && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <WatchPartyProvider>
          <AppContent />
        </WatchPartyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
