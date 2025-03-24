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
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { Users, UserCheck, TrendingUp, Database, RefreshCw, Edit2, Trash2, Eye } from "lucide-react"

const ADMIN_EMAIL = "daniel.golod2008@gmail.com"

// Create a dark theme for MUI components
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#1a1a1a",
      paper: "#262626",
    },
    primary: {
      main: "#8884d8",
    },
    secondary: {
      main: "#82ca9d",
    },
    text: {
      primary: "#ffffff",
      secondary: "#b3b3b3",
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#262626",
          borderRadius: "12px",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
        },
      },
    },
  },
})

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"]

function AdminDashboard({ user }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [editedRole, setEditedRole] = useState("")
  const [userStats, setUserStats] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()

  const fetchUsers = async () => {
    try {
      setRefreshing(true)
      const usersCollection = collection(db, "users")
      const q = query(usersCollection, orderBy("createdAt", "desc"), limit(100))
      const usersSnapshot = await getDocs(q)
      const usersList = usersSnapshot.docs.map((docSnap) => {
        const data = docSnap.data()
        
        // Helper function to format timestamp
        const formatTimestamp = (timestamp) => {
          if (!timestamp) return "N/A"
          // Handle Firestore Timestamp
          if (timestamp?.toDate instanceof Function) {
            return timestamp.toDate().toLocaleString()
          }
          // Handle regular Date object
          if (timestamp instanceof Date) {
            return timestamp.toLocaleString()
          }
          // Handle timestamp in seconds or milliseconds
          if (typeof timestamp === 'number') {
            return new Date(timestamp * (timestamp < 1e12 ? 1000 : 1)).toLocaleString()
          }
          // Handle string timestamp
          if (typeof timestamp === 'string') {
            const date = new Date(timestamp)
            return isNaN(date.getTime()) ? "N/A" : date.toLocaleString()
          }
          return "N/A"
        }

        // Helper function to check if user is active
        const isUserActive = (lastLogin) => {
          if (!lastLogin) return false
          let loginDate
          if (lastLogin?.toDate instanceof Function) {
            loginDate = lastLogin.toDate()
          } else if (lastLogin instanceof Date) {
            loginDate = lastLogin
          } else if (typeof lastLogin === 'number') {
            loginDate = new Date(lastLogin * (lastLogin < 1e12 ? 1000 : 1))
          } else if (typeof lastLogin === 'string') {
            loginDate = new Date(lastLogin)
          }
          
          if (!loginDate || isNaN(loginDate.getTime())) return false
          return loginDate > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }

        return {
          id: docSnap.id,
          displayName: data.displayName || "N/A",
          email: data.email || "N/A",
          createdAt: formatTimestamp(data.createdAt),
          lastLogin: formatTimestamp(data.lastLogin),
          stocksCount: Array.isArray(data.stocks) ? data.stocks.length : 0,
          cryptosCount: Array.isArray(data.cryptos) ? data.cryptos.length : 0,
          role: data.role || "user",
          status: isUserActive(data.lastLogin) ? "active" : "inactive",
        }
      })
      
      console.log("Processed users:", usersList)
      setUsers(usersList)
      calculateUserStats(usersList)
    } catch (err) {
      console.error("Error fetching users:", err)
      setError(`Failed to fetch users: ${err.message}`)
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) {
      navigate("/dashboard")
      return
    }
    fetchUsers()
  }, [user, navigate])

  const calculateUserStats = (usersList) => {
    if (!usersList.length) {
      setUserStats(null)
      return
    }

    const totalUsers = usersList.length
    const activeUsers = usersList.filter((u) => u.status === "active").length
    const totalStocks = usersList.reduce((sum, u) => sum + u.stocksCount, 0)
    const totalCryptos = usersList.reduce((sum, u) => sum + u.cryptosCount, 0)

    const stats = [
      {
        title: "Total Users",
        value: totalUsers,
        icon: <Users className="w-6 h-6" />,
        color: COLORS[0],
      },
      {
        title: "Active Users",
        value: activeUsers,
        icon: <UserCheck className="w-6 h-6" />,
        color: COLORS[1],
      },
      {
        title: "Total Stocks",
        value: totalStocks,
        icon: <TrendingUp className="w-6 h-6" />,
        color: COLORS[2],
      },
      {
        title: "Total Cryptos",
        value: totalCryptos,
        icon: <Database className="w-6 h-6" />,
        color: COLORS[3],
      },
    ]

    const pieData = [
      { name: "Active Users", value: activeUsers },
      { name: "Inactive Users", value: totalUsers - activeUsers },
    ]

    setUserStats({ stats, pieData })
  }

  const handleViewUser = (userId) => {
    navigate(`/profile/${userId}`)
  }

  const handleEditRole = (user) => {
    setSelectedUser(user)
    setEditedRole(user.role)
    setOpenDialog(true)
  }

  const handleSaveRole = async () => {
    if (!selectedUser || !editedRole) return

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

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }

    try {
      await deleteDoc(doc(db, "users", userId))
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch (error) {
      console.error("Error deleting user:", error)
      setError("Failed to delete user")
    }
  }

  const columns = [
    {
      field: "displayName",
      headerName: "Name",
      width: 150,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <span>{params.value}</span>
        </div>
      ),
    },
    { field: "email", headerName: "Email", width: 200 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === "active" ? "success" : "default"}
          size="small"
        />
      ),
    },
    { field: "stocksCount", headerName: "Stocks", width: 100 },
    { field: "cryptosCount", headerName: "Cryptos", width: 100 },
    { field: "role", headerName: "Role", width: 100 },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <Tooltip title="View Profile">
            <IconButton
              size="small"
              onClick={() => handleViewUser(params.row.id)}
              className="text-blue-500 hover:text-blue-600"
            >
              <Eye className="w-5 h-5" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Role">
            <IconButton
              size="small"
              onClick={() => handleEditRole(params.row)}
              className="text-yellow-500 hover:text-yellow-600"
            >
              <Edit2 className="w-5 h-5" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete User">
            <IconButton
              size="small"
              onClick={() => handleDeleteUser(params.row.id)}
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="w-5 h-5" />
            </IconButton>
          </Tooltip>
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-12 h-12 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button
            onClick={fetchUsers}
            disabled={refreshing}
            className="flex items-center gap-2 bg-accent hover:bg-accent-dark text-white"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>

        {error && (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        )}

        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {userStats.stats.map((stat, index) => (
              <Card key={stat.title} className="bg-secondary">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <Typography variant="h6" component="div" gutterBottom>
                        {stat.title}
                      </Typography>
                      <Typography variant="h4" component="div">
                        {stat.value}
                      </Typography>
                    </div>
                    <div
                      className="p-3 rounded-full"
                      style={{ backgroundColor: `${stat.color}30` }}
                    >
                      {stat.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {userStats && (
            <>
              <Card className="bg-secondary">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    User Activity
                  </Typography>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={userStats.pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label
                        >
                          {userStats.pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-secondary">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Asset Distribution
                  </Typography>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            name: "Stocks",
                            value: userStats.stats[2].value,
                          },
                          {
                            name: "Cryptos",
                            value: userStats.stats[3].value,
                          },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Card className="bg-secondary">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              User Management
            </Typography>
            <div style={{ height: 400, width: "100%" }}>
              <DataGrid
                rows={users}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 20]}
                checkboxSelection
                disableSelectionOnClick
                className="bg-secondary"
              />
            </div>
          </CardContent>
        </Card>

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

