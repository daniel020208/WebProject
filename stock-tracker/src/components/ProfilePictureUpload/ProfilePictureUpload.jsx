import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { auth, storage } from '../../config/firebase';
import Button from '../Button/Button';
import './ProfilePictureUpload.css';

function ProfilePictureUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user found.');

      const fileRef = ref(storage, `profile_pictures/${user.uid}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);

      await updateProfile(user, { photoURL: downloadURL });

      setFile(null);
      if (onUploadSuccess) onUploadSuccess(downloadURL);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-picture-upload">
      <input type="file" onChange={handleFileChange} accept="image/*" />
      <Button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload Profile Picture'}
      </Button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default ProfilePictureUpload;

