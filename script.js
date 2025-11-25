// --- CONFIGURACIÓN DE SUPABASE (REEMPLAZA LOS PLACEHOLDERS) ---
const SUPABASE_URL = 'https://rusiimqtzjfojxpojsvg.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1c2lpbXF0empmb2p4cG9qc3ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDc0MDMsImV4cCI6MjA3OTU4MzQwM30.953QFT1e-tDBvCIMtpwLqxLlwrDyQKjTilDHy5etThE';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const PRODUCTS_TABLE = 'productos'; // Nombre de la tabla creada con SQL
// -------------------------------------------------------------

// Variables y elementos DOM
let isLoggedIn = false;
const VALID_USERNAME = "Axel15";
const VALID_PASSWORD = "Axel15*.";

const loginToggle = document.getElementById('login-toggle');
const loginText = document.getElementById('login-text');
const loginIcon = document.getElementById('login-icon');
const addProductSection = document.getElementById('add-product-section');
const productCatalog = document.getElementById('product-catalog');
const addProductForm = document.getElementById('add-product-form');
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const closeLoginModal = document.getElementById('close-login-modal');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const togglePassword = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');
const productDetailModal = document.getElementById('product-detail-modal');
const productDetailContent = document.getElementById('product-detail-content');
const closeDetailModal = document.getElementById('close-detail-modal');

// Función para actualizar la interfaz de usuario según el estado de la sesión
function updateUI() {
    if (isLoggedIn) {
        // Estado: Iniciado sesión (Admin)
        loginText.textContent = 'Cerrar Sesión (Admin)';
        loginIcon.className = 'fas fa-sign-out-alt md:mr-2';
        loginToggle.classList.remove('btn-login');
        loginToggle.classList.add('btn-logout');
        addProductSection.classList.remove('hidden');
    } else {
        // Estado: No iniciado sesión (Invitado)
        loginText.textContent = 'Iniciar Sesión';
        loginIcon.className = 'fas fa-sign-in-alt md:mr-2';
        loginToggle.classList.remove('btn-logout');
        loginToggle.classList.add('btn-login');
        addProductSection.classList.add('hidden');
    }
    // Recargar datos desde Supabase para reflejar el estado de Admin/Invitado
    fetchProducts(); 
}

// --- FUNCIONES DE SUPABASE (BACKEND) ---

// 1. OBTENER PRODUCTOS (READ)
async function fetchProducts() {
    document.getElementById('loading-message').textContent = 'Cargando catálogo...';
    const { data, error } = await supabase
        .from(PRODUCTS_TABLE)
        .select('*')
        .order('id', { ascending: true }); // Ordenar por ID para consistencia

    document.getElementById('loading-message').textContent = '';

    if (error) {
        console.error('Error al obtener productos:', error.message);
        productCatalog.innerHTML = `<p class="text-red-500 md:col-span-4">Error cargando el catálogo: ${error.message}</p>`;
        return;
    }
    
    if (data.length === 0) {
        productCatalog.innerHTML = `<p class="text-center md:col-span-4 text-gray-500 dark:text-gray-400">El catálogo está vacío. ${isLoggedIn ? '¡Agrega un producto!' : ''}</p>`;
    } else {
        renderProducts(data); // Renderizar los productos obtenidos de Supabase
    }
}

// 2. AGREGAR PRODUCTO (CREATE)
async function createProduct(newProduct) {
    const { error } = await supabase
        .from(PRODUCTS_TABLE)
        .insert([newProduct]);

    if (error) {
        console.error('Error al agregar producto:', error.message);
        alert(`Error: No se pudo agregar el producto. ${error.message}`);
        return false;
    }
    return true;
}

// 3. ELIMINAR PRODUCTO (DELETE)
async function deleteProduct(productId) {
    if (!isLoggedIn) {
        alert('¡Solo el administrador (Axel15) puede eliminar productos!');
        return;
    }
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        return;
    }

    const { error } = await supabase
        .from(PRODUCTS_TABLE)
        .delete()
        .eq('id', productId); // Eliminar donde el ID coincida

    if (error) {
        console.error('Error al eliminar producto:', error.message);
        alert(`Error: No se pudo eliminar el producto. ${error.message}`);
    } else {
        // Supabase Realtime se encargará de refrescar la lista para todos
        alert('Producto eliminado exitosamente.');
    }
}

// 4. SUSCRIPCIÓN EN TIEMPO REAL (REALTIME)
function subscribeToChanges() {
    supabase
        .channel('catalog-updates') // Puedes usar un nombre de canal cualquiera
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: PRODUCTS_TABLE }, 
            () => {
                console.log('Cambio detectado en Supabase, refrescando catálogo...');
                fetchProducts(); // Cada vez que hay un INSERT, UPDATE o DELETE, recarga
            }
        )
        .subscribe();
}
// --------------------------------------

