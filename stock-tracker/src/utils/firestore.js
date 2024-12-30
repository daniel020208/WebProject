import { db } from '../config/firebase';
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

function saveUserStocks(userId, stocks) {
  return setDoc(doc(db, "users", userId), { stocks }, { merge: true })
    .catch(error => {
      console.error("Error saving stocks:", error);
      throw error;
    });
}

function getUserStocks(userId) {
  return getDoc(doc(db, "users", userId))
    .then(docSnap => {
      if (docSnap.exists()) {
        return docSnap.data().stocks || [];
      } else {
        return [];
      }
    })
    .catch(error => {
      console.error("Error getting stocks:", error);
      throw error;
    });
}

async function saveUserCryptos(userId, cryptos) {
  try {
    await updateDoc(doc(db, "users", userId), { cryptos });
  } catch (error) {
    console.error("Error saving cryptos:", error);
    throw error;
  }
}

async function getUserCryptos(userId) {
  try {
    const docSnap = await getDoc(doc(db, "users", userId));
    if (docSnap.exists()) {
      return docSnap.data().cryptos || [];
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error getting cryptos:", error);
    throw error;
  }
}


export { saveUserStocks, getUserStocks, saveUserCryptos, getUserCryptos };

