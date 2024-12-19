import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import './Settings.css';

function Settings() {
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setDisplayName(userData.displayName || '');
            setPhoneNumber(userData.phoneNumber || '');
            setEmail(userData.email || '');
            setCreatedAt(userData.createdAt || '');
          } else {
            setMessage('No user data found.');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setMessage('Failed to load user data.');
        }
      } else {
        setMessage('No authenticated user.');
      }
      setIsLoading(false);
    };

    fetchUserData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          displayName,
          phoneNumber,
          email
        });
        setMessage('Profile updated successfully.');
      } catch (error) {
        setMessage('Error updating profile.');
        console.error('Error updating profile:', error);
      }
    } else {
      setMessage('No authenticated user.');
    }
  };

  if (isLoading) {
    return <p>Loading user data...</p>;
  }

  return (
    <div className="settings">
      <h2>User Settings</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="displayName">Display Name:</label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number:</label>
          <input
            type="tel"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="createdAt">Account Created At:</label>
          <input
            type="text"
            id="createdAt"
            value={new Date(createdAt).toLocaleString() || 'N/A'}
            disabled
          />
        </div>
        <button type="submit">Update Profile</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default Settings;

