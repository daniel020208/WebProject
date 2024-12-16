import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCBzLqdIAXLsaUZU9e5LhJRs3OAmAfKZUI",
  authDomain: "stock-tracker-7a87a.firebaseapp.com",
  databaseURL: "https://stock-tracker-7a87a-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "stock-tracker-7a87a",
  storageBucket: "stock-tracker-7a87a.firebasestorage.app",
  messagingSenderId: "436136550947",
  appId: "1:436136550947:web:30e59d287e3d06291e4796",
  measurementId: "G-W8B38MB3ZM"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);


