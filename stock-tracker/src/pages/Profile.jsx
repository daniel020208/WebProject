"use client"

import { useState, useEffect } from "react"
import { getAuth, updateProfile } from "firebase/auth"
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore"
import FormInput from "../components/FormInput"
import Button from "../components/Button"
import { useNavigate } from "react-router-dom"
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Globe } from "lucide-react"

function Profile({ user }) {
  const auth = getAuth()
  const db = getFirestore()

  const [userData, setUserData] = useState({})
  const [editMode, setEditMode] = useState(false)
  const [editedData, setEditedData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
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
    <div className="max-w-4xl mx-auto bg-secondary rounded-lg shadow-md overflow-hidden">
      <div className="md:flex">
        <div className="md:w-1/3 bg-primary p-6">
          <div className="text-center">
            <img
              src={user.photoURL || `https://api.dicebear.com/6.x/initials/svg?seed=${user.displayName}`}
              alt="Profile"
              className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-accent"
            />
            <h3 className="text-2xl font-semibold text-text-primary mb-2">
              {userData.displayName || user.displayName}
            </h3>
            <p className="text-text-secondary mb-4">{userData.title || "No title set"}</p>
            {!editMode && (
              <Button onClick={handleEdit} className="w-full">
                Edit Profile
              </Button>
            )}
          </div>
        </div>
        <div className="md:w-2/3 p-6">
          <h2 className="text-3xl font-bold mb-6 text-text-primary">Profile Information</h2>
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
              id="bio"
              name="bio"
              value={editMode ? editedData.bio : userData.bio || ""}
              onChange={handleChange}
              label="Bio"
              disabled={!editMode}
              icon={<Globe className="w-5 h-5 text-text-secondary" />}
              textarea
            />
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

