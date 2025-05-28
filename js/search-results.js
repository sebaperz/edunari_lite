/**
 * Edunari - JavaScript para página de resultados de búsqueda
 * Manejo de búsqueda de productos, filtrado y paginación
 */

// Estado global de la aplicación
const SearchState = {
    products: [],
    services: [],
    businesses: [],
    allItems: [], // Combinación de productos y servicios
    currentQuery: '',
    currentProductCategory: '',
    currentServiceCategory: '',
    currentMaxPrice: 200000,
    currentPage: 1,
    itemsPerPage: 12,
    filteredItems: []
};

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    
    // Inicializar la página de resultados
    initSearchResults();
    
    console.log('Página de resultados de búsqueda cargada');
});

/**
 * Inicializar página de resultados de búsqueda
 */
async function initSearchResults() {
    try {
        // Cargar datos
        await loadData();
        
        // Obtener parámetros de URL
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q') || '';
        const productCategory = urlParams.get('productCategory') || '';
        const serviceCategory = urlParams.get('serviceCategory') || '';
        const maxPrice = parseInt(urlParams.get('maxPrice')) || 200000;
        const page = parseInt(urlParams.get('page')) || 1;
        
        // Configurar estado inicial
        SearchState.currentQuery = query;
        SearchState.currentProductCategory = productCategory;
        SearchState.currentServiceCategory = serviceCategory;
        SearchState.currentMaxPrice = maxPrice;
        SearchState.currentPage = page;
        
        // Actualizar UI con la búsqueda
        updateSearchQuery(query);
        
        // Inicializar componentes
        initSearchForm();
        initFilters();
        initPagination();
        
        // Poblar filtros de categorías después de que los elementos estén inicializados
        populateCategoryFilter();
        
        // Aplicar filtros desde URL DESPUÉS de poblar las opciones
        setTimeout(() => {
            applyFiltersFromState();
            // Realizar búsqueda inicial
            performSearch();
        }, 100);
        
    } catch (error) {
        console.error('Error al inicializar resultados de búsqueda:', error);
        showError('Error al cargar los datos. Por favor, intenta nuevamente.');
    }
}

/**
 * Cargar datos desde archivos CSV
 * Siguiendo las mejores prácticas de JavaScript moderno
 */
async function loadData() {
    try {
        showLoading(true);
        
        // Cargar archivos CSV en paralelo para mejor rendimiento
        const [productsResponse, servicesResponse, businessesResponse] = await Promise.all([
            fetch('data/productos.csv'),
            fetch('data/servicios.csv'),
            fetch('data/emprendimientos.csv')
        ]);
        
        if (!productsResponse.ok || !servicesResponse.ok || !businessesResponse.ok) {
            throw new Error('Error al cargar archivos de datos');
        }
        
        const [productsCSV, servicesCSV, businessesCSV] = await Promise.all([
            productsResponse.text(),
            servicesResponse.text(),
            businessesResponse.text()
        ]);
        
        // Parsear CSV
        SearchState.products = parseCSV(productsCSV);
        SearchState.services = parseCSV(servicesCSV);
        SearchState.businesses = parseCSV(businessesCSV);
        
        // Crear índice de negocios para búsqueda rápida
        const businessIndex = {};
        SearchState.businesses.forEach(business => {
            businessIndex[business.id] = business;
        });
        
        // Enriquecer productos con información del negocio y marcar tipo
        SearchState.products = SearchState.products.map(product => ({
            ...product,
            business: businessIndex[product.emprendimiento_id] || {},
            type: 'producto'
        }));
        
        // Enriquecer servicios con información del negocio y marcar tipo
        SearchState.services = SearchState.services.map(service => ({
            ...service,
            business: businessIndex[service.emprendimiento_id] || {},
            type: 'servicio'
        }));
        
        // Combinar productos y servicios en una sola lista
        SearchState.allItems = [...SearchState.products, ...SearchState.services];
        
        showLoading(false);
        
    } catch (error) {
        showLoading(false);
        throw error;
    }
}

