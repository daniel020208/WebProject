import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, signOut } from 'firebase/auth';
import './Profile.css';

function Profile({ setCurrentPage }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [profilePicture, setProfilePicture] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setEditedData(data);
            setProfilePicture(user.photoURL || '/placeholder.svg?height=150&width=150');
          } else {
            setError('User data not found');
          }
        } else {
          setError('No authenticated user');
        }
      } catch (err) {
        setError('Error fetching user data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), editedData);
        await updateProfile(user, { displayName: editedData.displayName });
        setUserData(editedData);
        setEditMode(false);
      }
    } catch (err) {
      setError('Error updating user data');
      console.error(err);
    }
  };

  const handleCancel = () => {
    setEditedData(userData);
    setEditMode(false);
  };

  const handleChange = (e) => {
    setEditedData({ ...editedData, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const user = auth.currentUser;
        const storageRef = ref(storage, `profile_pictures/${user.uid}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        await updateProfile(user, { photoURL: downloadURL });
        setProfilePicture(downloadURL);
      } catch (err) {
        setError('Error uploading profile picture');
        console.error(err);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentPage('login');
    } catch (err) {
      setError('Error signing out');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="profile-loading">Loading...</div>;
  }

  if (error) {
    return <div className="profile-error">{error}</div>;
  }

  return (
    <div className="profile-container">
      <h2>User Profile</h2>
      {userData && (
        <div className="profile-info">
          <div className="profile-picture">
            <img src={profilePicture} alt="Profile" />
            {editMode && (
              <input type="file" accept="image/*" onChange={handleFileChange} />
            )}
          </div>
          <div className="profile-details">
            <div className="profile-item">
              <strong>Display Name:</strong>
              {editMode ? (
                <input
                  type="text"
                  name="displayName"
                  value={editedData.displayName}
                  onChange={handleChange}
                />
              ) : (
                userData.displayName
              )}
            </div>
            <div className="profile-item">
              <strong>Email:</strong> {userData.email}
            </div>
            <div className="profile-item">
              <strong>Phone Number:</strong>
              {editMode ? (
                <input
                  type="tel"
                  name="phoneNumber"
                  value={editedData.phoneNumber || ''}
                  onChange={handleChange}
                />
              ) : (
                userData.phoneNumber || 'Not provided'
              )}
            </div>
            <div className="profile-item">
              <strong>Account Created:</strong> {new Date(userData.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div className="profile-stats">
            <h3>Account Statistics</h3>
            <div className="stat-item">
              <strong>Stocks Tracked:</strong> {userData.stocks?.length || 0}
            </div>
            <div className="stat-item">
              <strong>Last Login:</strong> {userData.lastLogin ? new Date(userData.lastLogin).toLocaleString() : 'N/A'}
            </div>
            <div className="stat-item">
              <strong>Login Count:</strong> {userData.loginCount || 0}
            </div>
          </div>
          <div className="profile-actions">
            {editMode ? (
              <>
                <button onClick={handleSave}>Save</button>
                <button onClick={handleCancel}>Cancel</button>
              </>
            ) : (
              <button onClick={handleEdit}>Edit Profile</button>
            )}
          </div>
          <div className="sign-out-container">
            <button onClick={handleSignOut} className="sign-out-button">Sign Out</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;