// Función para renderizar productos (renderiza lo que recibe de Supabase)
function renderProducts(productsToRender) {
    productCatalog.innerHTML = '';
    
    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        // El botón de eliminar SOLO se inyecta si isLoggedIn es true
        const deleteButtonHtml = isLoggedIn ? `
            <button data-id="${product.id}" class="delete-btn" title="Eliminar Producto">
                <i class="fas fa-trash-alt text-sm"></i>
            </button>
        ` : '';

        // Formatear el precio
        const formattedPrice = product.price ? `$${parseFloat(product.price).toFixed(2)}` : 'Precio no disponible';
        
        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.title}" class="product-image">
                ${deleteButtonHtml}
            </div>
            <div class="product-info">
                <div>
                    <div class="sizes-container">
                        <p class="sizes-label">Tallas disponibles:</p>
                        <div class="flex flex-wrap gap-2">
                            ${product.sizes.map(size => `
                                <span class="size-tag">${size}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="flex gap-2 mt-4">
                    <button class="btn-view-details btn-detail" data-id="${product.id}">
                        <i class="fas fa-info-circle mr-2"></i>Ver Detalles
                    </button>
                    <button class="btn-primary btn-detail">
                        <i class="fas fa-shopping-cart mr-2"></i>Comprar
                    </button>
                </div>
            </div>
        `;
        
        productCatalog.appendChild(productCard);

        // Asigna el evento de eliminación SOLO si el botón fue creado
        if (isLoggedIn) {
            const deleteButton = productCard.querySelector('.delete-btn');
            if (deleteButton) {
                deleteButton.addEventListener('click', function() {
                    const productId = parseInt(this.getAttribute('data-id'));
                    deleteProduct(productId);
                });
            }
        }

        // Asigna el evento para ver detalles
        const viewDetailsButton = productCard.querySelector('.btn-view-details');
        viewDetailsButton.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            showProductDetails(productId, productsToRender);
        });
    });
}

// Función para mostrar detalles del producto
function showProductDetails(productId, products) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Formatear el precio
    const formattedPrice = product.price ? `$${parseFloat(product.price).toFixed(2)}` : 'Precio no disponible';
    
    productDetailContent.innerHTML = `
        <div class="product-detail">
            <div>
                <img src="${product.image}" alt="${product.title}" class="product-detail-image">
            </div>
            <div class="product-detail-info">
                <h3 class="product-detail-title">${product.title}</h3>
                <p class="product-detail-price">${formattedPrice}</p>
                
                <div class="sizes-container">
                    <p class="sizes-label">Tallas disponibles:</p>
                    <div class="flex flex-wrap gap-2">
                        ${product.sizes.map(size => `
                            <span class="size-tag">${size}</span>
                        `).join('')}
                    </div>
                </div>
                
                <div class="detail-actions">
                    <button class="btn-primary btn-detail">
                        <i class="fas fa-shopping-cart mr-2"></i>Agregar al Carrito
                    </button>
                </div>
            </div>
        </div>
    `;
    
    productDetailModal.classList.remove('hidden');
}

// Manejadores de eventos
loginToggle.addEventListener('click', function() {
    if (isLoggedIn) {
        isLoggedIn = false;
        updateUI();
        alert('Sesión de administrador cerrada.');
    } else {
        loginModal.classList.remove('hidden');
    }
});

closeLoginModal.addEventListener('click', () => loginModal.classList.add('hidden'));

closeDetailModal.addEventListener('click', () => productDetailModal.classList.add('hidden'));

// Cerrar modales al hacer clic fuera del contenido
loginModal.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.classList.add('hidden');
    }
});

productDetailModal.addEventListener('click', (e) => {
    if (e.target === productDetailModal) {
        productDetailModal.classList.add('hidden');
    }
});

loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
        isLoggedIn = true;
        loginModal.classList.add('hidden');
        loginForm.reset();
        updateUI();
        alert('¡Login exitoso! Tienes permisos de administrador.');
    } else {
        alert('Credenciales incorrectas.');
    }
});

addProductForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!isLoggedIn) {
        alert('¡Solo el administrador (Axel15) puede agregar productos!');
        return;
    }
    
    const imageUrl = document.getElementById('product-image').value;
    const title = document.getElementById('product-title').value;
    const price = document.getElementById('product-price').value;
    const description = document.getElementById('product-description').value;
    const sizeCheckboxes = document.querySelectorAll('.size-checkbox:checked');
    // Nota: Aquí guardamos las tallas como un Array (TEXT[] en SQL)
    const sizes = Array.from(sizeCheckboxes).map(checkbox => checkbox.value);
    
    if (sizes.length === 0) {
        alert('Por favor selecciona al menos una talla');
        return;
    }
    
    const newProduct = {
        image: imageUrl,
        title: title,
        price: price,
        description: description,
        sizes: sizes
    };
    
    const success = await createProduct(newProduct);

    if (success) {
        // El realtime se encargará de llamar a fetchProducts, solo limpiamos el formulario.
        addProductForm.reset();
        document.querySelectorAll('.size-checkbox').forEach(cb => cb.checked = false);
        alert('Producto agregado exitosamente al catálogo global.');
    }
});

// Mostrar/ocultar contraseña
togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Cambiar el icono
    const icon = this.querySelector('i');
    if (type === 'password') {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    } else {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    }
});

// Lógica de Cambio de Tema
const initTheme = () => {
    const storedTheme = localStorage.getItem('color-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        document.documentElement.classList.remove('dark');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
};

themeToggle.addEventListener('click', function() {
    themeIcon.classList.toggle('fa-moon');
    themeIcon.classList.toggle('fa-sun');
    
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('color-theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('color-theme', 'dark');
    }
});

// Inicializar la aplicación
initTheme();
updateUI(); // Carga la UI inicial y llama a fetchProducts()
subscribeToChanges(); // Inicia la conexión en tiempo real