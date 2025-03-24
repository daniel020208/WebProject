import { db } from "../config/firebase"
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore"

function saveUserStocks(userId, stocks) {
  return setDoc(doc(db, "users", userId), { stocks }, { merge: true }).catch((error) => {
    console.error("Error saving stocks:", error)
    throw error
  })
}

function getUserStocks(userId) {
  return getDoc(doc(db, "users", userId))
    .then((docSnap) => {
      if (docSnap.exists()) {
        return docSnap.data().stocks || []
      } else {
        // Create the user document if it doesn't exist
        setDoc(
          doc(db, "users", userId),
          {
            uid: userId,
            stocks: [],
            cryptos: [],
            createdAt: new Date().toISOString(),
          },
          { merge: true },
        )
        return []
      }
    })
    .catch((error) => {
      console.error("Error getting stocks:", error)
      return [] // Return empty array instead of throwing
    })
}

async function saveUserCryptos(userId, cryptos) {
  try {
    await updateDoc(doc(db, "users", userId), { cryptos })
  } catch (error) {
    console.error("Error saving cryptos:", error)
    throw error
  }
}

async function getUserCryptos(userId) {
  try {
    const docSnap = await getDoc(doc(db, "users", userId))
    if (docSnap.exists()) {
      return docSnap.data().cryptos || []
    } else {
      // Create the user document if it doesn't exist
      await setDoc(
        doc(db, "users", userId),
        {
          uid: userId,
          stocks: [],
          cryptos: [],
          createdAt: new Date().toISOString(),
        },
        { merge: true },
      )
      return []
    }
  } catch (error) {
    console.error("Error getting cryptos:", error)
    return [] // Return empty array instead of throwing
  }
}

export { saveUserStocks, getUserStocks, saveUserCryptos, getUserCryptos }

