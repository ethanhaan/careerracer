import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Auth from './components/Auth';
import GameLobby from './components/GameLobby';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>CareerRacer</h1>
        <Auth user={user} setUser={setUser} />
      </header>
      <main>
        {user ? (
          <GameLobby user={user} />
        ) : (
          <p>Please sign in to join or create a game.</p>
        )}
      </main>
    </div>
  );
}

export default App;

