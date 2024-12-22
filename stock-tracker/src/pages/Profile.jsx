import React, { useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import ProfilePictureUpload from '../components/ProfilePictureUpload';

function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData({ ...data, photoURL: user.photoURL });
            setEditedData({ ...data, photoURL: user.photoURL });
          } else {
            // Create a new user document if it doesn't exist
            const newUserData = {
              email: user.email,
              displayName: user.displayName || '',
              phoneNumber: user.phoneNumber || '',
              createdAt: new Date().toISOString(),
              stocks: []
            };
            await setDoc(userDocRef, newUserData);
            setUserData({ ...newUserData, photoURL: user.photoURL });
            setEditedData({ ...newUserData, photoURL: user.photoURL });
          }
        } else {
          setError('No authenticated user');
          navigate('/login');
        }
      } catch (err) {
        setError('Error fetching user data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

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

  const handleProfilePictureUpload = (downloadURL) => {
    setUserData({ ...userData, photoURL: downloadURL });
    setEditedData({ ...editedData, photoURL: downloadURL });
  };

  if (loading) {
    return <div className="text-center text-text-primary text-xl mt-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-error text-xl mt-8">{error}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-secondary rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-text-primary">User Profile</h2>
      {userData && (
        <div className="space-y-6">
          <div className="flex flex-col items-center">
            <img 
              src={userData.photoURL || '/placeholder.svg?height=150&width=150'} 
              alt="Profile" 
              className="w-32 h-32 rounded-full object-cover mb-4"
            />
            {editMode && (
              <ProfilePictureUpload onUploadSuccess={handleProfilePictureUpload} />
            )}
          </div>
          <div className="space-y-4">
            <FormInput
              type="text"
              id="displayName"
              name="displayName"
              value={editMode ? editedData.displayName : userData.displayName}
              onChange={handleChange}
              label="Display Name"
              disabled={!editMode}
            />
            <FormInput
              type="email"
              id="email"
              name="email"
              value={userData.email}
              label="Email"
              disabled={true}
            />
            <FormInput
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={editMode ? editedData.phoneNumber : (userData.phoneNumber || '')}
              onChange={handleChange}
              label="Phone Number"
              disabled={!editMode}
            />
          </div>
          <div className="flex justify-center space-x-4">
            {editMode ? (
              <>
                <Button onClick={handleSave}>Save</Button>
                <Button onClick={handleCancel}>Cancel</Button>
              </>
            ) : (
              <Button onClick={handleEdit}>Edit Profile</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;

