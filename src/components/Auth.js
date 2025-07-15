import React from 'react';
import { auth, provider, db } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const Auth = ({ user, setUser }) => {

  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const loggedInUser = result.user;

      // Check if user exists in Firestore, if not, create a new document
      const userRef = doc(db, 'Users', loggedInUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: loggedInUser.uid,
          displayName: loggedInUser.displayName,
          email: loggedInUser.email,
          photoURL: loggedInUser.photoURL,
          createdAt: new Date(),
          stats: { gamesPlayed: 0, wins: 0 },
        });
      }
      setUser(loggedInUser);
    } catch (error) {
      console.error("Error during sign-in:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error during sign-out:", error);
    }
  };

  return (
    <div className="auth-container">
      {user ? (
        <div className="user-info">
          <img src={user.photoURL} alt={user.displayName} className="profile-pic" />
          <span>{user.displayName}</span>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      ) : (
        <button onClick={handleSignIn}>Sign in with Google</button>
      )}
    </div>
  );
};

export default Auth;
