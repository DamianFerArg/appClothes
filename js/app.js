// Import Firebase SDKs and Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, addDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

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

// Initialize Firebase and Firestore}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// window.addEventListener('beforeunload', function (event) {
//     // Check if the user is trying to leave the current page and navigate to the "ventas" page
//     const currentPage = window.location.pathname;
//     const ventasPage = "/index.html"; // Update with your "ventas" page path

//     // If the user is not trying to leave for the "ventas" page, show the confirmation
//     if (currentPage !== ventasPage) {
//         const confirmationMessage = "¿Seguro que quieres salir?";
//         event.returnValue = confirmationMessage;
//         return confirmationMessage;
//     }
// });
//------------------------------------------------------------------------------------------LOAD CATEGORIES & ITEMS
async function populateEditCategories() {
    try {
        const categorySet = new Set();

        // Fetch all items from Firestore to extract unique categories
        const querySnapshot = await getDocs(collection(db, "inventario"));
        querySnapshot.forEach((doc) => {
            const item = doc.data();
            if (item.categoria) {
                categorySet.add(item.categoria); // Add category to the Set
            }
        });

        // Select the edit-categoria dropdown
        const editCategoriaSelect = document.getElementById("edit-categoria");

        // Clear any existing options
        editCategoriaSelect.innerHTML = "";

        // Add options dynamically
        categorySet.forEach((category) => {
            const option = document.createElement("option");
            option.value = category;
            option.textContent = category;
            editCategoriaSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error populating categories in edit form:", error);
    }
}

// Call this function when the edit modal opens
document.addEventListener("DOMContentLoaded", () => {
    const editOverlay = document.getElementById("edit-overlay");

    // Add an event listener to trigger category population when the overlay is shown
    editOverlay.addEventListener("show", populateEditCategories);
});
// Function to load categories dynamically from Firestore
function loadCategories() {
    getDocs(collection(db, "inventario")).then((querySnapshot) => {
        const categoriaSelect = document.getElementById('categoria-select');
        const categories = new Set(); // To store unique categories

        querySnapshot.forEach((docSnapshot) => {
            const itemData = docSnapshot.data();
            if (itemData.categoria) {
                categories.add(itemData.categoria); // Add category to the set
            }
        });

        // Clear existing categories in the select
        categoriaSelect.innerHTML = '<option value="all">Todos</option>'; // Reset to "Todos"

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

// Call loadCategories when the page is loaded or whenever necessary
loadCategories();

// Filter items based on selected category
document.getElementById('categoria-select').addEventListener('change', function() {
    const selectedCategory = this.value;

    document.querySelectorAll('#item-list .card').forEach(item => {
        item.style.display = (selectedCategory === 'all' || item.dataset.category === selectedCategory) ? 'block' : 'none';
    });
});
// Function to load items from Firestore and display them
function loadItems() {
    getDocs(collection(db, "inventario")).then((querySnapshot) => {
        const itemList = document.getElementById('item-list');
        itemList.innerHTML = ''; // Clear existing items

        querySnapshot.forEach((docSnapshot) => {
            const itemData = docSnapshot.data();
            const itemId = docSnapshot.id;

            const itemCard = document.createElement('div');
            itemCard.className = 'card';
            itemCard.dataset.category = itemData.categoria; // Category for filtering
            itemCard.dataset.name = itemData.nombre.toLowerCase(); // Add name data for searching

            const itemDataWithId = { ...itemData, id: itemId }; 
            // Update the item card to display new fields
            itemCard.innerHTML = `
            <img src="${itemData.imageUrl || 'https://via.placeholder.com/150'}" alt="${itemData.nombre}" class="item-image">
                <h3>${itemData.nombre}</h3>
                <p>CodCatalogo: ${itemData.codigoCatalogo}</p>
                <p>Categoría: ${itemData.categoria}</p>
                <p>Marca: ${itemData.marca}</p>
                <p>Talle: ${itemData.talle}</p>
                <p>Color: ${itemData.color}</p>
                <p>Cantidad: ${itemData.cantidad}</p>
                <p>Precio: $${itemData.precio} pesos</p>
                <button class="edit-btn" data-id="${itemId}">Editar</button>
                <button class="add-similar-btn" data-item='${JSON.stringify(itemData)}'>Agregar Prenda Similar</button>
                <button class="add-to-cart-btn" data-item='${JSON.stringify(itemDataWithId)}'>Agregar Al Carrito</button>
            `;

            itemList.appendChild(itemCard);
        });

        // Attach event listeners to edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', openEditForm);
        });
        document.querySelectorAll('.add-similar-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const itemData = JSON.parse(this.dataset.item);
                const queryString = new URLSearchParams(itemData).toString();
                window.location.href = `add_item.html?${queryString}`;
            });
        });
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', function () {
                const itemData = JSON.parse(this.dataset.item);  // Get itemData from button
                addItemToCart(itemData);  // Call addItemToCart with itemData
            });
        });
    }).catch(error => {
        console.error("Error fetching Firestore data: ", error);
    });
}