/**
 * Parser mejorado de CSV
 * Convierte CSV a array de objetos JavaScript
 * Maneja correctamente campos con comas entre comillas
 */
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = parseCSVLine(lines[0]);
    
    return lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const obj = {};
        
        headers.forEach((header, index) => {
            obj[header.trim()] = values[index] ? values[index].trim() : '';
        });
        
        return obj;
    });
}

/**
 * Parser de línea CSV que maneja comillas correctamente
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    // Agregar el último campo
    result.push(current);
    
    return result;
}

/**
 * Llenar filtros de categorías con datos únicos separados por tipo
 */
function populateCategoryFilter() {
    console.log('🔄 Iniciando población de filtros de categorías...');
    
    // Verificar que los datos estén cargados
    if (!SearchState.products || !SearchState.services) {
        console.error('❌ Datos no cargados. Products:', !!SearchState.products, 'Services:', !!SearchState.services);
        return;
    }
    
    if (SearchState.products.length === 0 || SearchState.services.length === 0) {
        console.warn('⚠️ Datos vacíos. Products:', SearchState.products.length, 'Services:', SearchState.services.length);
    }
    
    // Verificar elementos DOM
    const productCategorySelect = document.getElementById('productCategoryFilter');
    const serviceCategorySelect = document.getElementById('serviceCategoryFilter');
    
    if (!productCategorySelect) {
        console.error('❌ No se encontró el elemento productCategoryFilter');
        return;
    }
    
    if (!serviceCategorySelect) {
        console.error('❌ No se encontró el elemento serviceCategoryFilter');
        return;
    }
    
    console.log(`📊 Datos disponibles: ${SearchState.products.length} productos, ${SearchState.services.length} servicios`);
    
    try {
        // Obtener categorías de productos únicos
        const productCategories = [...new Set(
            SearchState.products
                .map(p => p.categoria)
                .filter(cat => cat && cat.trim() !== '')
        )].sort();
        
        // Obtener categorías de servicios únicos
        const serviceCategories = [...new Set(
            SearchState.services
                .map(s => s.categoria)
                .filter(cat => cat && cat.trim() !== '')
        )].sort();
        
        console.log(`📦 Categorías extraídas: ${productCategories.length} productos, ${serviceCategories.length} servicios`);
        console.log('🏷️ Categorías de productos:', productCategories);
        console.log('🛠️ Categorías de servicios:', serviceCategories);
        
        // Poblar select de productos
        productCategorySelect.innerHTML = '<option value="">Todas las categorías</option>';
        let productOptionsAdded = 0;
        
        productCategories.forEach((category, index) => {
            try {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = formatCategoryName(category);
                productCategorySelect.appendChild(option);
                productOptionsAdded++;
                
                console.log(`  ✓ Producto ${index + 1}: ${category} → ${formatCategoryName(category)}`);
            } catch (error) {
                console.error(`❌ Error agregando categoría de producto "${category}":`, error);
            }
        });
        
        // Poblar select de servicios
        serviceCategorySelect.innerHTML = '<option value="">Todas las categorías</option>';
        let serviceOptionsAdded = 0;
        
        serviceCategories.forEach((category, index) => {
            try {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = formatCategoryName(category);
                serviceCategorySelect.appendChild(option);
                serviceOptionsAdded++;
                
                console.log(`  ✓ Servicio ${index + 1}: ${category} → ${formatCategoryName(category)}`);
            } catch (error) {
                console.error(`❌ Error agregando categoría de servicio "${category}":`, error);
            }
        });
        
        // Verificación final
        const finalProductOptions = productCategorySelect.options.length;
        const finalServiceOptions = serviceCategorySelect.options.length;
        
        console.log(`✅ Filtros poblados exitosamente:`);
        console.log(`   - Select productos: ${finalProductOptions} opciones (${productOptionsAdded} categorías + 1 "Todas")`);
        console.log(`   - Select servicios: ${finalServiceOptions} opciones (${serviceOptionsAdded} categorías + 1 "Todas")`);
        
        // Verificar que las opciones se agregaron correctamente
        if (finalProductOptions !== productCategories.length + 1) {
            console.warn(`⚠️ Discrepancia en productos: esperado ${productCategories.length + 1}, actual ${finalProductOptions}`);
        }
        
        if (finalServiceOptions !== serviceCategories.length + 1) {
            console.warn(`⚠️ Discrepancia en servicios: esperado ${serviceCategories.length + 1}, actual ${finalServiceOptions}`);
        }
        
    } catch (error) {
        console.error('❌ Error en populateCategoryFilter:', error);
        throw error;
    }
}

/**
 * Formatear nombre de categoría para mostrar
 */
function formatCategoryName(category) {
    return category
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Inicializar formulario de búsqueda
 */
function initSearchForm() {
    const searchForm = document.querySelector('.search-form');
    const searchInput = document.getElementById('searchInput');
    
    if (!searchForm || !searchInput) return;
    
    // Establecer valor inicial
    searchInput.value = SearchState.currentQuery;
    
    // Manejar envío de formulario
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();
        handleNewSearch();
    });
    
    // Búsqueda en tiempo real con debounce
    searchInput.addEventListener('input', debounce(function() {
        handleNewSearch();
    }, 500));
}

/**
 * Manejar nueva búsqueda
 */
function handleNewSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const newQuery = searchInput.value.trim();
    SearchState.currentQuery = newQuery;
    SearchState.currentPage = 1;
    
    updateSearchQuery(newQuery);
    performSearch();
    updateURL();
}

/**
 * Actualizar display de consulta de búsqueda
 */
function updateSearchQuery(query) {
    const searchQueryText = document.getElementById('searchQueryText');
    if (searchQueryText) {
        searchQueryText.textContent = query || 'Todos los productos';
    }
}

/**
 * Inicializar filtros
 */
function initFilters() {
    const productCategoryFilter = document.getElementById('productCategoryFilter');
    const serviceCategoryFilter = document.getElementById('serviceCategoryFilter');
    const priceFilter = document.getElementById('priceFilter');
    const priceDisplay = document.getElementById('priceDisplay');
    const clearFilters = document.getElementById('clearFilters');
    
    // Filtro de categoría de productos
    if (productCategoryFilter) {
        productCategoryFilter.addEventListener('change', function() {
            SearchState.currentProductCategory = this.value;
            SearchState.currentServiceCategory = ''; // Limpiar el otro filtro
            if (serviceCategoryFilter) serviceCategoryFilter.value = '';
            SearchState.currentPage = 1;
            performSearch();
            updateURL();
        });
    }
    
    // Filtro de categoría de servicios
    if (serviceCategoryFilter) {
        serviceCategoryFilter.addEventListener('change', function() {
            SearchState.currentServiceCategory = this.value;
            SearchState.currentProductCategory = ''; // Limpiar el otro filtro
            if (productCategoryFilter) productCategoryFilter.value = '';
            SearchState.currentPage = 1;
            performSearch();
            updateURL();
        });
    }
    
    // Filtro de precio
    if (priceFilter && priceDisplay) {
        // Actualizar display de precio
        const updatePriceDisplay = () => {
            const price = parseInt(priceFilter.value);
            priceDisplay.textContent = formatPrice(price);
            SearchState.currentMaxPrice = price;
        };
        
        updatePriceDisplay(); // Inicial
        
        priceFilter.addEventListener('input', updatePriceDisplay);
        priceFilter.addEventListener('change', function() {
            SearchState.currentPage = 1;
            performSearch();
            updateURL();
        });
    }
    
    // Limpiar filtros
    if (clearFilters) {
        clearFilters.addEventListener('click', function() {
            resetFilters();
        });
    }
}

/**
 * Resetear filtros a valores por defecto
 */
function resetFilters() {
    const productCategoryFilter = document.getElementById('productCategoryFilter');
    const serviceCategoryFilter = document.getElementById('serviceCategoryFilter');
    const priceFilter = document.getElementById('priceFilter');
    const priceDisplay = document.getElementById('priceDisplay');
    
    if (productCategoryFilter) {
        productCategoryFilter.value = '';
        SearchState.currentProductCategory = '';
    }
    
    if (serviceCategoryFilter) {
        serviceCategoryFilter.value = '';
        SearchState.currentServiceCategory = '';
    }
    
    if (priceFilter && priceDisplay) {
        priceFilter.value = 200000;
        priceDisplay.textContent = formatPrice(200000);
        SearchState.currentMaxPrice = 200000;
    }
    
    SearchState.currentPage = 1;
    performSearch();
    updateURL();
}

/**
 * Realizar búsqueda con filtros aplicados
 */
function performSearch() {
    try {
        // Filtrar items según criterios
        let filtered = SearchState.allItems.filter(item => {
            // Filtro de texto
            if (SearchState.currentQuery) {
                const query = SearchState.currentQuery.toLowerCase();
                const searchFields = [
                    item.nombre,
                    item.descripcion || '',
                    item.tags || '',
                    item.business.nombre || ''
                ].join(' ').toLowerCase();
                
                if (!searchFields.includes(query)) {
                    return false;
                }
            }
            
            // Filtro de categoría de productos
            if (SearchState.currentProductCategory) {
                if (item.type !== 'producto' || item.categoria !== SearchState.currentProductCategory) {
                    return false;
                }
            }
            
            // Filtro de categoría de servicios
            if (SearchState.currentServiceCategory) {
                if (item.type !== 'servicio' || item.categoria !== SearchState.currentServiceCategory) {
                    return false;
                }
            }
            
            // Filtro de precio
            const price = parseInt(item.precio) || 0;
            if (price > SearchState.currentMaxPrice) {
                return false;
            }
            
            return true;
        });
        
        // Ordenar por relevancia (items disponibles primero)
        filtered.sort((a, b) => {
            const aAvailable = a.disponible === 'true';
            const bAvailable = b.disponible === 'true';
            
            if (aAvailable && !bAvailable) return -1;
            if (!aAvailable && bAvailable) return 1;
            
            // Ordenar por precio como criterio secundario
            return parseInt(a.precio) - parseInt(b.precio);
        });
        
        SearchState.filteredItems = filtered;
        
        // Actualizar UI
        updateResultsCount(filtered.length);
        displayItems();
        updatePaginationControls();
        
    } catch (error) {
        console.error('Error en búsqueda:', error);
        showError('Error al realizar la búsqueda.');
    }
}

/**
 * Actualizar contador de resultados
 */
function updateResultsCount(count) {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = count;
    }
}

/**
 * Mostrar items en el grid
 */
function displayItems() {
    const productsGrid = document.getElementById('productsGrid');
    const noResults = document.getElementById('noResults');
    
    if (!productsGrid || !noResults) return;
    
    const { filteredItems, currentPage, itemsPerPage } = SearchState;
    
    // Calcular items para la página actual
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = filteredItems.slice(startIndex, endIndex);
    
    // Mostrar/ocultar mensaje de sin resultados
    if (filteredItems.length === 0) {
        productsGrid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    } else {
        productsGrid.style.display = 'grid';
        noResults.style.display = 'none';
    }
    
    // Generar HTML de items
    productsGrid.innerHTML = pageItems.map(item => createItemCard(item)).join('');
    
    // Agregar event listeners a las tarjetas
    addItemCardListeners();
}

