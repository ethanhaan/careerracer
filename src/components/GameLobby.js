import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, onSnapshot, updateDoc, arrayUnion, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';

const DEFAULT_GAME_DURATION = 30; // seconds

const GameLobby = ({ user }) => {
  const [gameId, setGameId] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [joinInput, setJoinInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_GAME_DURATION);

  // Main listener for game data
  useEffect(() => {
    if (!gameId) return;
    const gameRef = doc(db, 'GameRooms-CareerRacer', gameId);
    const unsubscribe = onSnapshot(gameRef, (doc) => {
      if (doc.exists()) {
        setGameData({ id: doc.id, ...doc.data() });
      } else {
        console.log('Game room not found or was deleted.');
        setGameId(null);
        setGameData(null);
      }
    });
    return () => unsubscribe();
  }, [gameId]);

  // Client-side timer logic
  useEffect(() => {
    if (gameData?.status !== 'in-progress') {
      setTimeLeft(DEFAULT_GAME_DURATION);
      return;
    }

    const interval = setInterval(() => {
      const startTime = gameData.gameStartTime?.toDate().getTime();
      if (!startTime) return;

      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, DEFAULT_GAME_DURATION - elapsed);
      setTimeLeft(Math.round(remaining));

      if (remaining === 0 && gameData.hostId === user.uid) {
        const gameRef = doc(db, 'GameRooms-CareerRacer', gameId);
        updateDoc(gameRef, { status: 'finished' });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameData, gameId, user.uid]);

  // Non-host logic for handling host leaving
  useEffect(() => {
    if (gameData && gameData.hostId !== user.uid) {
      const hostInGame = gameData.players.some(p => p.uid === gameData.hostId);
      if (!hostInGame) {
        console.log('Host has left the game. Leaving lobby.');
        setGameId(null);
        setGameData(null);
      }
    }
  }, [gameData, user.uid]);

  const handleCreateGame = async () => {
    const newGame = {
      hostId: user.uid,
      status: 'waiting',
      players: [{ uid: user.uid, displayName: user.displayName, photoURL: user.photoURL, score: 0 }],
      createdAt: serverTimestamp(),
      questionSetId: 'javascript-basics',
    };
    const docRef = await addDoc(collection(db, 'GameRooms-CareerRacer'), newGame);
    setGameId(docRef.id);
  };

  const handleJoinGame = async (idToJoin) => {
    if (!idToJoin) return;
    const gameRef = doc(db, 'GameRooms-CareerRacer', idToJoin);
    const gameSnap = await getDoc(gameRef);
    if (gameSnap.exists()) {
      const gameStatus = gameSnap.data().status;
      if (gameStatus !== 'waiting') {
        alert(`Cannot join, game is ${gameStatus}.`);
        return;
      }
      const hostInGame = gameSnap.data().players.some(p => p.uid === gameSnap.data().hostId);
      if (!hostInGame) {
        alert('Cannot join, the host has left the game.');
        return;
      }
      await updateDoc(gameRef, {
        players: arrayUnion({ uid: user.uid, displayName: user.displayName, photoURL: user.photoURL, score: 0 })
      });
      setGameId(idToJoin);
    } else {
      alert('Game room not found!');
    }
  };

  const handleStartGame = async () => {
    const gameRef = doc(db, 'GameRooms-CareerRacer', gameId);
    await updateDoc(gameRef, { status: 'in-progress', gameStartTime: serverTimestamp() });
  };

  const handleUpdateScore = useCallback(async (increment) => {
    const gameRef = doc(db, 'GameRooms-CareerRacer', gameId);
    try {
      await runTransaction(db, async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists()) throw new Error("Game does not exist!");
        const players = gameDoc.data().players;
        const playerIndex = players.findIndex(p => p.uid === user.uid);
        if (playerIndex > -1) {
          players[playerIndex].score += increment;
          transaction.update(gameRef, { players });
        }
      });
    } catch (e) {
      console.error("Transaction failed: ", e);
    }
  }, [gameId, user.uid]);

  return (
    <div className="game-lobby">
      {!gameData ? (
        <div className="join-create-section">
          <button onClick={handleCreateGame}>Create New Game</button>
          <hr />
          <div>
            <input 
              type="text" 
              placeholder="Enter Game ID" 
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value)}
            />
            <button onClick={() => handleJoinGame(joinInput)}>Join Game</button>
          </div>
        </div>
      ) : (
        <div className="game-room">
          <h2>Game Room</h2>
          <p>Game ID: <strong>{gameData.id}</strong></p>

          {(gameData.status === 'in-progress' || gameData.status === 'finished') && <h3>Time Remaining: {timeLeft}s</h3>}
          {gameData.status === 'finished' && <h2>Game Over!</h2>}

          {gameData.status === 'in-progress' && (
            <div className="score-buttons">
              <button onClick={() => handleUpdateScore(1)}>+</button>
              <button onClick={() => handleUpdateScore(-1)}>-</button>
            </div>
          )}

          <h3>Players:</h3>
          <ul>
            {gameData.players.map(player => (
              <li key={player.uid} className="player-item">
                <img src={player.photoURL} alt={player.displayName} className="profile-pic-small" />
                <span>{player.displayName}: {player.score}</span>
              </li>
            ))}
          </ul>

          {gameData.hostId === user.uid && gameData.status === 'waiting' && gameData.players.length >= 2 && (
            <button onClick={handleStartGame} className="start-button">Start Game</button>
          )}
        </div>
      )}
    </div>
  );
};

export default GameLobby;
