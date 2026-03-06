import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import { getFirestore }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { getAuth }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDZEovu8hv6ms8dDiQN_GaXIf8BDM9kf5g",
  authDomain: "budgetly-6a559.firebaseapp.com",
  projectId: "budgetly-6a559",
  appId: "1:682783929618:web:d2ab6e0f01786e6980efcb"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