/**
 * Crear HTML para tarjeta de item (producto o servicio)
 * Siguiendo las especificaciones: foto, nombre, precio, emprendimiento
 */
function createItemCard(item) {
    const isAvailable = item.disponible === 'true';
    const price = parseInt(item.precio) || 0;
    const businessName = item.business.nombre || 'Emprendimiento desconocido';
    const category = item.categoria || '';
    const tags = item.tags ? item.tags.split(',').slice(0, 3) : [];
    const isService = item.type === 'servicio';
    
    return `
        <article class="product-card ${!isAvailable ? 'product-card--unavailable' : ''}" 
                 data-item-id="${item.id}"
                 data-category="${category}"
                 data-type="${item.type}">
            <div class="product-card__image">
                <svg class="product-placeholder-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    ${isService ? 
                        '<path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' :
                        '<path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M4 7L12 11M4 7V17L12 21M12 11V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
                    }
                </svg>
                ${isService ? '<div class="service-badge">Servicio</div>' : ''}
            </div>
            
            <div class="product-card__content">
                <h3 class="product-card__name">${escapeHtml(item.nombre)}</h3>
                
                <div class="product-card__price">${formatPrice(price)}</div>
                
                <div class="product-card__business">
                    <svg class="business-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 21V5C19 4.4 18.6 4 18 4H6C5.4 4 5 4.4 5 5V21L12 18L19 21Z" 
                              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="product-card__business-name">${escapeHtml(businessName)}</span>
                </div>
                
                ${tags.length > 0 ? `
                    <div class="product-card__tags">
                        ${tags.map(tag => `<span class="product-tag">${escapeHtml(tag.trim())}</span>`).join('')}
                    </div>
                ` : ''}
                
                <div class="product-card__actions">
                    <button class="product-btn product-btn--primary" 
                            onclick="contactBusiness('${item.business.emprendedor_email || ''}', '${escapeHtml(businessName)}')">
                        Contactar
                    </button>
                    <button class="product-btn product-btn--secondary" 
                            onclick="viewItemDetails('${item.id}', '${item.type}')">
                        Ver detalles
                    </button>
                </div>
            </div>
        </article>
    `;
}

/**
 * Formatear precio con separadores de miles
 */
function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

/**
 * Escapar HTML para prevenir XSS
 * Buena práctica de seguridad en JavaScript
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Agregar event listeners a las tarjetas de item
 */
function addItemCardListeners() {
    const itemCards = document.querySelectorAll('.product-card');
    
    itemCards.forEach(card => {
        // Click en la tarjeta (excluyendo botones)
        card.addEventListener('click', function(event) {
            if (!event.target.closest('.product-btn')) {
                const itemId = this.dataset.itemId;
                const itemType = this.dataset.type;
                viewItemDetails(itemId, itemType);
            }
        });
        
        // Mejorar accesibilidad con teclado
        card.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && !event.target.closest('.product-btn')) {
                const itemId = this.dataset.itemId;
                const itemType = this.dataset.type;
                viewItemDetails(itemId, itemType);
            }
        });
    });
}

/**
 * Inicializar controles de paginación
 */
function initPagination() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (SearchState.currentPage > 1) {
                SearchState.currentPage--;
                displayItems();
                updatePaginationControls();
                scrollToTop();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            const totalPages = Math.ceil(SearchState.filteredItems.length / SearchState.itemsPerPage);
            if (SearchState.currentPage < totalPages) {
                SearchState.currentPage++;
                displayItems();
                updatePaginationControls();
                scrollToTop();
            }
        });
    }
}

/**
 * Actualizar controles de paginación
 */
function updatePaginationControls() {
    const pagination = document.getElementById('pagination');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const currentPageSpan = document.getElementById('currentPage');
    const totalPagesSpan = document.getElementById('totalPages');
    
    const totalPages = Math.ceil(SearchState.filteredItems.length / SearchState.itemsPerPage);
    
    if (pagination) {
        pagination.style.display = totalPages > 1 ? 'flex' : 'none';
    }
    
    if (prevBtn) {
        prevBtn.disabled = SearchState.currentPage <= 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = SearchState.currentPage >= totalPages;
    }
    
    if (currentPageSpan) {
        currentPageSpan.textContent = SearchState.currentPage;
    }
    
    if (totalPagesSpan) {
        totalPagesSpan.textContent = totalPages;
    }
}

/**
 * Contactar emprendimiento
 */
function contactBusiness(email, businessName) {
    if (!email) {
        alert('Información de contacto no disponible');
        return;
    }
    
    const subject = encodeURIComponent(`Consulta sobre productos de ${businessName}`);
    const body = encodeURIComponent('Hola, estoy interesado en conocer más sobre sus productos.');
    
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
}

/**
 * Ver detalles del item
 */
function viewItemDetails(itemId, itemType) {
    // Buscar el item en la lista correspondiente
    const item = SearchState.allItems.find(i => i.id === itemId && i.type === itemType);
    if (item) {
        const typeText = itemType === 'servicio' ? 'Servicio' : 'Producto';
        const durationText = item.duracion ? `\nDuración: ${item.duracion}` : '';
        const stockText = item.stock ? `\nStock: ${item.stock}` : '';
        
        alert(`${typeText}: ${item.nombre}\nPrecio: ${formatPrice(parseInt(item.precio))}\nDescripción: ${item.descripcion || 'No disponible'}${durationText}${stockText}`);
    }
}

/**
 * Actualizar URL con parámetros de búsqueda
 * Permite bookmarking y navegación con botones del navegador
 */
function updateURL() {
    const params = new URLSearchParams();
    
    if (SearchState.currentQuery) {
        params.set('q', SearchState.currentQuery);
    }
    
    if (SearchState.currentProductCategory) {
        params.set('productCategory', SearchState.currentProductCategory);
    }
    
    if (SearchState.currentServiceCategory) {
        params.set('serviceCategory', SearchState.currentServiceCategory);
    }
    
    if (SearchState.currentMaxPrice < 200000) {
        params.set('maxPrice', SearchState.currentMaxPrice);
    }
    
    if (SearchState.currentPage > 1) {
        params.set('page', SearchState.currentPage);
    }
    
    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState(null, '', newURL);
}

/**
 * Scroll suave al top
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * Mostrar/ocultar indicador de carga
 */
function showLoading(show) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Mostrar mensaje de error
 */
function showError(message) {
    console.error(message);
    // Aquí se puede implementar un sistema de notificaciones más sofisticado
    alert(message);
}

/**
 * Función debounce para optimizar rendimiento
 * Evita múltiples llamadas rápidas a la función
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Aplicar filtros desde el estado actual
 */
function applyFiltersFromState() {
    const productCategoryFilter = document.getElementById('productCategoryFilter');
    const serviceCategoryFilter = document.getElementById('serviceCategoryFilter');
    const priceFilter = document.getElementById('priceFilter');
    const priceDisplay = document.getElementById('priceDisplay');
    
    console.log('🔧 Aplicando filtros desde estado:', {
        productCategory: SearchState.currentProductCategory,
        serviceCategory: SearchState.currentServiceCategory,
        maxPrice: SearchState.currentMaxPrice
    });
    
    if (productCategoryFilter) {
        productCategoryFilter.value = SearchState.currentProductCategory;
    }
    
    if (serviceCategoryFilter) {
        serviceCategoryFilter.value = SearchState.currentServiceCategory;
    }
    
    if (priceFilter) {
        priceFilter.value = SearchState.currentMaxPrice;
        
        // Actualizar display del precio
        if (priceDisplay) {
            priceDisplay.textContent = formatPrice(SearchState.currentMaxPrice);
        }
    }
    
    console.log('✅ Filtros aplicados desde estado');
} 