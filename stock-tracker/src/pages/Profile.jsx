import { useState, useEffect } from "react"
import { getAuth, updateProfile } from "firebase/auth"
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import FormInput from "../Components/FormInput"
import Button from "../components/Button"
import { useNavigate } from "react-router-dom"
import { Camera, Mail, Phone, MapPin, Briefcase, Calendar, Globe, User, Shield } from "lucide-react"

const Profile = ({ user }) => {
  const auth = getAuth()
  const db = getFirestore()
  const storage = getStorage()

  const [userData, setUserData] = useState({})
  const [editMode, setEditMode] = useState(false)
  const [editedData, setEditedData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [profileImage, setProfileImage] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = doc(db, "users", user.uid)
          const userSnapshot = await getDoc(userDoc)
          if (userSnapshot.exists()) {
            const data = userSnapshot.data()
            setUserData(data)
            setEditedData(data)
          }
          setProfileImage(user.photoURL)
        } catch (err) {
          setError("Failed to fetch user data")
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user, db])

  const handleEdit = () => {
    setEditMode(true)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setEditedData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleSave = async () => {
    if (user) {
      try {
        const userDoc = doc(db, "users", user.uid)
        await updateDoc(userDoc, editedData)
        await updateProfile(user, { displayName: editedData.displayName })
        setUserData(editedData)
        setEditMode(false)
      } catch (err) {
        setError("Failed to update profile")
      }
    }
  }

  const handleCancel = () => {
    setEditMode(false)
    setEditedData(userData)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (file && user) {
      try {
        const storageRef = ref(storage, `profile_pictures/${user.uid}`)
        await uploadBytes(storageRef, file)
        const downloadURL = await getDownloadURL(storageRef)
        await updateProfile(user, { photoURL: downloadURL })
        setProfileImage(downloadURL)

        // Update Firestore with the new photo URL
        const userDoc = doc(db, "users", user.uid)
        await updateDoc(userDoc, { photoURL: downloadURL })
      } catch (err) {
        setError("Failed to upload image")
      }
    }
  }

  

  if (loading) {
    return <div className="text-center text-text-primary">Loading...</div>
  }

  if (!user) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4 text-text-primary">Please log in to view your profile</h2>
        <Button onClick={() => navigate("/login")}>Go to Login</Button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-secondary rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-text-primary">Profile</h2>
      {error && <p className="text-error mb-4">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="mb-6 text-center">
            <div className="relative inline-block">
              <img
                src={profileImage || "/placeholder.svg?height=200&width=200"}
                alt="Profile"
                className="w-48 h-48 rounded-full mx-auto mb-4 object-cover"
              />
              <label
                htmlFor="profile-image-upload"
                className="absolute bottom-0 right-0 bg-accent hover:bg-accent-dark text-white rounded-full p-2 cursor-pointer"
              >
                <Camera size={24} />
              </label>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="profile-image-upload"
            />
          </div>
          <h3 className="text-2xl font-semibold text-center text-text-primary mb-2">
            {userData.displayName || user.displayName}
          </h3>
          <p className="text-text-secondary text-center mb-4">{userData.title || "No title set"}</p>
          <div className="flex justify-center space-x-2 mb-6">
            {editMode ? (
              <>
                <Button onClick={handleSave}>Save</Button>
                <Button onClick={handleCancel} variant="outline">
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={handleEdit}>Edit Profile</Button>
            )}
          </div>
          
        </div>
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              type="text"
              id="displayName"
              name="displayName"
              value={editMode ? editedData.displayName : userData.displayName || ""}
              onChange={handleChange}
              label="Display Name"
              disabled={!editMode}
              icon={<User className="w-5 h-5 text-text-secondary" />}
            />
            <FormInput
              type="email"
              id="email"
              name="email"
              value={user.email}
              label="Email"
              disabled={true}
              icon={<Mail className="w-5 h-5 text-text-secondary" />}
            />
            <FormInput
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={editMode ? editedData.phoneNumber : userData.phoneNumber || ""}
              onChange={handleChange}
              label="Phone Number"
              disabled={!editMode}
              icon={<Phone className="w-5 h-5 text-text-secondary" />}
            />
            <FormInput
              type="text"
              id="location"
              name="location"
              value={editMode ? editedData.location : userData.location || ""}
              onChange={handleChange}
              label="Location"
              disabled={!editMode}
              icon={<MapPin className="w-5 h-5 text-text-secondary" />}
            />
            <FormInput
              type="text"
              id="title"
              name="title"
              value={editMode ? editedData.title : userData.title || ""}
              onChange={handleChange}
              label="Job Title"
              disabled={!editMode}
              icon={<Briefcase className="w-5 h-5 text-text-secondary" />}
            />
            <FormInput
              type="date"
              id="birthdate"
              name="birthdate"
              value={editMode ? editedData.birthdate : userData.birthdate || ""}
              onChange={handleChange}
              label="Birthdate"
              disabled={!editMode}
              icon={<Calendar className="w-5 h-5 text-text-secondary" />}
            />
            <FormInput
              type="text"
              id="role"
              name="role"
              value={userData.role || ""}
              label="User Role"
              disabled={true}
              icon={<Shield className="w-5 h-5 text-text-secondary" />}
            />
          </div>
          <div>
            <FormInput
              type="text"
              id="bio"
              name="bio"
              value={editMode ? editedData.bio : userData.bio || ""}
              onChange={handleChange}
              label="Bio"
              disabled={!editMode}
              icon={<Globe className="w-5 h-5 text-text-secondary" />}
              textarea
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile

