"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore"
import { db } from "../config/firebase"
import { useNavigate } from "react-router-dom"
import { DataGrid } from "@mui/x-data-grid"
import Button from "../components/Button"

const ADMIN_EMAIL = "daniel.golod2008@gmail.com"

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
        const q = query(usersCollection, orderBy("createdAt", "desc"), limit(100))
        const usersSnapshot = await getDocs(q)
        const usersList = usersSnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            displayName: data.displayName || "N/A",
            email: data.email || "N/A",
            createdAt: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toLocaleString() : "N/A",
            lastLogin: data.lastLogin && data.lastLogin.toDate ? data.lastLogin.toDate().toLocaleString() : "N/A",
            stocksCount: data.stocks ? data.stocks.length : 0,
            cryptosCount: data.cryptos ? data.cryptos.length : 0,
          }
        })
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

  const columns = [
    { field: "displayName", headerName: "Name", width: 150 },
    { field: "email", headerName: "Email", width: 200 },
    { field: "createdAt", headerName: "Created At", width: 200 },
    { field: "lastLogin", headerName: "Last Login", width: 200 },
    { field: "stocksCount", headerName: "Stocks", width: 100 },
    { field: "cryptosCount", headerName: "Cryptos", width: 100 },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params) => (
        <Button
          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition duration-300"
          onClick={() => handleViewUser(params.row.id)}
        >
          View Details
        </Button>
      ),
    },
  ]

  const handleViewUser = (userId) => {
    navigate(`/profile/${userId}`)
  }

  if (loading) {
    return <div className="text-center text-text-primary">Loading...</div>
  }

  if (error) {
    return <div className="text-center text-error">{error}</div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Admin Dashboard</h1>
      <div className="bg-gray-100 p-4 rounded-lg shadow-md">
        <div style={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={users}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5]}
            checkboxSelection
            disableSelectionOnClick
            className="bg-gray-100 text-gray-900"
          />
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard

