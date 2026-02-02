import { WatchPartyProvider, useWatchParty } from './contexts/WatchPartyContext';
import { HomePage } from './components/HomePage';
import { WatchRoom } from './components/WatchRoom';

function AppContent() {
  const { room } = useWatchParty();

  return room ? <WatchRoom /> : <HomePage />;
}

function App() {
  return (
    <WatchPartyProvider>
      <AppContent />
    </WatchPartyProvider>
  );
}

export default App;
