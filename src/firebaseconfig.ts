import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDC45bsbiyd_I1GAMoRNJTdp-NNvGqLuzY",
  authDomain: "catch-a-copy.firebaseapp.com",
  projectId: "catch-a-copy",
  storageBucket: "catch-a-copy.firebasestorage.app",
  messagingSenderId: "1042424424393",
  appId: "1:1042424424393:web:87c59f91cb60c0b1b06a18",
  measurementId: "G-NP1LPVPSBY"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // This is the "bridge" to your shop list
export const storage = getStorage(app); // For document uploads