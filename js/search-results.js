/**
 * Edunari - JavaScript para página de resultados de búsqueda
 * Manejo de búsqueda de productos, filtrado y paginación
 * 
 * @fileoverview Módulo principal para la funcionalidad de búsqueda y filtrado
 * @author Edunari Team
 * @version 1.0.0
 * 
 * Referencias de documentación oficial:
 * - MDN Web APIs: https://developer.mozilla.org/en-US/docs/Web/API
 * - JavaScript ES6+: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide
 * - Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 */

// Estado global de la aplicación usando Object.freeze para inmutabilidad parcial
const SearchState = Object.seal({
    products: [],
    services: [],
    businesses: [],
    allItems: [], // Combinación de productos y servicios
    currentQuery: '',
    currentProductCategory: '',
    currentServiceCategory: '',
    currentSortOrder: 'none', // 'none', 'asc', 'desc'
    currentPage: 1,
    itemsPerPage: 12,
    filteredItems: [],
    
    // Métodos para actualizar estado de forma controlada
    updateQuery(query) {
        this.currentQuery = query;
    },
    
    updateProductCategory(category) {
        this.currentProductCategory = category;
    },
    
    updateServiceCategory(category) {
        this.currentServiceCategory = category;
    },
    
    updateSortOrder(order) {
        this.currentSortOrder = order;
    },
    
    resetFilters() {
        this.currentProductCategory = '';
        this.currentServiceCategory = '';
        this.currentSortOrder = 'none';
        this.currentPage = 1;
    }
});

// Constantes de configuración siguiendo convenciones de naming
const CONFIG = Object.freeze({
    ITEMS_PER_PAGE: 12,
    DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 200,
    MAX_DESCRIPTION_LENGTH: 150,
    CSV_FILES: {
        PRODUCTS: 'data/productos.csv',
        SERVICES: 'data/servicios.csv',
        BUSINESSES: 'data/emprendimientos.csv'
    },
    SORT_ORDERS: {
        NONE: 'none',
        ASC: 'asc',
        DESC: 'desc'
    }
});

// Esperar a que el DOM esté completamente cargado
// Usando addEventListener siguiendo las mejores prácticas de MDN
document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    
    // Inicializar la página de resultados
    initSearchResults().catch(error => {
        console.error('Error fatal al inicializar la aplicación:', error);
        showError('Error al cargar la aplicación. Por favor, recarga la página.');
    });
    
    console.log('✅ Página de resultados de búsqueda cargada correctamente');
});

/**
 * Inicializar página de resultados de búsqueda
 * @async
 * @function initSearchResults
 * @throws {Error} Error al cargar datos o inicializar componentes
 * @returns {Promise<void>}
 */
async function initSearchResults() {
    try {
        // Cargar datos usando Promise.all para mejor rendimiento
        await loadData();
        
        // Obtener parámetros de URL usando URLSearchParams API
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q') || '';
        const productCategory = urlParams.get('productCategory') || '';
        const serviceCategory = urlParams.get('serviceCategory') || '';
        const sortOrder = urlParams.get('sortOrder') || CONFIG.SORT_ORDERS.NONE;
        const page = Math.max(1, parseInt(urlParams.get('page')) || 1);
        
        // Nuevos parámetros para filtrado desde emprendimientos destacados
        const category = urlParams.get('category') || '';
        const featured = urlParams.get('featured') || '';
        
        // Configurar estado inicial usando métodos controlados
        SearchState.updateQuery(query);
        SearchState.updateProductCategory(productCategory);
        SearchState.updateServiceCategory(serviceCategory);
        SearchState.updateSortOrder(sortOrder);
        SearchState.currentPage = page;
        
        // Procesar filtrado por categoría desde emprendimientos destacados
        if (category && !productCategory && !serviceCategory) {
            // Mapear categorías de emprendimientos a filtros específicos
            const categoryMapping = {
                'alimentos': { type: 'product', value: 'alimentos' },
                'reparaciones': { type: 'service', value: 'reparaciones' },
                'bisuteria-manualidades': { type: 'product', value: 'bisuteria-manualidades' },
                'enseñanza': { type: 'service', value: 'enseñanza' },
                'moda-sostenible': { type: 'product', value: 'moda-sostenible' },
                'tecnologia-educativa': { type: 'service', value: 'tecnologia-educativa' },
                'diseño-grafico': { type: 'service', value: 'diseño-grafico' },
                'moda-mujeres': { type: 'product', value: 'moda-mujeres' },
                'cuidado-personal-belleza': { type: 'product', value: 'cuidado-personal-belleza' },
                'programacion': { type: 'service', value: 'programacion' },
                'fotografia': { type: 'service', value: 'fotografia' }
            };
            
            const mappedCategory = categoryMapping[category];
            if (mappedCategory) {
                if (mappedCategory.type === 'product') {
                    SearchState.updateProductCategory(mappedCategory.value);
                } else if (mappedCategory.type === 'service') {
                    SearchState.updateServiceCategory(mappedCategory.value);
                }
                
                console.log(`🎯 Filtro automático aplicado: ${category} -> ${mappedCategory.type}: ${mappedCategory.value}`);
            }
        }
        
        // Procesar filtrado por emprendimiento destacado específico
        if (featured) {
            // Mapear emprendimientos destacados a términos de búsqueda
            const featuredMapping = {
                'ecosnacks': 'EcoSnacks',
                'techrepair': 'TechRepair',
                'artecraft': 'ArteCraft',
                'codementor': 'CodeMentor',
                'greenstyle': 'GreenStyle',
                'studybuddy': 'StudyBuddy'
            };
            
            const searchTerm = featuredMapping[featured];
            if (searchTerm && !query) {
                SearchState.updateQuery(searchTerm);
                console.log(`🔍 Búsqueda automática aplicada: ${featured} -> ${searchTerm}`);
            }
        }
        
        // Actualizar UI con la búsqueda
        updateSearchQuery(SearchState.currentQuery);
        
        // Inicializar componentes en orden lógico
        initSearchForm();
        initFilters();
        initPagination();
        
        // Poblar filtros de categorías después de que los elementos estén inicializados
        populateCategoryFilter();
        
        // Aplicar filtros desde URL DESPUÉS de poblar las opciones
        // Usando setTimeout para asegurar que el DOM esté completamente renderizado
        await new Promise(resolve => setTimeout(resolve, 100));
        applyFiltersFromState();
        
        // Realizar búsqueda inicial
        performSearch();
        
    } catch (error) {
        console.error('❌ Error al inicializar resultados de búsqueda:', error);
        throw new Error(`Error de inicialización: ${error.message}`);
    }
}

/**
 * Cargar datos desde archivos CSV usando Fetch API
 * Implementa manejo de errores robusto y carga paralela
 * @async
 * @function loadData
 * @throws {Error} Error al cargar o parsear archivos CSV
 * @returns {Promise<void>}
 * 
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API|Fetch API - MDN}
 */
async function loadData() {
    try {
        showLoading(true);
        
        // Cargar archivos CSV en paralelo para mejor rendimiento
        // Usando Promise.all siguiendo las mejores prácticas de MDN
        const fetchPromises = [
            fetch(CONFIG.CSV_FILES.PRODUCTS),
            fetch(CONFIG.CSV_FILES.SERVICES),
            fetch(CONFIG.CSV_FILES.BUSINESSES)
        ];
        
        const responses = await Promise.all(fetchPromises);
        
        // Verificar que todas las respuestas sean exitosas
        responses.forEach((response, index) => {
            if (!response.ok) {
                const files = Object.values(CONFIG.CSV_FILES);
                throw new Error(`Error HTTP ${response.status} al cargar ${files[index]}`);
            }
        });
        
        // Convertir respuestas a texto en paralelo
        const csvTexts = await Promise.all(responses.map(response => response.text()));
        const [productsCSV, servicesCSV, businessesCSV] = csvTexts;
        
        // Parsear CSV con manejo de errores
        try {
            SearchState.products = parseCSV(productsCSV);
            SearchState.services = parseCSV(servicesCSV);
            SearchState.businesses = parseCSV(businessesCSV);
        } catch (parseError) {
            throw new Error(`Error al parsear CSV: ${parseError.message}`);
        }
        
        // Validar que los datos se cargaron correctamente
        if (SearchState.products.length === 0 && SearchState.services.length === 0) {
            console.warn('⚠️ No se encontraron productos ni servicios');
        }
        
        // Crear índice de negocios para búsqueda O(1)
        const businessIndex = new Map();
        SearchState.businesses.forEach(business => {
            businessIndex.set(business.id, business);
        });
        
        // Enriquecer productos con información del negocio usando Map para mejor rendimiento
        SearchState.products = SearchState.products.map(product => ({
            ...product,
            business: businessIndex.get(product.emprendimiento_id) || {},
            type: 'producto',
            // Agregar timestamp para debugging
            loadedAt: new Date().toISOString()
        }));
        
        // Enriquecer servicios con información del negocio
        SearchState.services = SearchState.services.map(service => ({
            ...service,
            business: businessIndex.get(service.emprendimiento_id) || {},
            type: 'servicio',
            loadedAt: new Date().toISOString()
        }));
        
        // Combinar productos y servicios en una sola lista
        SearchState.allItems = [...SearchState.products, ...SearchState.services];
        
        console.log(`✅ Datos cargados: ${SearchState.products.length} productos, ${SearchState.services.length} servicios, ${SearchState.businesses.length} negocios`);
        
    } catch (error) {
        console.error('❌ Error al cargar datos:', error);
        throw error;
    } finally {
        showLoading(false);
    }
}

/**
 * Parser mejorado de CSV que maneja correctamente campos con comas entre comillas
 * Implementa el estándar RFC 4180 para archivos CSV
 * @function parseCSV
 * @param {string} csvText - Texto CSV a parsear
 * @returns {Array<Object>} Array de objetos JavaScript
 * @throws {Error} Error si el CSV está malformado
 * 
 * @see {@link https://tools.ietf.org/html/rfc4180|RFC 4180 - CSV Format}
 */
function parseCSV(csvText) {
    if (!csvText || typeof csvText !== 'string') {
        throw new Error('CSV text debe ser una cadena no vacía');
    }
    
    const lines = csvText.trim().split('\n');
    
    if (lines.length < 2) {
        throw new Error('CSV debe tener al menos una línea de encabezados y una de datos');
    }
    
    const headers = parseCSVLine(lines[0]);
    
    if (headers.length === 0) {
        throw new Error('CSV debe tener al menos una columna');
    }
    
    return lines.slice(1)
        .filter(line => line.trim().length > 0) // Filtrar líneas vacías
        .map((line, index) => {
            try {
                const values = parseCSVLine(line);
                const obj = {};
                
                headers.forEach((header, headerIndex) => {
                    const value = values[headerIndex] || '';
                    obj[header.trim()] = value.trim();
                });
                
                return obj;
            } catch (error) {
                console.warn(`⚠️ Error en línea ${index + 2} del CSV: ${error.message}`);
                return null;
            }
        })
        .filter(Boolean); // Filtrar objetos nulos
}

/**
 * Parser de línea CSV que maneja comillas correctamente según RFC 4180
 * @function parseCSVLine
 * @param {string} line - Línea CSV a parsear
 * @returns {Array<string>} Array de valores
 * @throws {Error} Error si la línea está malformada
 */
function parseCSVLine(line) {
    if (typeof line !== 'string') {
        throw new Error('La línea debe ser una cadena');
    }
    
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Comilla escapada dentro de campo entrecomillado
                current += '"';
                i += 2;
            } else {
                // Inicio o fin de campo entrecomillado
                inQuotes = !inQuotes;
                i++;
            }
        } else if (char === ',' && !inQuotes) {
            // Separador de campo
            result.push(current);
            current = '';
            i++;
        } else {
            current += char;
            i++;
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
    const searchClear = document.querySelector('.search-clear');
    
    if (!searchForm || !searchInput) return;
    
    // Establecer valor inicial
    searchInput.value = SearchState.currentQuery;
    
    // Mostrar/ocultar botón de limpiar según el contenido inicial
    if (searchClear) {
        const hasText = SearchState.currentQuery.trim().length > 0;
        searchClear.style.display = hasText ? 'flex' : 'none';
        
        // Manejar cambios en el input para mostrar/ocultar botón de limpiar
        searchInput.addEventListener('input', function() {
            const hasText = this.value.trim().length > 0;
            searchClear.style.display = hasText ? 'flex' : 'none';
        });
        
        // Manejar click en botón de limpiar
        searchClear.addEventListener('click', function() {
            searchInput.value = '';
            searchClear.style.display = 'none';
            searchInput.focus();
            // Realizar búsqueda vacía
            SearchState.updateQuery('');
            SearchState.currentPage = 1;
            updateSearchQuery('');
            performSearch();
            updateURL();
        });
    }
    
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
    SearchState.updateQuery(newQuery);
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
    const sortByPrice = document.getElementById('sortByPrice');
    const clearFilters = document.getElementById('clearFilters');
    
    // Filtro de categoría de productos
    if (productCategoryFilter) {
        productCategoryFilter.addEventListener('change', function() {
            SearchState.updateProductCategory(this.value);
            SearchState.updateServiceCategory(''); // Limpiar el otro filtro
            if (serviceCategoryFilter) serviceCategoryFilter.value = '';
            SearchState.currentPage = 1;
            performSearch();
            updateURL();
        });
    }
    
    // Filtro de categoría de servicios
    if (serviceCategoryFilter) {
        serviceCategoryFilter.addEventListener('change', function() {
            SearchState.updateServiceCategory(this.value);
            SearchState.updateProductCategory(''); // Limpiar el otro filtro
            if (productCategoryFilter) productCategoryFilter.value = '';
            SearchState.currentPage = 1;
            performSearch();
            updateURL();
        });
    }
    
    // Botón de ordenamiento por precio
    if (sortByPrice) {
        sortByPrice.addEventListener('click', function() {
            cycleSortOrder();
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
 * Ciclar entre los diferentes órdenes de clasificación por precio
 * Implementa un patrón de estado circular: none -> asc -> desc -> none
 * @function cycleSortOrder
 * @throws {Error} Error si no se encuentra el botón de ordenamiento
 */
function cycleSortOrder() {
    const sortButton = document.getElementById('sortByPrice');
    
    if (!sortButton) {
        throw new Error('Botón de ordenamiento no encontrado en el DOM');
    }
    
    const sortIcon = sortButton.querySelector('.sort-icon');
    const sortText = sortButton.querySelector('.sort-text');
    
    if (!sortIcon || !sortText) {
        console.error('❌ Elementos del botón de ordenamiento no encontrados');
        return;
    }
    
    // Ciclar: none -> asc -> desc -> none usando constantes
    switch (SearchState.currentSortOrder) {
        case CONFIG.SORT_ORDERS.NONE:
            SearchState.updateSortOrder(CONFIG.SORT_ORDERS.ASC);
            sortButton.setAttribute('data-sort', CONFIG.SORT_ORDERS.ASC);
            sortText.textContent = 'Menor a mayor';
            // Icono de flecha hacia arriba (triángulo)
            sortIcon.innerHTML = `
                <path d="M3 18H21L12 6L3 18Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            `;
            break;
            
        case CONFIG.SORT_ORDERS.ASC:
            SearchState.updateSortOrder(CONFIG.SORT_ORDERS.DESC);
            sortButton.setAttribute('data-sort', CONFIG.SORT_ORDERS.DESC);
            sortText.textContent = 'Mayor a menor';
            // Icono de flecha hacia abajo (triángulo invertido)
            sortIcon.innerHTML = `
                <path d="M21 6H3L12 18L21 6Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            `;
            break;
            
        case CONFIG.SORT_ORDERS.DESC:
            SearchState.updateSortOrder(CONFIG.SORT_ORDERS.NONE);
            sortButton.setAttribute('data-sort', CONFIG.SORT_ORDERS.NONE);
            sortText.textContent = 'Sin ordenar';
            // Icono de líneas horizontales
            sortIcon.innerHTML = `
                <path d="M3 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7 12H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M11 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            `;
            break;
            
        default:
            console.warn(`⚠️ Estado de ordenamiento desconocido: ${SearchState.currentSortOrder}`);
            SearchState.updateSortOrder(CONFIG.SORT_ORDERS.NONE);
            break;
    }
    
    // Realizar nueva búsqueda con el ordenamiento actualizado
    SearchState.currentPage = 1; // Resetear a primera página
    performSearch();
    updateURL();
}

/**
 * Resetear todos los filtros a sus valores por defecto
 * @function resetFilters
 */
function resetFilters() {
    try {
        const productCategoryFilter = document.getElementById('productCategoryFilter');
        const serviceCategoryFilter = document.getElementById('serviceCategoryFilter');
        const sortByPrice = document.getElementById('sortByPrice');
        
        // Resetear filtros de categoría
        if (productCategoryFilter) {
            productCategoryFilter.value = '';
        }
        
        if (serviceCategoryFilter) {
            serviceCategoryFilter.value = '';
        }
        
        // Resetear ordenamiento
        if (sortByPrice) {
            sortByPrice.setAttribute('data-sort', CONFIG.SORT_ORDERS.NONE);
            const sortText = sortByPrice.querySelector('.sort-text');
            const sortIcon = sortByPrice.querySelector('.sort-icon');
            
            if (sortText) sortText.textContent = 'Sin ordenar';
            if (sortIcon) {
                sortIcon.innerHTML = `
                    <path d="M3 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M7 12H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M11 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                `;
            }
        }
        
        // Usar método del estado para resetear
        SearchState.resetFilters();
        
        // Realizar nueva búsqueda y actualizar URL
        performSearch();
        updateURL();
        
        console.log('✅ Filtros reseteados correctamente');
        
    } catch (error) {
        console.error('❌ Error al resetear filtros:', error);
        showError('Error al resetear filtros');
    }
}

/**
 * Realizar búsqueda con filtros aplicados
 * Implementa algoritmo de búsqueda y ordenamiento optimizado
 * @function performSearch
 */
function performSearch() {
    try {
        console.time('🔍 Tiempo de búsqueda');
        
        // Validar que los datos estén cargados
        if (!SearchState.allItems || SearchState.allItems.length === 0) {
            console.warn('⚠️ No hay datos para buscar');
            updateResultsCount(0);
            displayItems();
            return;
        }
        
        // Filtrar items según criterios usando filter chain para mejor legibilidad
        let filtered = SearchState.allItems
            .filter(item => {
                // Filtro de texto mejorado
                if (SearchState.currentQuery && !matchesSearchQuery(item, SearchState.currentQuery)) {
                    return false;
                }
                return true;
            })
            .filter(item => {
                // Filtro de categoría de productos
                if (SearchState.currentProductCategory) {
                    return item.type === 'producto' && item.categoria === SearchState.currentProductCategory;
                }
                return true;
            })
            .filter(item => {
                // Filtro de categoría de servicios
                if (SearchState.currentServiceCategory) {
                    return item.type === 'servicio' && item.categoria === SearchState.currentServiceCategory;
                }
                return true;
            });
        
        // Aplicar ordenamiento según el tipo de búsqueda
        if (SearchState.currentQuery) {
            // Con búsqueda: ordenar por relevancia primero
            filtered = filtered
                .map(item => ({
                    ...item,
                    relevanceScore: calculateRelevanceScore(item, SearchState.currentQuery)
                }))
                .sort((a, b) => {
                    // Primero por disponibilidad (items disponibles primero)
                    const aAvailable = a.disponible === 'true';
                    const bAvailable = b.disponible === 'true';
                    
                    if (aAvailable !== bAvailable) {
                        return bAvailable - aAvailable; // true = 1, false = 0
                    }
                    
                    // Luego por relevancia (mayor relevancia primero)
                    if (Math.abs(b.relevanceScore - a.relevanceScore) > 0.01) {
                        return b.relevanceScore - a.relevanceScore;
                    }
                    
                    // Finalmente por precio según ordenamiento seleccionado
                    return applySortOrder(a, b);
                });
        } else {
            // Sin búsqueda: ordenar por disponibilidad y precio
            filtered.sort((a, b) => {
                const aAvailable = a.disponible === 'true';
                const bAvailable = b.disponible === 'true';
                
                if (aAvailable !== bAvailable) {
                    return bAvailable - aAvailable;
                }
                
                return applySortOrder(a, b);
            });
        }
        
        // Actualizar estado con resultados filtrados
        SearchState.filteredItems = filtered;
        
        // Actualizar UI
        updateResultsCount(filtered.length);
        displayItems();
        updatePaginationControls();
        
        console.timeEnd('🔍 Tiempo de búsqueda');
        console.log(`✅ Búsqueda completada: ${filtered.length} resultados encontrados`);
        
    } catch (error) {
        console.error('❌ Error en búsqueda:', error);
        showError('Error al realizar la búsqueda. Por favor, intenta nuevamente.');
        
        // Fallback: mostrar todos los items sin filtrar
        SearchState.filteredItems = SearchState.allItems || [];
        updateResultsCount(SearchState.filteredItems.length);
        displayItems();
    }
}

/**
 * Verificar si un item coincide con la consulta de búsqueda
 * Implementa búsqueda inteligente que considera múltiples términos y tags
 * @function matchesSearchQuery
 * @param {Object} item - Item a evaluar
 * @param {string} query - Consulta de búsqueda
 * @returns {boolean} true si el item coincide con la consulta
 */
function matchesSearchQuery(item, query) {
    if (!item || !query) return true;
    
    const normalizedQuery = query.toLowerCase().trim();
    
    // Dividir la consulta en términos individuales
    const queryTerms = normalizedQuery
        .split(/\s+/)
        .filter(term => term.length > 0)
        .filter(term => term.length >= 2); // Ignorar términos muy cortos
    
    if (queryTerms.length === 0) return true;
    
    // Campos de búsqueda con valores seguros - INCLUYE NOMBRE DE EMPRENDIMIENTO
    const searchFields = {
        nombre: (item.nombre || '').toLowerCase(),
        descripcion: (item.descripcion || '').toLowerCase(),
        business: (item.business?.nombre || '').toLowerCase(),
        businessNombre: (item.business?.nombre || '').toLowerCase(), // Campo adicional para emprendimiento
        tags: (item.tags || '').toLowerCase(),
        categoria: (item.categoria || '').toLowerCase(),
        // Incluir también los datos del emprendedor para búsquedas más amplias
        emprendedorNombre: (item.business?.emprendedor_nombre || '').toLowerCase(),
        emprendedorCarrera: (item.business?.emprendedor_carrera || '').toLowerCase()
    };
    
    // Obtener tags individuales de forma segura
    const itemTags = (item.tags || '')
        .toLowerCase()
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    
    // Si la búsqueda es exactamente el nombre del emprendimiento, dar prioridad
    const businessName = (item.business?.nombre || '').toLowerCase();
    if (businessName && normalizedQuery === businessName) {
        return true;
    }
    
    // Búsqueda parcial en el nombre del emprendimiento (más flexible)
    if (businessName && businessName.includes(normalizedQuery)) {
        return true;
    }
    
    // Verificar si todos los términos de búsqueda coinciden (AND lógico)
    return queryTerms.every(term => {
        // Búsqueda en campos principales
        const matchesFields = Object.values(searchFields).some(field => 
            field.includes(term)
        );
        
        // Búsqueda exacta en tags individuales (mayor peso)
        const matchesExactTag = itemTags.some(tag => tag === term);
        
        // Búsqueda parcial en tags
        const matchesPartialTag = itemTags.some(tag => tag.includes(term));
        
        // Búsqueda en nombre de emprendimiento con diferentes variaciones
        const matchesBusinessName = businessName.includes(term);
        
        return matchesFields || matchesExactTag || matchesPartialTag || matchesBusinessName;
    });
}

/**
 * Calcular puntuación de relevancia para ordenar resultados
 * Implementa algoritmo de scoring basado en TF-IDF simplificado
 * @function calculateRelevanceScore
 * @param {Object} item - Item a evaluar
 * @param {string} query - Consulta de búsqueda
 * @returns {number} Puntuación de relevancia (0-100)
 */
function calculateRelevanceScore(item, query) {
    if (!item || !query) return 0;
    
    const normalizedQuery = query.toLowerCase().trim();
    const queryTerms = normalizedQuery
        .split(/\s+/)
        .filter(term => term.length >= 2);
    
    if (queryTerms.length === 0) return 0;
    
    let totalScore = 0;
    const businessName = (item.business?.nombre || '').toLowerCase();
    
    // BONUS ESPECIAL: Si la consulta coincide exactamente con el nombre del emprendimiento
    if (businessName && normalizedQuery === businessName) {
        totalScore += 50; // Bonus muy alto para coincidencia exacta
    }
    
    // BONUS ALTO: Si la consulta está contenida en el nombre del emprendimiento
    if (businessName && businessName.includes(normalizedQuery)) {
        totalScore += 30;
    }
    
    // Campos de búsqueda con diferentes pesos (importancia) - INCLUYE EMPRENDIMIENTO
    const searchFields = [
        { field: (item.business?.nombre || '').toLowerCase(), weight: 15 }, // PESO MÁS ALTO para emprendimiento
        { field: (item.nombre || '').toLowerCase(), weight: 12 }, // Nombre del producto/servicio
        { field: (item.tags || '').toLowerCase(), weight: 10 }, // Tags
        { field: (item.categoria || '').toLowerCase(), weight: 8 }, // Categoría
        { field: (item.descripcion || '').toLowerCase(), weight: 6 }, // Descripción
        { field: (item.business?.emprendedor_nombre || '').toLowerCase(), weight: 4 }, // Emprendedor
        { field: (item.business?.emprendedor_carrera || '').toLowerCase(), weight: 2 } // Carrera
    ];
    
    // Calcular score para cada término
    queryTerms.forEach(term => {
        searchFields.forEach(({ field, weight }) => {
            if (field.includes(term)) {
                // Bonus por coincidencia exacta de palabra completa
                const exactWordMatch = new RegExp(`\\b${escapeRegex(term)}\\b`).test(field);
                const bonus = exactWordMatch ? 2.5 : 1;
                
                // Bonus por posición (términos al inicio tienen mayor peso)
                const position = field.indexOf(term);
                const positionBonus = position === 0 ? 2 : (position < 10 ? 1.5 : 1);
                
                // Bonus por longitud del término (términos más largos son más específicos)
                const lengthBonus = term.length >= 5 ? 1.2 : 1;
                
                totalScore += weight * bonus * positionBonus * lengthBonus;
            }
        });
        
        // Bonus especial para tags exactos
        const itemTags = (item.tags || '').toLowerCase().split(',').map(t => t.trim());
        if (itemTags.includes(term)) {
            totalScore += 20; // Bonus alto para tag exacto
        }
        
        // Bonus adicional para coincidencias en el nombre del emprendimiento
        if (businessName.includes(term)) {
            const exactBusinessMatch = new RegExp(`\\b${escapeRegex(term)}\\b`).test(businessName);
            totalScore += exactBusinessMatch ? 25 : 15;
        }
    });
    
    // Bonus por disponibilidad
    if (item.disponible === 'true') {
        totalScore += 5;
    }
    
    // Normalizar score a escala 0-100
    const maxPossibleScore = queryTerms.length * 80; // Estimación del score máximo ajustada
    return Math.min(100, (totalScore / maxPossibleScore) * 100);
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
    const isService = item.type === 'servicio';
    
    // Procesar tags y resaltar coincidencias con búsqueda
    const allTags = item.tags ? item.tags.split(',').map(tag => tag.trim()) : [];
    const displayTags = allTags.slice(0, 4); // Mostrar hasta 4 tags
    const matchingTags = getMatchingTags(allTags, SearchState.currentQuery);
    
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
                ${!isAvailable ? '<div class="unavailable-badge">No disponible</div>' : ''}
            </div>
            
            <div class="product-card__content">
                <h3 class="product-card__name">${highlightSearchTerms(item.nombre, SearchState.currentQuery)}</h3>
                
                ${item.descripcion ? `
                    <p class="product-card__description">${highlightSearchTerms(truncateText(item.descripcion, 80), SearchState.currentQuery)}</p>
                ` : ''}
                
                <div class="product-card__price">${formatPrice(price)}</div>
                
                <div class="product-card__business">
                    <svg class="business-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 21V5C19 4.4 18.6 4 18 4H6C5.4 4 5 4.4 5 5V21L12 18L19 21Z" 
                              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="product-card__business-name">${highlightSearchTerms(businessName, SearchState.currentQuery)}</span>
                </div>
                
                ${displayTags.length > 0 ? `
                    <div class="product-card__tags">
                        ${displayTags.map(tag => {
                            const isMatching = matchingTags.includes(tag.toLowerCase());
                            return `<span class="product-tag ${isMatching ? 'product-tag--highlighted' : ''}">${escapeHtml(tag)}</span>`;
                        }).join('')}
                        ${allTags.length > 4 ? `<span class="product-tag product-tag--more">+${allTags.length - 4}</span>` : ''}
                    </div>
                ` : ''}
                
                ${item.relevanceScore && SearchState.currentQuery ? `
                    <div class="product-card__relevance" title="Relevancia de búsqueda">
                        <small>Relevancia: ${Math.round(item.relevanceScore)}</small>
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
 * Obtener tags que coinciden con la búsqueda
 */
function getMatchingTags(tags, query) {
    if (!query) return [];
    
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    const matchingTags = [];
    
    tags.forEach(tag => {
        const normalizedTag = tag.toLowerCase().trim();
        queryTerms.forEach(term => {
            if (normalizedTag.includes(term) && !matchingTags.includes(normalizedTag)) {
                matchingTags.push(normalizedTag);
            }
        });
    });
    
    return matchingTags;
}

/**
 * Resaltar términos de búsqueda en el texto
 */
function highlightSearchTerms(text, query) {
    if (!query || !text) return escapeHtml(text);
    
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    let highlightedText = escapeHtml(text);
    
    queryTerms.forEach(term => {
        const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<mark class="search-highlight">$1</mark>');
    });
    
    return highlightedText;
}

/**
 * Escapar caracteres especiales para regex
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Truncar texto a una longitud específica
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
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
 * Ver detalles del item en modal
 * Implementa una interfaz moderna y accesible siguiendo las mejores prácticas de UX
 * @param {string} itemId - ID del producto/servicio
 * @param {string} itemType - Tipo: 'producto' o 'servicio'
 * 
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement|Dialog Element - MDN}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/dialogmodal/|Modal Dialog Pattern - WAI-ARIA}
 */
function viewItemDetails(itemId, itemType) {
    console.log('🔍 Opening modal for:', { itemId, itemType });
    
    const modal = document.getElementById('productModal');
    
    if (!modal) {
        console.error('Modal element not found');
        return;
    }
    
    // Convertir itemId a string para comparación consistente
    const targetId = String(itemId);
    
    // Buscar el item en la lista correspondiente
    const item = SearchState.allItems.find(i => String(i.id) === targetId && i.type === itemType);
    
    console.log('🔍 Searching for item:', { targetId, itemType });
    console.log('📦 Found item:', item);
    console.log('📊 Total items available:', SearchState.allItems.length);
    
    if (!item) {
        console.error(`❌ Item not found: ${targetId} (${itemType})`);
        console.log('🔍 Available items:', SearchState.allItems.map(i => ({ id: i.id, type: i.type, name: i.nombre })));
        showError('Producto no encontrado');
        return;
    }
    
    // Abrir modal y mostrar loading
    openModal(modal);
    showModalLoading(true);
    
    // Simular carga de datos (en una app real, esto sería una llamada API)
    setTimeout(() => {
        populateModalWithItemData(item);
        showModalLoading(false);
    }, 300);
}

/**
 * Abrir modal con manejo de accesibilidad
 * @param {HTMLElement} modal - Elemento del modal
 */
function openModal(modal) {
    if (!modal) return;
    
    // Aplicar clase para mostrar modal con animación
    modal.classList.add('product-modal--open');
    modal.setAttribute('aria-hidden', 'false');
    
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';
    
    // Configurar focus trap
    setupModalFocusTrap(modal);
    
    // Focus en el modal container para accesibilidad
    const modalContent = modal.querySelector('.product-modal__content');
    if (modalContent) {
        modalContent.setAttribute('tabindex', '-1');
        modalContent.focus();
    }
    
    // Configurar event listeners
    setupModalEventListeners(modal);
}

/**
 * Cerrar modal con limpieza apropiada
 * @param {HTMLElement} modal - Elemento del modal
 */
function closeModal(modal) {
    if (!modal) return;
    
    // Remover clase y ocultar modal
    modal.classList.remove('product-modal--open');
    modal.setAttribute('aria-hidden', 'true');
    
    // Restaurar scroll del body
    document.body.style.overflow = '';
    
    // Limpiar event listeners
    cleanupModalEventListeners(modal);
    
    // Limpiar contenido del modal después de la animación
    setTimeout(() => {
        const detailsSection = modal.querySelector('#modalDetails');
        if (detailsSection) {
            detailsSection.style.display = 'none';
        }
    }, 300);
}

/**
 * Mostrar/ocultar loading en modal
 * @param {boolean} show - Mostrar loading state
 */
function showModalLoading(show) {
    const loadingSection = document.getElementById('modalLoading');
    const detailsSection = document.getElementById('modalDetails');
    
    if (loadingSection) {
        loadingSection.style.display = show ? 'flex' : 'none';
    }
    
    if (detailsSection) {
        detailsSection.style.display = show ? 'none' : 'block';
    }
}

/**
 * Poblar modal con datos del item
 * @param {Object} item - Datos del producto/servicio
 */
function populateModalWithItemData(item) {
    try {
        // Obtener elementos del modal
        const elements = {
            title: document.getElementById('modalTitle'),
            category: document.getElementById('modalCategory'),
            name: document.getElementById('modalName'),
            price: document.getElementById('modalPrice'),
            availability: document.getElementById('modalAvailability'),
            description: document.getElementById('modalDescription'),
            tags: document.getElementById('modalTags'),
            tagsSection: document.getElementById('modalTagsSection'),
            businessName: document.getElementById('modalBusinessName'),
            businessDescription: document.getElementById('modalBusinessDescription'),
            businessEmail: document.getElementById('modalBusinessEmail'),
            contactBtn: document.getElementById('modalContactBtn')
        };
        
        // Verificar que los elementos existen
        const missingElements = Object.entries(elements)
            .filter(([key, element]) => !element)
            .map(([key]) => key);
        
        if (missingElements.length > 0) {
            console.warn('Missing modal elements:', missingElements);
        }
        
        // Poblar información básica
        const typeText = item.type === 'servicio' ? 'Detalle del Servicio' : 'Detalle del Producto';
        if (elements.title) elements.title.textContent = typeText;
        
        if (elements.category) {
            elements.category.textContent = formatCategoryName(item.categoria || 'General');
        }
        
        if (elements.name) {
            elements.name.textContent = item.nombre || 'Sin nombre';
        }
        
        if (elements.price) {
            const price = parseInt(item.precio) || 0;
            elements.price.textContent = formatPrice(price);
        }
        
        // Manejo de disponibilidad
        if (elements.availability) {
            const isAvailable = item.disponible === 'true' || item.disponible === true;
            const availabilityBadge = elements.availability.querySelector('.availability-badge');
            const availabilityText = elements.availability.querySelector('.availability-text');
            const availabilityIcon = elements.availability.querySelector('.availability-icon');
            
            if (availabilityBadge) {
                availabilityBadge.className = isAvailable 
                    ? 'availability-badge availability-badge--available'
                    : 'availability-badge availability-badge--unavailable';
            }
            
            if (availabilityText) {
                availabilityText.textContent = isAvailable ? 'Disponible' : 'No disponible';
            }
            
            if (availabilityIcon && !isAvailable) {
                availabilityIcon.innerHTML = `
                    <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                `;
            }
        }
        
        // Descripción
        if (elements.description) {
            const description = item.descripcion || 'Descripción no disponible';
            elements.description.textContent = description;
        }
        
        // Tags/Características
        if (elements.tags && elements.tagsSection) {
            const tags = item.tags ? item.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
            
            if (tags.length > 0) {
                elements.tags.innerHTML = tags.map(tag => 
                    `<span class="product-tag">${escapeHtml(tag)}</span>`
                ).join('');
                elements.tagsSection.style.display = 'block';
            } else {
                elements.tagsSection.style.display = 'none';
            }
        }
        
        // Información del emprendimiento
        const business = item.business || {};
        if (elements.businessName) {
            elements.businessName.textContent = business.nombre || 'Emprendimiento no especificado';
        }
        
        if (elements.businessDescription) {
            elements.businessDescription.textContent = business.descripcion || 'Información no disponible';
        }
        
        if (elements.businessEmail) {
            const email = business.email || '';
            elements.businessEmail.textContent = email || 'Contacto no disponible';
            elements.businessEmail.style.display = email ? 'inline' : 'none';
        }
        
        // Configurar botón de contacto
        if (elements.contactBtn) {
            const email = business.email;
            const businessName = business.nombre || 'Emprendimiento';
            
            if (email) {
                elements.contactBtn.onclick = () => contactBusiness(email, businessName);
                elements.contactBtn.disabled = false;
                elements.contactBtn.style.opacity = '1';
            } else {
                elements.contactBtn.onclick = () => alert('Información de contacto no disponible');
                elements.contactBtn.disabled = true;
                elements.contactBtn.style.opacity = '0.6';
            }
        }
        
        console.log('✅ Modal populated successfully with item data:', item.nombre);
        
    } catch (error) {
        console.error('❌ Error populating modal:', error);
        showError('Error al cargar los detalles del producto');
    }
}

/**
 * Configurar event listeners del modal
 * @param {HTMLElement} modal - Elemento del modal
 */
function setupModalEventListeners(modal) {
    const overlay = modal.querySelector('.product-modal__overlay');
    const closeBtn = modal.querySelector('.product-modal__close');
    const closeSecondaryBtn = document.getElementById('modalCloseBtn');
    
    // Cerrar al hacer click en overlay
    if (overlay) {
        overlay.addEventListener('click', () => closeModal(modal));
    }
    
    // Cerrar con botón X
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeModal(modal));
    }
    
    // Cerrar con botón secundario
    if (closeSecondaryBtn) {
        closeSecondaryBtn.addEventListener('click', () => closeModal(modal));
    }
    
    // Cerrar con Escape
    const escapeHandler = (event) => {
        if (event.key === 'Escape') {
            closeModal(modal);
        }
    };
    
    document.addEventListener('keydown', escapeHandler);
    modal._escapeHandler = escapeHandler; // Guardar referencia para cleanup
}

/**
 * Limpiar event listeners del modal
 * @param {HTMLElement} modal - Elemento del modal
 */
function cleanupModalEventListeners(modal) {
    if (modal._escapeHandler) {
        document.removeEventListener('keydown', modal._escapeHandler);
        delete modal._escapeHandler;
    }
}

/**
 * Configurar focus trap para accesibilidad
 * @param {HTMLElement} modal - Elemento del modal
 */
function setupModalFocusTrap(modal) {
    const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    if (!firstFocusable) return;
    
    const trapFocus = (event) => {
        if (event.key === 'Tab') {
            if (event.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    event.preventDefault();
                    lastFocusable?.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    event.preventDefault();
                    firstFocusable?.focus();
                }
            }
        }
    };
    
    modal.addEventListener('keydown', trapFocus);
    modal._focusTrap = trapFocus; // Guardar referencia para cleanup
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
    
    if (SearchState.currentSortOrder !== 'none') {
        params.set('sortOrder', SearchState.currentSortOrder);
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
    const sortByPrice = document.getElementById('sortByPrice');
    
    console.log('🔧 Aplicando filtros desde estado:', {
        productCategory: SearchState.currentProductCategory,
        serviceCategory: SearchState.currentServiceCategory,
        sortOrder: SearchState.currentSortOrder
    });
    
    if (productCategoryFilter) {
        productCategoryFilter.value = SearchState.currentProductCategory;
    }
    
    if (serviceCategoryFilter) {
        serviceCategoryFilter.value = SearchState.currentServiceCategory;
    }
    
    if (sortByPrice) {
        sortByPrice.setAttribute('data-sort', SearchState.currentSortOrder);
    }
    
    console.log('✅ Filtros aplicados desde estado');
}

/**
 * Ordenar por precio según ordenamiento seleccionado
 */
function applySortOrder(a, b) {
    const priceA = parseInt(a.precio) || 0;
    const priceB = parseInt(b.precio) || 0;
    
    switch (SearchState.currentSortOrder) {
        case 'asc':
            return priceA - priceB; // Menor a mayor
        case 'desc':
            return priceB - priceA; // Mayor a menor
        case 'none':
        default:
            return 0; // Sin ordenamiento específico por precio
    }
} 