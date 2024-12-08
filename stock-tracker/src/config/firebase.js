import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCE_RPXEI7viicAANvTx5HPYBpdiAX63Ik",
  authDomain: "stock-tracker-587b4.firebaseapp.com",
  projectId: "stock-tracker-587b4",
  storageBucket: "stock-tracker-587b4.firebasestorage.app",
  messagingSenderId: "377244545737",
  appId: "1:377244545737:web:f485cf7c737dcb30fc1318",
  measurementId: "G-FYNPJLLM63"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

