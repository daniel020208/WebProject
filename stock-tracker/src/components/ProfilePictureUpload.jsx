

import { useState } from "react"
import { updateProfile } from "firebase/auth"
import { auth } from "../config/firebase.js"


const CLOUDINARY_UPLOAD_PRESET = "your_upload_preset"
const CLOUDINARY_CLOUD_NAME = "your_cloud_name"

function ProfilePictureUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.")
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET)

      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload image")
      }

      const data = await response.json()
      const imageUrl = data.secure_url

      const user = auth.currentUser
      if (!user) throw new Error("No authenticated user found.")

      await updateProfile(user, { photoURL: imageUrl })

      setFile(null)
      if (onUploadSuccess) onUploadSuccess(imageUrl)
    } catch (error) {
      console.error("Error uploading file:", error)
      setError("Failed to upload file. Please try again.")
    } finally {
      setUploading(false)
    }
  }

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
      <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
        {uploading ? "Uploading..." : "Upload Profile Picture"}
      </Button>
      {error && <p className="text-error">{error}</p>}
    </div>
  )
}

export default ProfilePictureUpload

