/**
 * Edunari - Gestión de Sesiones de Usuario
 * Maneja el estado de autenticación y actualiza la interfaz
 * 
 * @fileoverview Módulo para gestión de sesiones de usuario
 * @author Edunari Team
 * @version 1.0.0
 */

// Estado global de sesión
const UserSession = Object.seal({
    currentUser: null,
    isLoggedIn: false,
    
    // Métodos para gestionar sesión
    setUser(userEmailOrData) {
        // Manejar tanto string (email) como objeto (datos completos)
        if (typeof userEmailOrData === 'string') {
            // Formato legacy: solo email
            this.currentUser = userEmailOrData;
            this.isLoggedIn = true;
            localStorage.setItem('currentUser', userEmailOrData);
        } else if (typeof userEmailOrData === 'object' && userEmailOrData.email) {
            // Formato nuevo: objeto completo
            this.currentUser = userEmailOrData.email;
            this.isLoggedIn = true;
            localStorage.setItem('currentUser', JSON.stringify(userEmailOrData));
        } else {
            console.error('Formato de usuario inválido:', userEmailOrData);
            return;
        }
        
        this.updateUI();
        console.log('Usuario autenticado:', this.currentUser);
    },
    
    clearUser() {
        this.currentUser = null;
        this.isLoggedIn = false;
        localStorage.removeItem('currentUser');
        this.updateUI();
    },
    
    // Inicializar sesión desde localStorage
    initFromStorage() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                // Intentar parsear como JSON (formato nuevo)
                const userData = JSON.parse(savedUser);
                if (userData.email) {
                    this.currentUser = userData.email;
                    this.isLoggedIn = true;
                } else {
                    throw new Error('Formato JSON inválido');
                }
            } catch {
                // Formato legacy: string simple (solo email)
                this.currentUser = savedUser;
                this.isLoggedIn = true;
            }
        }
        this.updateUI();
    },
    
    // Actualizar interfaz según estado de sesión
    updateUI() {
        this.updateHeader();
        this.updatePageAccess();
    },
    
    // Actualizar header con botones o icono de usuario
    updateHeader() {
        const navList = document.querySelector('.header__nav .nav-list');
        if (!navList) return;
        
        // Buscar elementos de navegación existentes
        const loginItem = navList.querySelector('.nav-button--login')?.closest('.nav-item');
        const registerItem = navList.querySelector('.nav-button--register')?.closest('.nav-item');
        const userItem = navList.querySelector('.nav-item--user');
        
        if (this.isLoggedIn) {
            // Usuario autenticado: ocultar login/registro, mostrar perfil
            if (loginItem) loginItem.style.display = 'none';
            if (registerItem) registerItem.style.display = 'none';
            
            if (!userItem) {
                // Crear elemento de usuario si no existe
                this.createUserNavItem(navList);
            } else {
                // Mostrar elemento existente
                userItem.style.display = 'block';
                this.updateUserNavItem(userItem);
            }
        } else {
            // Usuario no autenticado: mostrar login/registro, ocultar perfil
            if (loginItem) loginItem.style.display = 'block';
            if (registerItem) registerItem.style.display = 'block';
            if (userItem) userItem.style.display = 'none';
        }
    },
    
    // Crear elemento de navegación para usuario autenticado
    createUserNavItem(navList) {
        const userItem = document.createElement('li');
        userItem.className = 'nav-item nav-item--user';
        
        userItem.innerHTML = `
            <div class="user-menu">
                <button class="user-menu__trigger" aria-expanded="false" aria-haspopup="true">
                    <div class="user-avatar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </div>
                    <span class="user-email">${this.currentUser}</span>
                    <svg class="dropdown-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <div class="user-menu__dropdown">
                    <a href="profile.html" class="user-menu__item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        Mi Perfil
                    </a>
                    <button class="user-menu__item user-menu__logout" type="button">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <polyline points="16,17 21,12 16,7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        `;
        
        // Insertar antes del último item (menú dropdown)
        const lastItem = navList.lastElementChild;
        navList.insertBefore(userItem, lastItem);
        
        // Configurar event listeners
        this.setupUserMenuEvents(userItem);
    },
    
    // Actualizar información en elemento de usuario existente
    updateUserNavItem(userItem) {
        const emailSpan = userItem.querySelector('.user-email');
        if (emailSpan) {
            emailSpan.textContent = this.currentUser;
        }
    },
    
    // Configurar eventos del menú de usuario
    setupUserMenuEvents(userItem) {
        const trigger = userItem.querySelector('.user-menu__trigger');
        const dropdown = userItem.querySelector('.user-menu__dropdown');
        const logoutBtn = userItem.querySelector('.user-menu__logout');
        
        if (trigger && dropdown) {
            // Toggle dropdown
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const isOpen = trigger.getAttribute('aria-expanded') === 'true';
                
                // Cerrar otros dropdowns abiertos
                document.querySelectorAll('.user-menu__trigger[aria-expanded="true"]')
                    .forEach(btn => {
                        if (btn !== trigger) {
                            btn.setAttribute('aria-expanded', 'false');
                            btn.nextElementSibling?.classList.remove('user-menu__dropdown--open');
                        }
                    });
                
                // Toggle actual
                trigger.setAttribute('aria-expanded', !isOpen);
                dropdown.classList.toggle('user-menu__dropdown--open', !isOpen);
            });
            
            // Cerrar dropdown al hacer click fuera
            document.addEventListener('click', (e) => {
                if (!userItem.contains(e.target)) {
                    trigger.setAttribute('aria-expanded', 'false');
                    dropdown.classList.remove('user-menu__dropdown--open');
                }
            });
        }
        
        // Evento de logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    },
    
    // Controlar acceso a páginas según autenticación
    updatePageAccess() {
        const currentPage = window.location.pathname;
        
        // Redirigir si está en páginas de auth y ya está autenticado
        if (this.isLoggedIn && (currentPage.includes('login.html') || currentPage.includes('register.html'))) {
            console.log('Usuario ya autenticado, redirigiendo...');
            window.location.href = 'index.html';
        }
        
        // Redirigir si está en perfil y no está autenticado
        if (!this.isLoggedIn && currentPage.includes('profile.html')) {
            console.log('Usuario no autenticado, redirigiendo a login...');
            window.location.href = 'login.html';
        }
    },
    
    // Cerrar sesión
    logout() {
        console.log('Cerrando sesión...');
        
        // Mostrar confirmación
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            this.clearUser();
            
            // Mostrar notificación
            this.showNotification('Sesión cerrada exitosamente', 'success');
            
            // Redirigir a página principal después de un delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    },
    
    // Obtener información del usuario actual
    getUserInfo() {
        if (!this.isLoggedIn) return null;
        
        try {
            // Intentar obtener información completa desde localStorage
            const currentUserData = localStorage.getItem('currentUser');
            
            if (currentUserData) {
                // Si es JSON, parsear; si es string simple (modo legacy), manejar
                let userInfo;
                try {
                    userInfo = JSON.parse(currentUserData);
                } catch {
                    // Formato legacy: solo email
                    userInfo = { email: currentUserData };
                }
                
                // Obtener datos adicionales desde localStorage de usuarios
                const users = this.getUsersFromLocalStorage();
                const userData = users.find(user => 
                    user.email.toLowerCase() === userInfo.email.toLowerCase()
                );
                
                return {
                    email: userInfo.email,
                    nombre: userInfo.nombre || userData?.nombre || '',
                    apellido: userInfo.apellido || userData?.apellido || '',
                    numero_telefono: userInfo.numero_telefono || userData?.numero_telefono || '',
                    joinDate: userData?.joinDate || new Date().toISOString(),
                    lastLogin: userData?.lastLogin || new Date().toISOString(),
                    ...userData
                };
            }
            
            // Fallback: usar this.currentUser
            const users = this.getUsersFromLocalStorage();
            const userData = users.find(user => 
                user.email.toLowerCase() === this.currentUser.toLowerCase()
            );
            
            return {
                email: this.currentUser,
                nombre: userData?.nombre || '',
                apellido: userData?.apellido || '',
                numero_telefono: userData?.numero_telefono || '',
                joinDate: userData?.joinDate || new Date().toISOString(),
                lastLogin: userData?.lastLogin || new Date().toISOString(),
                ...userData
            };
        } catch (error) {
            console.error('Error obteniendo información del usuario:', error);
            return {
                email: this.currentUser,
                nombre: '',
                apellido: '',
                numero_telefono: '',
                joinDate: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };
        }
    },
    
    // Helper para obtener usuarios desde localStorage
    getUsersFromLocalStorage() {
        try {
            const storedUsers = localStorage.getItem('edunari_users');
            return storedUsers ? JSON.parse(storedUsers) : [];
        } catch (error) {
            console.error('Error leyendo usuarios:', error);
            return [];
        }
    },
    
    // Sistema de notificaciones simple
    showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
            <div class="notification__content">
                <span class="notification__message">${message}</span>
                <button class="notification__close" aria-label="Cerrar">×</button>
            </div>
        `;
        
        // Estilos inline
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '9999',
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            color: 'white',
            fontWeight: '500',
            maxWidth: '400px',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease-out',
            backgroundColor: type === 'success' ? '#10b981' : 
                             type === 'error' ? '#ef4444' : '#3b82f6'
        });
        
        // Agregar al DOM
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Configurar cierre
        const closeButton = notification.querySelector('.notification__close');
        const closeNotification = () => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        };
        
        closeButton.addEventListener('click', closeNotification);
        
        // Auto-cerrar después de 5 segundos
        setTimeout(closeNotification, 5000);
    }
});

// Inicializar sesión cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    try {
        UserSession.initFromStorage();
        console.log('✅ Sesión de usuario inicializada');
    } catch (error) {
        console.error('❌ Error inicializando sesión:', error);
    }
});

// Exportar para uso global
window.UserSession = UserSession; 