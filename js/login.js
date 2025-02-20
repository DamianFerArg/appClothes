import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBvluKIuZRR3CDlGeJSa6qYF0pAdgCpnBE",
    authDomain: "proyectclothes-b6e88.firebaseapp.com",
    projectId: "proyectclothes-b6e88",
    storageBucket: "proyectclothes-b6e88.appspot.com",
    messagingSenderId: "973366577223",
    appId: "1:973366577223:web:66403424635d1300de4962",
    measurementId: "G-E7SX5N778J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Login form submission
document.getElementById('login-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    // Get entered username and password
    const enteredUsername = document.getElementById('username').value;
    const enteredPassword = document.getElementById('password').value;

    // Query Firestore for the user
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", enteredUsername));
    const querySnapshot = await getDocs(q);

    let isAuthenticated = false;

    querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.password === enteredPassword) {
            isAuthenticated = true;
        }
    });

    if (isAuthenticated) {
        // Save login state
        sessionStorage.setItem("isLoggedIn", "true");

        // Redirect to inventory page
        window.location.href = "index.html";
    } else {
        document.getElementById('login-error').classList.remove('hidden');
    }
});
