"use client"

import { useState, useEffect } from "react"
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore"
import { db } from "../config/firebase"
import { useNavigate } from "react-router-dom"
import { DataGrid } from "@mui/x-data-grid"
import Button from "../components/Button"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { createTheme, ThemeProvider } from "@mui/material/styles"

const ADMIN_EMAIL = "daniel.golod2008@gmail.com"

// Create a dark theme for MUI components
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#222",
      paper: "#222",
    },
    text: {
      primary: "#fff",
    },
  },
})

function AdminDashboard({ user }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [editedRole, setEditedRole] = useState("")
  const [userStats, setUserStats] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Verify user is signed in and is admin.
    if (!user || user.email !== ADMIN_EMAIL) {
      navigate("/dashboard")
      return
    }

    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, "users")
        const q = query(usersCollection, orderBy("createdAt", "desc"), limit(100))
        const usersSnapshot = await getDocs(q)
        const usersList = usersSnapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          const createdAt =
            data.createdAt && data.createdAt.toDate
              ? data.createdAt.toDate().toLocaleString()
              : "N/A"
          const lastLogin =
            data.lastLogin && data.lastLogin.toDate
              ? data.lastLogin.toDate().toLocaleString()
              : "N/A"

          if (createdAt === "N/A" || lastLogin === "N/A") {
            console.warn(`User ${docSnap.id} is missing valid timestamp fields.`)
          }
          return {
            id: docSnap.id, // DataGrid requires an "id" field
            displayName: data.displayName || "N/A",
            email: data.email || "N/A",
            createdAt,
            lastLogin,
            stocksCount: data.stocks ? data.stocks.length : 0,
            cryptosCount: data.cryptos ? data.cryptos.length : 0,
            role: data.role || "user",
          }
        })
        console.log("Fetched users:", usersList)
        setUsers(usersList)
        calculateUserStats(usersList)
      } catch (err) {
        console.error("Error fetching users:", err)
        setError("Failed to fetch users")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [user, navigate])

  const calculateUserStats = (usersList) => {
    if (usersList.length === 0) {
      setUserStats(null)
      return
    }
    const validUsers = usersList.filter(
      (u) => u.lastLogin !== "N/A" && !isNaN(new Date(u.lastLogin))
    )
    const totalUsers = usersList.length
    const activeUsers = validUsers.filter(
      (u) => new Date(u.lastLogin) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length
    const averageStocks = usersList.reduce((sum, u) => sum + u.stocksCount, 0) / totalUsers
    const averageCryptos = usersList.reduce((sum, u) => sum + u.cryptosCount, 0) / totalUsers

    const stats = [
      { name: "Total Users", value: totalUsers },
      { name: "Active Users (30 days)", value: activeUsers },
      { name: "Avg Stocks per User", value: averageStocks.toFixed(2) },
      { name: "Avg Cryptos per User", value: averageCryptos.toFixed(2) },
    ]
    console.log("Calculated stats:", stats)
    setUserStats(stats)
  }

  const handleViewUser = (userId) => {
    console.log("View user:", userId)
    // Ensure your router has a route like: /profile/:id
    navigate(`/profile/${userId}`)
  }

  const handleEditRole = (user) => {
    setSelectedUser(user)
    setEditedRole(user.role)
    setOpenDialog(true)
  }

  const handleSaveRole = async () => {
    if (selectedUser && editedRole) {
      try {
        const userRef = doc(db, "users", selectedUser.id)
        await updateDoc(userRef, { role: editedRole })
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id ? { ...u, role: editedRole } : u
          )
        )
        setOpenDialog(false)
      } catch (error) {
        console.error("Error updating user role:", error)
        setError("Failed to update user role")
      }
    }
  }

  const handleDeleteUser = async (userId) => {
    if (
      window.confirm("Are you sure you want to delete this user? This action cannot be undone.")
    ) {
      try {
        await deleteDoc(doc(db, "users", userId))
        setUsers((prev) => prev.filter((u) => u.id !== userId))
      } catch (error) {
        console.error("Error deleting user:", error)
        setError("Failed to delete user")
      }
    }
  }

  const columns = [
    { field: "displayName", headerName: "Name", width: 150 },
    { field: "email", headerName: "Email", width: 200 },
    { field: "createdAt", headerName: "Created At", width: 200 },
    { field: "lastLogin", headerName: "Last Login", width: 200 },
    { field: "stocksCount", headerName: "Stocks", width: 100 },
    { field: "cryptosCount", headerName: "Cryptos", width: 100 },
    { field: "role", headerName: "Role", width: 100 },
    {
      field: "actions",
      headerName: "Actions",
      width: 300,
      renderCell: (params) => (
        <div>
          <Button
            className="bg-accent text-white px-2 py-1 rounded-md hover:bg-accent-dark transition duration-300 mr-2"
            onClick={() => handleViewUser(params.row.id)}
          >
            View
          </Button>
          <Button
            className="bg-secondary text-text-primary px-2 py-1 rounded-md hover:bg-primary transition duration-300 mr-2"
            onClick={() => handleEditRole(params.row)}
          >
            Edit Role
          </Button>
          <Button
            className="bg-error text-white px-2 py-1 rounded-md hover:bg-red-700 transition duration-300"
            onClick={() => handleDeleteUser(params.row.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  if (loading) {
    return <div className="text-center text-text-primary p-6">Loading...</div>
  }

  if (error) {
    return <div className="text-center text-error p-6">{error}</div>
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="p-6 max-w-7xl mx-auto bg-secondary rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-text-primary">Admin Dashboard</h1>

        {userStats ? (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-text-primary">User Statistics</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mb-8 text-text-primary">No user statistics available.</div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-text-primary">User Management</h2>
          <div style={{ height: 400, width: "100%" }}>
            <DataGrid
              rows={users}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5, 10, 20]}
              checkboxSelection
              disableSelectionOnClick
              sx={{
                backgroundColor: darkTheme.palette.background.paper,
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: "#1F1F1F",
                  color: darkTheme.palette.text.primary,
                },
                '& .MuiDataGrid-cell': {
                  color: darkTheme.palette.text.primary,
                },
              }}
            />
          </div>
        </div>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Edit User Role</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Role"
              type="text"
              fullWidth
              value={editedRole}
              onChange={(e) => setEditedRole(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} className="text-text-primary">
              Cancel
            </Button>
            <Button onClick={handleSaveRole} className="bg-accent text-white">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </ThemeProvider>
  )
}

export default AdminDashboard

