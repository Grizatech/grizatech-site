// GrizaTech V10 — Firebase centralizado (CDN / ES Modules)
// Este arquivo é público por natureza. A segurança real está nas Firestore Security Rules.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD0bz8NnqPg4IzGAkt_qCCp7rtBEYMdQO0",
  authDomain: "grizatech-site.firebaseapp.com",
  projectId: "grizatech-site",
  storageBucket: "grizatech-site.firebasestorage.app",
  messagingSenderId: "972092864215",
  appId: "1:972092864215:web:2a67dc001317af2baca292",
  measurementId: "G-JZ1GMDLLTE"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
