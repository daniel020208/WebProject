import { db } from '../config/firebase';
import { doc, setDoc, getDoc } from "firebase/firestore";

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

export { saveUserStocks, getUserStocks };

