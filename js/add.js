// Import Firebase SDKs and Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
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

// Initialize Firestore
const db = getFirestore(app);
console.log("Firebase App Initialized: ", app);
console.log("Firestore Initialized: ", db);

// Function to load categories dynamically
function loadCategories() {
    getDocs(collection(db, "inventario")).then((querySnapshot) => {
        const categoriaSelect = document.getElementById('categoria');
        const categories = new Set(); // To store unique categories

        querySnapshot.forEach((docSnapshot) => {
            const itemData = docSnapshot.data();
            if (itemData.categoria) {
                categories.add(itemData.categoria); // Add category to the set
            }
        });

        // Clear existing categories in the select and add default option
        categoriaSelect.innerHTML = '<option value="">Selecciona una categoría</option>';

        // Add categories dynamically to the select element
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoriaSelect.appendChild(option);
        });

    }).catch(error => {
        console.error("Error fetching categories from Firestore:", error);
    });
}
document.getElementById('add-new-category-checkbox').addEventListener('change', function() {
    const newCategoryInput = document.getElementById('new-category');
    const categoriaSelect = document.getElementById('categoria');
    
    if (this.checked) {
        // Hide the category dropdown and show the new category input
        categoriaSelect.style.display = 'none'; // Hide the dropdown
        newCategoryInput.style.display = 'inline-block'; // Show the input field
        categoriaSelect.removeAttribute('required'); // Remove required from select
        newCategoryInput.setAttribute('required', 'required'); // Make new category input required
    } else {
        // Show the category dropdown and hide the new category input
        categoriaSelect.style.display = 'inline-block'; // Show the dropdown
        newCategoryInput.style.display = 'none'; // Hide the input field
        newCategoryInput.removeAttribute('required'); // Remove required from input
        categoriaSelect.setAttribute('required', 'required'); // Add required to select
    }
});
// Add item to Firestore when form is submitted
document.addEventListener('DOMContentLoaded', () => {
    // Load categories when the page is loaded
    loadCategories();

    // Check if we are on the add_item.html page
    if (window.location.pathname.includes('add_item.html')) {
        const form = document.getElementById('form-agregar');
        
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                const isLoggedIn = sessionStorage.getItem("isLoggedIn");
                if (!isLoggedIn || isLoggedIn !== "true") {
                    alert("You must be logged in to delete items.");
                    return;
                }
                // Get form values
                let codigoCatalogo = document.getElementById('codigoCatalogo').value;
                let nombre = document.getElementById('nombre').value;
                let marca = document.getElementById('marca').value;
                let categoria = document.getElementById('categoria').value;
                let cantidad = document.getElementById('cantidad').value;
                let precio = document.getElementById('precio').value;
                let talle = document.getElementById('talle').value; // New field
                let color = document.getElementById('color').value; // New field

                const newCategoryInput = document.getElementById('new-category');
                if (document.getElementById('add-new-category-checkbox').checked) {
                    categoria = newCategoryInput.value.trim();
                    if (!categoria) {
                        alert('Please enter a new category.');
                        return;
                    }
                }
                // Ensure category is selected
                if (!categoria) {
                    alert('Por favor selecciona una categoría.');
                    return;
                }

                // Create new document in Firestore
                try {
                    await addDoc(collection(db, "inventario"), {
                        codigoCatalogo: codigoCatalogo || "",  // Handling Catalog Code
                        nombre: nombre || "Sin nombre",  // Default if not provided
                        marca: marca || "Sin marca",  // Default if not provided
                        categoria: categoria || "Sin categoría",  // Default if not provided
                        talle: talle || "Unico",  // Default if not provided
                        color: color || "Sin color",  // Default if not provided
                        cantidad: parseInt(cantidad) || 0,  // Ensure valid quantity
                        precio: parseFloat(precio.replace("$", "").trim()) || 0,
                        authToken: "authenticated",
                        createdAt: serverTimestamp()  // Clean price and parse it
                    });

                    // Clear form after successful submission
                    form.reset();
                    alert('Prenda agregada exitosamente!');
                } catch (error) {
                    console.error("Error adding document: ", error);
                }
            });
        }
    }
});
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();

    // Pre-fill form with data from URL parameters
    const params = new URLSearchParams(window.location.search);

    document.getElementById('codigoCatalogo').value = params.get('codigoCatalogo') || '';
    document.getElementById('nombre').value = params.get('nombre') || '';
    document.getElementById('marca').value = params.get('marca') || '';
    document.getElementById('categoria').value = params.get('categoria') || '';
    document.getElementById('cantidad').value = params.get('cantidad') || '';
    document.getElementById('precio').value = params.get('precio') || '';
    document.getElementById('talle').value = params.get('talle') || '';
    document.getElementById('color').value = params.get('color') || '';

    // Attach form submission handler
    const form = document.getElementById('form-agregar');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            // Your existing form submission logic
        });
    }
});