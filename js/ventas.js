import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBvluKIuZRR3CDlGeJSa6qYF0pAdgCpnBE",
    authDomain: "proyectclothes-b6e88.firebaseapp.com",
    projectId: "proyectclothes-b6e88",
    storageBucket: "proyectclothes-b6e88.firebasestorage.app",
    messagingSenderId: "973366577223",
    appId: "1:973366577223:web:66403424635d1300de4962",
    measurementId: "G-E7SX5N778J"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Reference to the "ventas" collection in Firestore
const ventasCollection = collection(db, "ventas");

// Container for the sales cards
const ventasContainer = document.getElementById('ventas-container');

// Fetch and display sales
async function loadVentas() {
    try {
        // Create a query to order sales by saleDate (timestamp)
        const ventasQuery = query(ventasCollection, orderBy("saleDate", "desc"));
        const querySnapshot = await getDocs(ventasQuery);
        ventasContainer.innerHTML = ''; // Clear any existing content

        querySnapshot.forEach(doc => {
            const venta = doc.data();
            const card = document.createElement('div');
            card.className = 'venta-card';
            
            // Ensure saleDate is properly converted to Date
            const saleDate = new Date(venta.saleDate.seconds * 1000);
            const formattedDate = saleDate.toLocaleString(); // This gives you both date and time

            // Sort items by their dateAdded field (if it exists)
            if (venta.items && venta.items.length > 0) {
                // Check if the items have the 'dateAdded' field
                venta.items.sort((a, b) => {
                    if (a.dateAdded && b.dateAdded) {
                        return new Date(b.dateAdded.seconds * 1000) - new Date(a.dateAdded.seconds * 1000); // Sort by dateAdded
                    }
                    return 0; // No sorting if the 'dateAdded' field is missing in any item
                });
            }

            card.innerHTML = `
                <div class="card-header">
                    <h3>Venta ID: ${doc.id}</h3>
                    <p class="status ${venta.paymentStatus === 'Sin Pagar' ? 'unpaid' : 'paid'}">${venta.paymentStatus}</p>
                </div>
                <div class="card-body">
                    <p><strong>Cliente:</strong> ${venta.customerName}</p>
                    <p><strong>Teléfono:</strong> ${venta.customerPhone}</p>
                    <p><strong>Dirección:</strong> ${venta.customerAddress}</p>
                    <p><strong>Fecha:</strong> ${new Date(venta.saleDate.seconds * 1000).toLocaleString()}</p>
                    <p><strong>Comentarios:</strong> ${venta.comments || 'Ninguno'}</p>
                </div>
                <div class="card-footer">
                    <h4>Items:</h4>
                    <ul>
                        ${venta.items.map(item => `<li>${item.nombre} - ${item.cantidad}x $${item.precio}</li>`).join('')}
                    </ul>
                    <p><strong>Total:</strong> $${venta.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0).toFixed(2)}</p>
                    ${venta.paymentStatus === 'Sin Pagar' ? `<p><strong>Faltan:</strong> $${venta.fiadoAmount}</p>` : ''}
                </div>
            `;
            ventasContainer.appendChild(card);
        });


    } catch (error) {
        console.error("Error fetching ventas:", error);
        ventasContainer.innerHTML = `<p>Error loading ventas. Please try again later.</p>`;
    }
}

// Load ventas on page load
document.addEventListener('DOMContentLoaded', loadVentas);


