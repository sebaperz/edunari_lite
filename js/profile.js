/**
 * Edunari - JavaScript para página de perfil de usuario
 * Manejo de información del usuario y navegación entre secciones
 * 
 * @fileoverview Módulo de perfil de usuario
 * @author Edunari Team
 * @version 1.0.0
 */

// Estado del perfil
const ProfileState = {
    currentSection: 'info',
    userInfo: null,
    
    // Cambiar sección activa
    setActiveSection(sectionId) {
        this.currentSection = sectionId;
        this.updateSectionVisibility();
        this.updateNavigation();
    },
    
    // Actualizar visibilidad de secciones
    updateSectionVisibility() {
        document.querySelectorAll('.profile-section').forEach(section => {
            section.classList.remove('profile-section--active');
        });
        
        const activeSection = document.getElementById(`section-${this.currentSection}`);
        if (activeSection) {
            activeSection.classList.add('profile-section--active');
        }
    },
    
    // Actualizar navegación
    updateNavigation() {
        document.querySelectorAll('.profile-nav__item').forEach(item => {
            item.classList.remove('profile-nav__item--active');
        });
        
        const activeNavItem = document.querySelector(`[data-section="${this.currentSection}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('profile-nav__item--active');
        }
    }
};

// Inicializar página de perfil
document.addEventListener('DOMContentLoaded', function() {
    try {
        initProfilePage();
        console.log('✅ Página de perfil inicializada');
    } catch (error) {
        console.error('❌ Error al inicializar página de perfil:', error);
        showErrorMessage('Error al cargar el perfil');
    }
});

/**
 * Inicializar página de perfil
 */
function initProfilePage() {
    // Verificar si el usuario está autenticado
    checkAuthentication();
    
    // Cargar información del usuario
    loadUserInfo();
    
    // Configurar navegación entre secciones
    setupSectionNavigation();
    
    // Configurar botones de acción
    setupActionButtons();
    
    // Actualizar actividad reciente
    updateRecentActivity();
}

/**
 * Verificar autenticación del usuario
 */
function checkAuthentication() {
    if (!window.UserSession || !UserSession.isLoggedIn) {
        console.log('Usuario no autenticado, redirigiendo...');
        showErrorMessage('Debes iniciar sesión para ver tu perfil');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        
        return false;
    }
    
    return true;
}

/**
 * Cargar información del usuario
 */
function loadUserInfo() {
    if (!UserSession?.isLoggedIn) {
        console.warn('Usuario no está autenticado');
        return;
    }
    
    const userInfo = UserSession.getUserInfo();
    if (!userInfo) {
        console.error('No se pudo obtener información del usuario');
        return;
    }
    
    ProfileState.userInfo = userInfo;
    
    // Actualizar elementos del DOM
    updateProfileDisplay(userInfo);
}

/**
 * Actualizar display del perfil con información del usuario
 */
function updateProfileDisplay(userInfo) {
    // Actualizar header
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    
    // Crear nombre completo si está disponible
    let displayName = userInfo.name || getUsernameFromEmail(userInfo.email);
    if (userInfo.nombre || userInfo.apellido) {
        displayName = `${userInfo.nombre || ''} ${userInfo.apellido || ''}`.trim();
        if (!displayName) {
            displayName = getUsernameFromEmail(userInfo.email);
        }
    }
    
    if (profileName) {
        profileName.textContent = displayName;
    }
    
    if (profileEmail) {
        profileEmail.textContent = userInfo.email;
    }
    
    // Actualizar información en la sección de detalles
    const userEmail = document.getElementById('userEmail');
    const userNombre = document.getElementById('userNombre');
    const userApellido = document.getElementById('userApellido');
    const userTelefono = document.getElementById('userTelefono');
    const userJoinDate = document.getElementById('userJoinDate');
    const userLastLogin = document.getElementById('userLastLogin');
    const sessionCount = document.getElementById('sessionCount');
    
    if (userEmail) {
        userEmail.textContent = userInfo.email;
    }
    
    if (userNombre) {
        userNombre.textContent = userInfo.nombre || '--';
    }
    
    if (userApellido) {
        userApellido.textContent = userInfo.apellido || '--';
    }
    
    if (userTelefono) {
        userTelefono.textContent = userInfo.numero_telefono || '--';
    }
    
    if (userJoinDate) {
        const joinDate = new Date(userInfo.joinDate || Date.now());
        userJoinDate.textContent = formatDate(joinDate);
    }
    
    if (userLastLogin) {
        const lastLogin = new Date(userInfo.lastLogin || Date.now());
        userLastLogin.textContent = formatDate(lastLogin);
    }
    
    if (sessionCount) {
        const sessions = getSessionCount(userInfo.email);
        sessionCount.textContent = sessions;
    }
}

/**
 * Obtener nombre de usuario desde email
 */
function getUsernameFromEmail(email) {
    return email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Formatear fecha para mostrar
 */
function formatDate(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Hoy';
    } else if (diffDays === 1) {
        return 'Ayer';
    } else if (diffDays < 7) {
        return `Hace ${diffDays} días`;
    } else {
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

/**
 * Obtener contador de sesiones
 */
function getSessionCount(email) {
    try {
        const sessionData = localStorage.getItem(`sessions_${email}`);
        if (sessionData) {
            const sessions = JSON.parse(sessionData);
            return sessions.count || 1;
        }
        
        // Primera vez, establecer contador
        const sessionInfo = {
            count: 1,
            firstLogin: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        
        localStorage.setItem(`sessions_${email}`, JSON.stringify(sessionInfo));
        return 1;
        
    } catch (error) {
        console.error('Error obteniendo contador de sesiones:', error);
        return 1;
    }
}

/**
 * Configurar navegación entre secciones
 */
function setupSectionNavigation() {
    const navItems = document.querySelectorAll('.profile-nav__item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            if (sectionId) {
                ProfileState.setActiveSection(sectionId);
            }
        });
    });
}

/**
 * Configurar botones de acción
 */
function setupActionButtons() {
    // Botón de editar perfil
    const editBtn = document.getElementById('editProfileBtn');
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            showInfoMessage('Funcionalidad de edición en desarrollo');
        });
    }
    
    // Botón de cerrar sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (UserSession) {
                UserSession.logout();
            }
        });
    }
}

/**
 * Actualizar actividad reciente
 */
function updateRecentActivity() {
    const lastLoginActivity = document.getElementById('lastLoginActivity');
    const accountCreatedActivity = document.getElementById('accountCreatedActivity');
    
    if (lastLoginActivity && ProfileState.userInfo) {
        const lastLogin = new Date(ProfileState.userInfo.lastLogin || Date.now());
        lastLoginActivity.textContent = formatDate(lastLogin);
    }
    
    if (accountCreatedActivity && ProfileState.userInfo) {
        const joinDate = new Date(ProfileState.userInfo.joinDate || Date.now());
        accountCreatedActivity.textContent = formatDate(joinDate);
    }
}

/**
 * Actualizar estadísticas del usuario
 */
function updateUserStats() {
    // Aquí se pueden agregar llamadas a APIs para obtener estadísticas reales
    // Por ahora mostramos valores predeterminados
    
    console.log('Estadísticas del usuario actualizadas');
}

/**
 * Mostrar mensaje de éxito
 */
function showSuccessMessage(message) {
    if (UserSession && UserSession.showNotification) {
        UserSession.showNotification(message, 'success');
    } else {
        alert(message);
    }
}

/**
 * Mostrar mensaje de error
 */
function showErrorMessage(message) {
    if (UserSession && UserSession.showNotification) {
        UserSession.showNotification(message, 'error');
    } else {
        alert(message);
    }
}

/**
 * Mostrar mensaje informativo
 */
function showInfoMessage(message) {
    if (UserSession && UserSession.showNotification) {
        UserSession.showNotification(message, 'info');
    } else {
        alert(message);
    }
}

/**
 * Funciones de utilidad para debugging
 */
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.ProfileDebug = {
        state: ProfileState,
        loadUserInfo,
        updateUserStats,
        formatDate,
        getUsernameFromEmail
    };
    
    console.log('🔧 Modo debug activado para perfil de usuario');
} 