//------------------------------------------------------------------------------------------BUSCAR
function filterItems() {
    const searchBox = document.getElementById('search-box');
    const searchQuery = searchBox.value.toLowerCase(); // Get the search query and convert to lowercase
    const itemList = document.getElementById('item-list');
    const items = itemList.getElementsByClassName('card'); // Get all item cards

    // Loop through each item card and check if it matches the search query
    Array.from(items).forEach(item => {
        const itemName = item.dataset.name; // Get the item name from the dataset

        if (itemName.includes(searchQuery)) {
            item.style.display = 'block'; // Show item if it matches the search query
        } else {
            item.style.display = 'none'; // Hide item if it doesn't match the search query
        }
    });
}

// Then, attach the event listener after the function is defined
document.getElementById('search-box').addEventListener('input', filterItems);

//------------------------------------------------------------------------------------------EDITAR

// Open the edit form with the item’s details
function openEditForm(event) {
    const itemId = event.target.getAttribute('data-id');

    // Populate the edit-categoria dropdown dynamically
    populateEditCategories().then(() => {
        // Get the item data from Firestore after populating the categories
        getDoc(doc(db, "inventario", itemId)).then((docSnapshot) => {
            if (docSnapshot.exists()) {
                const itemData = docSnapshot.data();
                const imagePreview = document.getElementById('edit-preview');
                if (itemData.imageUrl) {
                    imagePreview.src = itemData.imageUrl;
                    imagePreview.style.display = 'block';
                } else {
                    imagePreview.style.display = 'none';
                }

                // Populate the form fields with data from Firestore
                document.getElementById('edit-id').value = itemId;
                document.getElementById('edit-codCatalogo').value = itemData.codigoCatalogo || '';
                document.getElementById('edit-nombre').value = itemData.nombre || '';
                document.getElementById('edit-marca').value = itemData.marca || '';
                document.getElementById('edit-categoria').value = itemData.categoria || '';
                document.getElementById('edit-cantidad').value = itemData.cantidad || '';
                document.getElementById('edit-precio').value = itemData.precio || '';
                document.getElementById('edit-talle').value = itemData.talle || '';
                document.getElementById('edit-color').value = itemData.color || '';


                const newCategoryCheckbox = document.getElementById('new-category-checkbox');
                const editCategoriaDropdown = document.getElementById('edit-categoria');
                const newCategoryTextbox = document.getElementById('new-category-textbox');

                newCategoryCheckbox.addEventListener('change', () => {
                    if (newCategoryCheckbox.checked) {
                        editCategoriaDropdown.style.display = 'none';
                        newCategoryTextbox.style.display = 'block';
                    } else {
                        editCategoriaDropdown.style.display = 'block';
                        newCategoryTextbox.style.display = 'none';
                    }
                });
                
                newCategoryCheckbox.checked = false;
                newCategoryTextbox.style.display = 'none';
                // Set the delete button's data-id attribute
                const deleteButton = document.querySelector('.delete-btn');
                deleteButton.setAttribute('data-id', itemId);

                // Attach the delete button listener
                deleteButton.removeEventListener('click', handleDelete); // Avoid duplicate listeners
                deleteButton.addEventListener('click', handleDelete);

                // Show the edit modal
                document.getElementById('edit-item').classList.remove('hidden');
                document.getElementById('edit-overlay').classList.remove('hidden');
            }
        }).catch((error) => {
            console.error("Error fetching document: ", error);
        });
    }).catch((error) => {
        console.error("Error populating categories: ", error);
    });
}

