import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../config/firebase"
import { useNavigate } from "react-router-dom"

const ADMIN_EMAIL = "daniel.golod2008@gmail.com" // Replace with your desired admin email

function AdminDashboard({ user }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) {
      navigate("/dashboard")
      return
    }

    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, "users")
        const usersSnapshot = await getDocs(usersCollection)
        const usersList = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setUsers(usersList)
      } catch (err) {
        console.error("Error fetching users:", err)
        setError("Failed to fetch users")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [user, navigate])

  if (loading) {
    return <div className="text-center text-text-primary">Loading...</div>
  }

  if (error) {
    return <div className="text-center text-error">{error}</div>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-secondary rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-text-primary">Admin Dashboard</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-primary">
              <th className="p-2 border-b border-gray-700">Name</th>
              <th className="p-2 border-b border-gray-700">Email</th>
              <th className="p-2 border-b border-gray-700">Created At</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-primary">
                <td className="p-2 border-b border-gray-700">{user.displayName}</td>
                <td className="p-2 border-b border-gray-700">{user.email}</td>
                <td className="p-2 border-b border-gray-700">{new Date(user.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminDashboard

