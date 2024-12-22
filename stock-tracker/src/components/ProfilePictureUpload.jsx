import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { auth, storage } from '../config/firebase';
import Button from './Button';

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
    <div className="space-y-4">
      <input 
        type="file" 
        onChange={handleFileChange} 
        accept="image/*" 
        className="block w-full text-sm text-text-primary
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-accent file:text-white
          hover:file:bg-accent-dark"
      />
      <Button 
        onClick={handleUpload} 
        disabled={!file || uploading}
        className="w-full"
      >
        {uploading ? 'Uploading...' : 'Upload Profile Picture'}
      </Button>
      {error && <p className="text-error">{error}</p>}
    </div>
  );
}

export default ProfilePictureUpload;