// Handle form submission for editing an item
document.getElementById('form-editar').addEventListener('submit', async function (event) {
    event.preventDefault();
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");
    if (!isLoggedIn || isLoggedIn !== "true") {
        alert("You must be logged in to upload.");
        return;
    }
    // Initialize itemId first before using it
    const itemId = document.getElementById('edit-id').value;

    // Create storage reference with the initialized itemId
    const storageRef = ref(storage, `items/${itemId}/${Date.now()}`);
    const imageInput = document.getElementById('edit-image');
    let imageUrl = null;

    if (imageInput.files.length > 0) {
        const file = imageInput.files[0];
        const metadata = {
            customMetadata: {
                authToken: "authenticated" // Custom token to satisfy Storage Rules
            }
        };

        try {
            const snapshot = await uploadBytes(storageRef, file, metadata);
            imageUrl = await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed. Please try again.");
            return;
        }
    }

    // Determine if "New Category" checkbox is selected
    const newCategoryCheckbox = document.getElementById('new-category-checkbox');
    const newCategoryTextbox = document.getElementById('new-category-textbox');
    let selectedCategory = document.getElementById('edit-categoria').value;

    if (newCategoryCheckbox && newCategoryCheckbox.checked && newCategoryTextbox) {
        selectedCategory = newCategoryTextbox.value.trim(); // Use value from the textbox
    }

    const updatedData = {
        nombre: document.getElementById('edit-nombre').value,
        codigoCatalogo: document.getElementById('edit-codCatalogo').value,
        categoria: selectedCategory, // Use the determined category
        marca: document.getElementById('edit-marca').value,
        cantidad: parseInt(document.getElementById('edit-cantidad').value),
        precio: parseFloat(document.getElementById('edit-precio').value),
        talle: document.getElementById('edit-talle').value, // Add talle
        color: document.getElementById('edit-color').value, // Add color
        authToken: "authenticated" 
    };

    if (imageUrl) {
        updatedData.imageUrl = imageUrl;
    }

    // Log data before update for debugging
    console.log("Updating item with ID:", itemId, "with data:", updatedData);

    try {
        await updateDoc(doc(db, "inventario", itemId), updatedData);

        alert('Prenda actualizada exitosamente!');
        
        document.getElementById('categoria-select').value = "all";  // Ensure "all" is the valid value in the dropdown

        // Log data after successful update
        console.log("Updated item:", itemId);
        // Delay reloading to ensure Firestore processes the update
        setTimeout(() => {
            loadItems();
            document.getElementById('edit-item').classList.add('hidden');
            document.getElementById('edit-overlay').classList.add('hidden');
        }, 500);

    } catch (error) {
        console.error("Error updating document: ", error);
    }
});

document.getElementById('cancel-edit').addEventListener('click', () => {
    document.getElementById('edit-overlay').classList.add('hidden');
});

