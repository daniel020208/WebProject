"use client"

import { useState, useEffect } from "react"
import { getAuth, updateProfile } from "firebase/auth"
import { getFirestore, doc, getDoc, updateDoc, setDoc } from "firebase/firestore"
import FormInput from "../components/FormInput"
import Button from "../components/Button"
import { useNavigate, useParams } from "react-router-dom"
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Globe, RefreshCw } from "lucide-react"

function Profile({ user }) {
  const auth = getAuth()
  const db = getFirestore()
  const { id } = useParams() // Get the id from URL params
  const [userData, setUserData] = useState({})
  const [editMode, setEditMode] = useState(false)
  const [editedData, setEditedData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const isOwnProfile = !id || (user && id === user.uid)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // If viewing someone else's profile
        const targetUserId = id || (user ? user.uid : null)
        if (!targetUserId) {
          setLoading(false)
          return
        }

        const userDoc = doc(db, "users", targetUserId)
        const userSnapshot = await getDoc(userDoc)

        if (userSnapshot.exists()) {
          const data = userSnapshot.data()
          setUserData(data)
          setEditedData({
            displayName: data.displayName || "",
            phoneNumber: data.phoneNumber || "",
            location: data.location || "",
            title: data.title || "",
            birthdate: data.birthdate || "",
            bio: data.bio || "",
            ...data,
          })
        } else if (isOwnProfile) {
          // Only create document if it's the user's own profile
          const initialData = {
            uid: user.uid,
            displayName: user.displayName || "",
            email: user.email || "",
            createdAt: new Date().toISOString(),
          }
          await setDoc(doc(db, "users", user.uid), initialData)
          setUserData(initialData)
          setEditedData(initialData)
        } else {
          setError("User not found")
        }
      } catch (err) {
        console.error("Error fetching user data:", err)
        setError("Failed to fetch user data")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user, db, id, isOwnProfile])

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
    if (!isOwnProfile) return

    try {
      const userDoc = doc(db, "users", user.uid)
      // Make sure we're not sending undefined values
      const dataToUpdate = Object.fromEntries(Object.entries(editedData).filter(([_, v]) => v !== undefined))
      await updateDoc(userDoc, dataToUpdate)

      // Only update displayName in Authentication profile
      if (editedData.displayName) {
        await updateProfile(auth.currentUser, { displayName: editedData.displayName })
      }

      setUserData(editedData)
      setEditMode(false)
    } catch (err) {
      console.error("Error updating profile:", err)
      setError("Failed to update profile")
    }
  }

  const handleCancel = () => {
    setEditMode(false)
    setEditedData(userData)
  }

  const resetProfilePicture = async () => {
    if (!isOwnProfile) return

    try {
      await updateProfile(auth.currentUser, { photoURL: null })
      // Force refresh the component
      setUserData((prev) => ({ ...prev, timestamp: Date.now() }))
    } catch (err) {
      console.error("Error resetting profile picture:", err)
      setError("Failed to reset profile picture")
    }
  }

  if (loading) {
    return <div className="text-center text-text-primary">Loading...</div>
  }

  if (!user && !id) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4 text-text-primary">Please log in to view profiles</h2>
        <Button onClick={() => navigate("/login")}>Go to Login</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto bg-secondary rounded-lg shadow-md overflow-hidden">
      <div className="md:flex">
        <div className="md:w-1/3 bg-primary p-6">
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <img
                src={
                  (isOwnProfile ? user.photoURL : userData.photoURL) ||
                  `https://api.dicebear.com/6.x/initials/svg?seed=${userData.displayName || "User"}`
                }
                alt="Profile"
                className="w-32 h-32 rounded-full mx-auto border-4 border-accent"
              />
              {isOwnProfile && !editMode && (
                <button
                  onClick={resetProfilePicture}
                  className="absolute bottom-0 right-0 bg-primary text-text-primary p-1 rounded-full border border-accent"
                  title="Reset profile picture"
                >
                  <RefreshCw size={16} />
                </button>
              )}
            </div>
            <h3 className="text-2xl font-semibold text-text-primary mb-2">
              {userData.displayName || "No name set"}
            </h3>
            <p className="text-text-secondary mb-4">{userData.title || "No title set"}</p>
            {isOwnProfile && !editMode && (
              <Button onClick={handleEdit} className="w-full">
                Edit Profile
              </Button>
            )}
          </div>
        </div>
        <div className="md:w-2/3 p-6">
          <h2 className="text-3xl font-bold mb-6 text-text-primary">
            {isOwnProfile ? "Your Profile" : "User Profile"}
          </h2>
          {error && <p className="text-error mb-4">{error}</p>}
          <form className="space-y-4">
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
              value={userData.email || ""}
              label="Email"
              disabled={true}
              icon={<Mail className="w-5 h-5 text-text-secondary" />}
            />
            {(isOwnProfile || userData.phoneNumber) && (
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
            )}
            {(isOwnProfile || userData.location) && (
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
            )}
            {(isOwnProfile || userData.title) && (
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
            )}
            {(isOwnProfile || userData.birthdate) && (
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
            )}
            {(isOwnProfile || userData.bio) && (
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
            )}
          </form>
          {editMode && (
            <div className="flex justify-end space-x-4 mt-6">
              <Button onClick={handleCancel} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile

