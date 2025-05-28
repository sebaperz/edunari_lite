/**
 * Edunari - JavaScript principal
 * Manejo de interactividad y funcionalidades del frontend
 */

// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api';

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    
    // Inicializar componentes
    initDropdown();
    initSearch();
    initSearchFilters();
    
    console.log('Edunari cargado correctamente');
});

/**
 * Inicializar funcionalidad del dropdown
 * Siguiendo las mejores prácticas de accesibilidad (ARIA)
 */
function initDropdown() {
    const dropdown = document.querySelector('.dropdown');
    const dropdownToggle = dropdown?.querySelector('.dropdown-toggle');
    const dropdownMenu = dropdown?.querySelector('.dropdown-menu');
    
    if (!dropdown || !dropdownToggle || !dropdownMenu) {
        console.warn('Elementos del dropdown no encontrados');
        return;
    }
    
    // Manejar click en el botón del dropdown
    dropdownToggle.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        toggleDropdown();
    });
    
    // Cerrar dropdown al hacer click fuera
    document.addEventListener('click', function(event) {
        if (!dropdown.contains(event.target)) {
            closeDropdown();
        }
    });
    
    // Manejar teclas de escape y enter
    dropdownToggle.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeDropdown();
            dropdownToggle.focus();
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleDropdown();
        }
    });
    
    // Navegación con teclas de flecha en el menú
    dropdownMenu.addEventListener('keydown', function(event) {
        const menuItems = dropdownMenu.querySelectorAll('.dropdown-item');
        const currentIndex = Array.from(menuItems).indexOf(document.activeElement);
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                const nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
                menuItems[nextIndex].focus();
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
                menuItems[prevIndex].focus();
                break;
                
            case 'Escape':
                event.preventDefault();
                closeDropdown();
                dropdownToggle.focus();
                break;
                
            case 'Tab':
                if (event.shiftKey && currentIndex === 0) {
                    closeDropdown();
                } else if (!event.shiftKey && currentIndex === menuItems.length - 1) {
                    closeDropdown();
                }
                break;
        }
    });
    
    /**
     * Alternar estado del dropdown
     */
    function toggleDropdown() {
        const isOpen = dropdown.classList.contains('active');
        
        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }
    
    /**
     * Abrir dropdown
     */
    function openDropdown() {
        dropdown.classList.add('active');
        dropdownToggle.setAttribute('aria-expanded', 'true');
        
        // Enfocar primer elemento del menú
        const firstMenuItem = dropdownMenu.querySelector('.dropdown-item');
        if (firstMenuItem) {
            firstMenuItem.focus();
        }
    }
    
    /**
     * Cerrar dropdown
     */
    function closeDropdown() {
        dropdown.classList.remove('active');
        dropdownToggle.setAttribute('aria-expanded', 'false');
    }
}

/**
 * Inicializar funcionalidad de búsqueda
 */
function initSearch() {
    const searchForm = document.querySelector('.search-form');
    const searchInput = document.querySelector('.search-input');
    const searchClear = document.querySelector('.search-clear');
    
    if (!searchForm || !searchInput) {
        console.warn('Elementos de búsqueda no encontrados');
        return;
    }
    
    // Verificar si hay texto inicial al cargar la página y mostrar/ocultar botón de limpiar
    if (searchClear) {
        const initialText = searchInput.value.trim();
        searchClear.style.display = initialText.length > 0 ? 'flex' : 'none';
        
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
        });
    }
    
    // Manejar envío del formulario de búsqueda
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();
        handleSearch();
    });
    
    // Manejar Enter en el input de búsqueda
    searchInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSearch();
        }
    });
    
    /**
     * Manejar búsqueda - Redirigir a página de resultados
     */
    function handleSearch() {
        const query = searchInput.value.trim();
        
        if (query === '') {
            showSearchError('Por favor, ingresa un término de búsqueda');
            return;
        }
        
        if (query.length < 2) {
            showSearchError('El término de búsqueda debe tener al menos 2 caracteres');
            return;
        }
        
        // Redirigir a la página de resultados
        redirectToResults(query);
    }
    
    /**
     * Mostrar error de búsqueda
     */
    function showSearchError(message) {
        console.warn('Error de búsqueda:', message);
        
        // Feedback visual de error
        searchInput.style.borderColor = 'var(--color-error, #dc2626)';
        searchInput.focus();
        
        // Mostrar mensaje de error temporal
        showTemporaryMessage(message, 'error');
        
        setTimeout(() => {
            searchInput.style.borderColor = '';
        }, 2000);
    }
}

/**
 * Redirigir a la página de resultados con parámetros de búsqueda
 */
function redirectToResults(query, filters = {}) {
    const searchParams = new URLSearchParams({
        q: query,
        type: filters.type || 'all',
        ...(filters.category && { category: filters.category })
    });
    
    // Redirigir a la página de resultados
    window.location.href = `search-results.html?${searchParams.toString()}`;
}

/**
 * Función para búsquedas de ejemplo (usada en demo_search.html)
 */
function performExampleSearch(term) {
    redirectToResults(term);
}

/**
 * Mostrar mensaje temporal
 */
function showTemporaryMessage(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#fee2e2' : '#dbeafe'};
        color: ${type === 'error' ? '#dc2626' : '#1e40af'};
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

/**
 * Inicializar filtros de búsqueda
 */
function initSearchFilters() {
    // Cargar categorías para filtros (si existen elementos de filtro)
    loadCategories();
}

/**
 * Cargar categorías desde la API
 */
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (response.ok) {
            const data = await response.json();
            console.log('Categorías cargadas:', data);
            
            // Almacenar categorías globalmente para uso posterior
            window.edunariCategories = data;
        }
    } catch (error) {
        console.warn('No se pudieron cargar las categorías:', error);
    }
}

/**
 * Contactar emprendedor
 */
function contactEntrepreneur(contact) {
    if (contact.startsWith('@')) {
        // Instagram
        window.open(`https://instagram.com/${contact.substring(1)}`, '_blank');
    } else if (contact.includes('@')) {
        // Email
        window.location.href = `mailto:${contact}`;
    } else {
        console.log('Contactar:', contact);
    }
}

/**
 * Utilidades generales
 */

// Función debounce para optimizar rendimiento
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

// Función throttle para limitar ejecuciones
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Agregar estilos para animaciones de notificaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Exportar para uso en otros módulos (si se implementa un sistema de módulos)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        redirectToResults,
        performExampleSearch,
        contactEntrepreneur,
        debounce,
        throttle
    };
} 