document.getElementById('categoria-select').addEventListener('change', function() {
    const selectedCategory = this.value;

    document.querySelectorAll('#item-list .card').forEach(item => {
        item.style.display = (selectedCategory === 'all' || item.dataset.category === selectedCategory) ? 'block' : 'none';
    });
});
//---------------------------------------------------------------------------BORRAR
async function deleteItem(itemId) {
    // Check if the user is logged in using sessionStorage
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");

    // If the user is not logged in, show an alert and return
    if (!isLoggedIn || isLoggedIn !== "true") {
        alert("You must be logged in to delete an item.");
        return;
    }

    // Get the authToken (this should match your server-side token or logic for authentication)
    const authToken = "authenticated";  // Or retrieve it based on your self-authentication logic

    try {
        if (authToken !== "authenticated") {
            alert("You do not have permission to perform this action.");
            return;
        }

        // Perform delete if user has the proper token
        if (confirm("¿Estás seguro de que deseas eliminar este ítem?")) {
            // Passing token in the Firestore metadata
            await deleteDoc(doc(db, "inventario", itemId), {
                headers: {
                    authToken: "authenticated"  // Here you pass the token as metadata
                }
            });

            alert("Ítem eliminado exitosamente.");
            loadItems(); // Refresh the inventory list after deletion
            document.getElementById('edit-item').classList.add('hidden'); // Hide the modal after deletion
            document.getElementById('edit-overlay').classList.add('hidden'); // Hide the overlay
        }

    } catch (error) {
        console.error("Error al eliminar el ítem: ", error);
        alert("Ocurrió un error al eliminar el ítem.");
    }
}

// Attach the delete button listener
document.querySelector('.delete-btn').addEventListener('click', (event) => {
    const itemId = event.target.getAttribute('data-id');
    deleteItem(itemId);
});

document.getElementById('import-btn').addEventListener('click', importData);

// Delete handler function to call deleteItem with item ID
function handleDelete(event) {
    const itemId = event.target.getAttribute('data-id');
    deleteItem(itemId);
}
//-----------------------------------------------------------------------------------IMPORTAR
export async function importData() {
    const fileInput = document.getElementById('excel-file');
    const file = fileInput.files[0];

    if (!file) {
        alert("Por favor, selecciona un archivo de Excel.");
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        console.log("Datos importados:", jsonData);

        for (const item of jsonData) {
            // Ensure "Precio unitario" is treated as a string for replacement
            const rawPrice = item["Precio unitario"] || "0"; // Default to "0" if missing or undefined
            const priceString = rawPrice.toString(); // Convert to string in case it's not

            const cleanedItem = {
                idProducto: item["ID Producto"] || null,
                codigoCatalogo: item["Codigo catalogo"] || "",
                nombre: item["Nombre del producto"] || "Sin nombre",
                marca: item["Marca"] || "Sin marca",
                categoria: item["Categoria"] || "Sin categoría",
                talle: item["Talle"] || "Unico",
                color: item["Color"] || "Sin color",
                cantidad: parseInt(item["Cantidad en stock"]) || 0,
                precio: parseFloat(priceString.replace("$", "").trim()) || 0,
                authToken: "authenticated"
            };

            // Skip invalid rows
            if (!cleanedItem.nombre || cleanedItem.cantidad === 0) {
                console.warn("Fila ignorada debido a datos inválidos:", item);
                continue;
            }

            try {
                await addDoc(collection(db, "inventario"), cleanedItem);
                console.log("Item agregado:", cleanedItem);
            } catch (error) {
                console.error("Error al agregar ítem a Firestore:", error);
            }
        }

        alert("Datos importados exitosamente.");
        loadItems();
    };

    reader.readAsArrayBuffer(file);
}


// Attach importData to the global window object
window.importData = importData;

//-----------------------------------------------------------------------------------VENTAS
// In case i wanna activate local storage VV
// JSON.parse(localStorage.getItem('cart')) || 

// Initialize cartItems from localStorage (if available)
let cartItems =[];

// Function to add item to the cart
function addItemToCart(itemData) {
    if (!itemData) {
        console.error("Item data is missing:", itemData);
        return;
    }

    console.log('Item added to cart:', itemData);

    // Add the item to the cart (set cantidad to 1 since we're selling 1)
    const itemToAdd = { ...itemData, cantidad: 1 };
    cartItems.push(itemToAdd);

    // Save the cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cartItems));

    // Update the cart UI
    updateCartUI();
}


// Function to update the UI of the cart (display items in the cart modal)
function updateCartUI() {
    const cartContainer = document.getElementById('cart-items-container');
    cartContainer.innerHTML = '';  // Clear previous cart items

    if (cartItems.length === 0) {
        cartContainer.innerHTML = '<p>El carrito está vacio.</p>';
    } else {
        let total = 0;
        cartItems.forEach((item, index) => { // Use index to identify the item
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            itemElement.innerHTML = `
                <img src="${item.imageUrl || 'https://via.placeholder.com/150'}" alt="${item.nombre}">
                <h3>${item.nombre}</h3>
                <p>Precio: $${item.precio}</p>
                <p>Cantidad: ${item.cantidad}</p>
                <button class="remove-btn" data-id="${index}">ELIMINAR</button> <!-- Use index as the id -->
            `;
            cartContainer.appendChild(itemElement);
            total += item.precio * item.cantidad;
        });

        document.getElementById('total-price').innerText = total.toFixed(2);
    }

    // Add remove functionality to the "Remove" buttons
    const removeButtons = document.querySelectorAll('.remove-btn');
    removeButtons.forEach(button => {
        button.addEventListener('click', function () {
            const itemIndex = parseInt(this.getAttribute('data-id'));
            cartItems.splice(itemIndex, 1); // Remove item from cart array by index
            localStorage.setItem('cart', JSON.stringify(cartItems));  // Update cart in localStorage
            updateCartUI();  // Re-render cart UI after removal
        });
    });
}

// Cart modal logic (same as your previous implementation)
const cartButton = document.getElementById('cart-button');
const cartModal = document.getElementById('cart-modal');
const closeCartButton = document.getElementById('close-cart');

if (cartButton && cartModal && closeCartButton) {
    cartButton.addEventListener('click', function () {
        cartModal.classList.remove('hidden');
        updateCartUI();  // Update cart UI when modal opens
    });

    closeCartButton.addEventListener('click', function () {
        cartModal.classList.add('hidden');
    });

    window.addEventListener('click', function (e) {
        if (e.target === cartModal) {
            cartModal.classList.add('hidden');
        }
    });
}

// Finalize Sale Logic
// document.getElementById('finalize-sale-btn').addEventListener('click', async function () {
//     const customerInfo = prompt("Enter your name, phone number, and address (separate with commas):");

//     if (customerInfo) {
//         const [name, phone, address] = customerInfo.split(',');

//         const cart = JSON.parse(localStorage.getItem('cart')) || [];
//         if (cart.length === 0) {
//             alert("Your cart is empty!");
//             return;
//         }

//         try {
//             for (const cartItem of cart) {
//                 const itemRef = doc(db, "inventario", cartItem.id);
//                 const itemSnapshot = await getDoc(itemRef);

//                 if (itemSnapshot.exists()) {
//                     const item = itemSnapshot.data();
//                     if (item.cantidad >= cartItem.cantidad) {
//                         // Subtract quantity from inventory
//                         await updateDoc(itemRef, {
//                             cantidad: item.cantidad - cartItem.cantidad
//                         });
//                         console.log(`Inventory updated for item ${cartItem.id}. Quantity reduced by ${cartItem.cantidad}.`);
//                     } else {
//                         alert(`Insufficient stock for ${cartItem.nombre}.`);
//                     }
//                 } else {
//                     console.error(`Item with ID ${cartItem.id} not found.`);
//                 }
//             }

//             // Save sale data to Firestore
//             const saleData = {
//                 customerName: name.trim(),
//                 customerPhone: phone.trim(),
//                 customerAddress: address.trim(),
//                 items: cart,
//                 authToken: "authenticated",
//                 saleDate: serverTimestamp()
//             };
//             await addDoc(collection(db, "ventas"), saleData);

//             // Clear cart
//             cartItems = [];
//             localStorage.removeItem('cart');
//             updateCartUI();

//             alert("Venta finalizada exitosamente!");
//         } catch (error) {
//             console.error("Error finalizing sale: ", error);
//             alert("An error occurred while finalizing the sale.");
//         }
//     } else {
//         alert("Sale not finalized. Customer information is required.");
//     }
// });
document.getElementById('finalize-sale-btn').addEventListener('click', function () {
    const finalizeSaleModal = document.getElementById('finalize-sale-modal');
    finalizeSaleModal.classList.remove('hidden');  // Show modal when finalize sale button is clicked
});

document.getElementById('fiado-checkbox').addEventListener('change', function () {
    const statusText = document.getElementById('status-text');
    const fiadoAmountContainer = document.getElementById('fiado-amount-container');

    if (this.checked) {
        statusText.textContent = 'Sin Pagar'; // Update status to Sin Pagar if Fiado is checked
        fiadoAmountContainer.style.display = 'block'; // Show the "Faltan cuantos pesos?" field
    } else {
        statusText.textContent = 'Pagado'; // Update status to Pagado if Fiado is unchecked
        fiadoAmountContainer.style.display = 'none'; // Hide the "Faltan cuantos pesos?" field
    }
});

document.getElementById('finalize-sale-form').addEventListener('submit', async function (e) {
    e.preventDefault(); // Prevent form submission from reloading the page

    const nombre = document.getElementById('nombre').value;
    const telefono = document.getElementById('telefono').value;
    const direccion = document.getElementById('direccion').value;
    const comentarios = document.getElementById('comentarios').value;
    const fiado = document.getElementById('fiado-checkbox').checked ? 'Sin Pagar' : 'Pagado';
    const fiadoAmount = document.getElementById('fiado-amount').value; // Get the amount if Fiado is checked

    // Collect the cart items from localStorage
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (cart.length > 0) {
        const saleData = {
            customerName: nombre.trim(),
            customerPhone: telefono.trim(),
            customerAddress: direccion.trim(),
            comments: comentarios.trim(),
            paymentStatus: fiado,
            items: cart,
            authToken: "authenticated", // You can replace this with actual authentication token if needed
            saleDate: new Date(), // Use current timestamp for the sale date
            fiadoAmount: fiado === 'Sin Pagar' ? parseFloat(fiadoAmount) : null, // Only store fiadoAmount if it's "Sin Pagar"
        };

        try {
            // Add the sale data to Firestore
            const saleRef = await addDoc(collection(db, "ventas"), saleData);
            console.log(`Sale added with ID: ${saleRef.id}`);

            // Subtract items from inventory
            for (const item of cart) {
                const itemRef = doc(db, "inventario", item.id); // Get the item reference in Firestore
                const itemSnapshot = await getDoc(itemRef);

                if (itemSnapshot.exists()) {
                    const itemData = itemSnapshot.data();
                    if (itemData.cantidad >= item.cantidad) {
                        const newCantidad = itemData.cantidad - item.cantidad;
                        await updateDoc(itemRef, { cantidad: newCantidad });
                        console.log(`Updated inventory for item ${item.id}: New quantity = ${newCantidad}`);
                    } else {
                        console.error(`Not enough stock for item ${item.id}.`);
                        alert(`No hay suficiente stock para el artículo ${item.nombre}.`);
                    }
                } else {
                    console.error(`Item not found in inventory: ${item.id}`);
                }
            }

            // Clear the cart and close modal
            localStorage.removeItem('cart');
            document.getElementById('finalize-sale-modal').classList.add('hidden');
            alert("Venta finalizada exitosamente!");
            setTimeout(() => {
                window.location.reload();  // Reload the current page
            }, 1000);
            // Optionally reset or update the cart UI here
        } catch (error) {
            console.error("Error adding sale: ", error);
            alert("Hubo un error al finalizar la venta.");
        }
    } else {
        alert("No items in cart!");
    }
});

// Cancel sale
document.getElementById('cancel-sale').addEventListener('click', function () {
    document.getElementById('finalize-sale-modal').classList.add('hidden');
});


// Load items on page load
loadItems();