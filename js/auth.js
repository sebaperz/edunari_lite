/**
 * Edunari - JavaScript para páginas de autenticación
 * Manejo de login, registro y validación de formularios
 * 
 * @fileoverview Módulo de autenticación con validación robusta y UX mejorada
 * @author Edunari Team
 * @version 1.0.0
 * 
 * Referencias de documentación oficial:
 * - MDN Form Validation: https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation
 * - MDN Web Security: https://developer.mozilla.org/en-US/docs/Web/Security
 * - WCAG Accessibility: https://www.w3.org/WAI/WCAG21/quickref/
 */

// Estado global de autenticación usando Object.seal para control de mutabilidad
const AuthState = Object.seal({
    isLoading: false,
    currentForm: null,
    validationRules: Object.freeze({
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        // Regex para números colombianos: +57 o 57 seguido de 3 y 9 dígitos más
        phone: /^(\+?57)?[\s-]?[3][0-9]{9}$/,
        password: Object.freeze({
            minLength: 8,
            maxLength: 128, // Límite de seguridad
            hasUppercase: /[A-Z]/,
            hasLowercase: /[a-z]/,
            hasNumber: /\d/,
            hasSpecial: /[!@#$%^&*(),.?":{}|<>]/
        })
    }),
    
    // Métodos para actualizar estado de forma controlada
    setLoading(loading) {
        this.isLoading = Boolean(loading);
    },
    
    setCurrentForm(formType) {
        if (['login', 'register'].includes(formType)) {
            this.currentForm = formType;
        } else {
            throw new Error(`Tipo de formulario inválido: ${formType}`);
        }
    }
});

// Constantes de configuración
const AUTH_CONFIG = Object.freeze({
    API_TIMEOUT: 10000, // 10 segundos
    PASSWORD_STRENGTH_LEVELS: {
        WEAK: { min: 0, max: 39, text: 'Débil', class: 'weak' },
        MEDIUM: { min: 40, max: 79, text: 'Medio', class: 'medium' },
        STRONG: { min: 80, max: 100, text: 'Fuerte', class: 'strong' }
    },
    NOTIFICATION_DURATION: 5000,
    DEBOUNCE_DELAY: 300
});

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    
    try {
        // Detectar qué página estamos cargando
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) {
            AuthState.setCurrentForm('login');
            initLoginPage();
        } else if (registerForm) {
            AuthState.setCurrentForm('register');
            initRegisterPage();
        } else {
            console.warn('⚠️ No se encontró formulario de autenticación');
            return;
        }
        
        console.log(`✅ Página de ${AuthState.currentForm} cargada correctamente`);
        
    } catch (error) {
        console.error('❌ Error al inicializar página de autenticación:', error);
        showErrorMessage('Error al cargar la página. Por favor, recarga el navegador.');
    }
});

/**
 * Inicializar página de login
 * @function initLoginPage
 * @throws {Error} Error si no se pueden inicializar los componentes
 */
function initLoginPage() {
    try {
        const form = document.getElementById('loginForm');
        const passwordToggle = document.getElementById('passwordToggle');
        
        if (!form) {
            throw new Error('Formulario de login no encontrado');
        }
        
        // Configurar toggle de contraseña
        if (passwordToggle) {
            initPasswordToggle('password', 'passwordToggle');
        }
        
        // Configurar validación del formulario
        initFormValidation(form);
        form.addEventListener('submit', handleLogin);
        
        // Configurar botones sociales
        initSocialButtons();
        
        // Configurar accesibilidad
        setupAccessibility(form);
        
        console.log('✅ Página de login inicializada');
        
    } catch (error) {
        console.error('❌ Error al inicializar página de login:', error);
        throw error;
    }
}

/**
 * Inicializar página de registro
 * @function initRegisterPage
 * @throws {Error} Error si no se pueden inicializar los componentes
 */
function initRegisterPage() {
    try {
        const form = document.getElementById('registerForm');
        const passwordToggle = document.getElementById('passwordToggle');
        const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
        const passwordInput = document.getElementById('password');
        
        if (!form) {
            throw new Error('Formulario de registro no encontrado');
        }
        
        // Configurar toggles de contraseña
        if (passwordToggle) {
            initPasswordToggle('password', 'passwordToggle');
        }
        
        if (confirmPasswordToggle) {
            initPasswordToggle('confirmPassword', 'confirmPasswordToggle');
        }
        
        // Configurar indicador de fortaleza de contraseña
        if (passwordInput) {
            initPasswordStrength();
        }
        
        // Configurar validación del formulario
        initFormValidation(form);
        form.addEventListener('submit', handleRegister);
        
        // Configurar botones sociales
        initSocialButtons();
        
        // Configurar accesibilidad
        setupAccessibility(form);
        
        console.log('✅ Página de registro inicializada');
        
    } catch (error) {
        console.error('❌ Error al inicializar página de registro:', error);
        throw error;
    }
}

/**
 * Configurar accesibilidad del formulario
 * @function setupAccessibility
 * @param {HTMLFormElement} form - Formulario a configurar
 */
function setupAccessibility(form) {
    if (!form) return;
    
    // Configurar ARIA labels y roles
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        const label = form.querySelector(`label[for="${input.id}"]`);
        if (label && !input.getAttribute('aria-labelledby')) {
            input.setAttribute('aria-labelledby', label.id || `label-${input.id}`);
        }
        
        // Configurar aria-describedby para errores
        const errorElement = form.querySelector(`#${input.id}Error`);
        if (errorElement) {
            input.setAttribute('aria-describedby', errorElement.id);
        }
    });
    
    // Configurar navegación por teclado
    form.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && event.target.type !== 'submit') {
            event.preventDefault();
            const formElements = Array.from(form.elements);
            const currentIndex = formElements.indexOf(event.target);
            const nextElement = formElements[currentIndex + 1];
            
            if (nextElement && nextElement.focus) {
                nextElement.focus();
            }
        }
    });
}

/**
 * Inicializar toggle de contraseña con mejoras de accesibilidad
 * @function initPasswordToggle
 * @param {string} inputId - ID del input de contraseña
 * @param {string} toggleId - ID del botón toggle
 */
function initPasswordToggle(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    
    if (!input || !toggle) {
        console.warn(`⚠️ No se encontraron elementos para toggle: ${inputId}, ${toggleId}`);
        return;
    }
    
    // Configurar estado inicial
    toggle.setAttribute('aria-label', 'Mostrar contraseña');
    toggle.setAttribute('aria-pressed', 'false');
    
    toggle.addEventListener('click', function(event) {
        event.preventDefault();
        
        const isPassword = input.type === 'password';
        
        // Cambiar tipo de input
        input.type = isPassword ? 'text' : 'password';
        
        // Actualizar ARIA attributes
        toggle.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
        toggle.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
        
        // Cambiar icono con transición suave
        const icon = toggle.querySelector('.password-toggle__icon');
        if (icon) {
            // Agregar clase de transición
            icon.style.opacity = '0.5';
            
            setTimeout(() => {
                if (isPassword) {
                    // Icono de ojo cerrado (contraseña visible)
                    icon.innerHTML = `
                        <path d="M17.94 17.94C16.2 19.5 13.8 20.5 12 20.5C5 20.5 1 12.5 1 12.5S2.24 9.94 4.96 7.22M9.9 4.24C10.5 4.07 11.2 4 12 4C19 4 23 12 23 12S22.18 13.94 20.95 15.6M14.12 14.12C13.8 14.6 13.3 15 12.7 15.2C12.1 15.4 11.4 15.4 10.8 15.2C10.2 15 9.7 14.6 9.4 14.1C9.1 13.6 9 13 9 12.4C9 11.8 9.1 11.2 9.4 10.7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    `;
                } else {
                    // Icono de ojo abierto (contraseña oculta)
                    icon.innerHTML = `
                        <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                    `;
                }
                icon.style.opacity = '1';
            }, 100);
        }
        
        // Mantener el foco en el input para mejor UX
        input.focus();
    });
    
    // Soporte para navegación por teclado
    toggle.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.click();
        }
    });
}

/**
 * Inicializar indicador de fortaleza de contraseña
 * @function initPasswordStrength
 */
function initPasswordStrength() {
    const passwordInput = document.getElementById('password');
    const strengthIndicator = document.getElementById('passwordStrength');
    
    if (!passwordInput || !strengthIndicator) {
        console.warn('⚠️ No se encontraron elementos para indicador de fortaleza');
        return;
    }
    
    // Usar debounce para optimizar rendimiento
    const debouncedUpdate = debounce((password) => {
        const strength = calculatePasswordStrength(password);
        updatePasswordStrengthUI(strength, strengthIndicator);
    }, AUTH_CONFIG.DEBOUNCE_DELAY);
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        debouncedUpdate(password);
        
        // Validar coincidencia de contraseñas si existe confirmación
        const confirmPassword = document.getElementById('confirmPassword');
        if (confirmPassword && confirmPassword.value) {
            validatePasswordMatch();
        }
    });
}

/**
 * Calcular fortaleza de contraseña usando algoritmo mejorado
 * @function calculatePasswordStrength
 * @param {string} password - Contraseña a evaluar
 * @returns {Object} Objeto con score, level, text y feedback
 */
function calculatePasswordStrength(password) {
    if (!password) {
        return {
            score: 0,
            level: 'weak',
            text: 'Muy débil',
            feedback: ['Ingresa una contraseña']
        };
    }
    
    const rules = AuthState.validationRules.password;
    let score = 0;
    let feedback = [];
    
    // Validaciones con puntuación
    const checks = [
        {
            condition: password.length >= rules.minLength,
            points: 25,
            message: `Mínimo ${rules.minLength} caracteres`
        },
        {
            condition: rules.hasUppercase.test(password),
            points: 20,
            message: 'Una letra mayúscula'
        },
        {
            condition: rules.hasLowercase.test(password),
            points: 20,
            message: 'Una letra minúscula'
        },
        {
            condition: rules.hasNumber.test(password),
            points: 20,
            message: 'Un número'
        },
        {
            condition: rules.hasSpecial.test(password),
            points: 15,
            message: 'Un carácter especial (!@#$%^&*)'
        }
    ];
    
    // Evaluar cada check
    checks.forEach(check => {
        if (check.condition) {
            score += check.points;
        } else {
            feedback.push(check.message);
        }
    });
    
    // Bonus por longitud extra
    if (password.length >= 12) {
        score += 10;
    }
    
    // Penalty por patrones comunes
    const commonPatterns = [
        /123456/,
        /password/i,
        /qwerty/i,
        /(.)\1{2,}/ // Caracteres repetidos
    ];
    
    commonPatterns.forEach(pattern => {
        if (pattern.test(password)) {
            score -= 10;
            feedback.push('Evita patrones comunes');
        }
    });
    
    // Asegurar que el score esté en rango válido
    score = Math.max(0, Math.min(100, score));
    
    // Determinar nivel basado en configuración
    let level = 'weak';
    let text = 'Débil';
    
    for (const [levelName, config] of Object.entries(AUTH_CONFIG.PASSWORD_STRENGTH_LEVELS)) {
        if (score >= config.min && score <= config.max) {
            level = config.class;
            text = config.text;
            break;
        }
    }
    
    return {
        score,
        level,
        text,
        feedback: feedback.slice(0, 3) // Limitar feedback para no abrumar al usuario
    };
}

/**
 * Función debounce para optimizar rendimiento
 * @function debounce
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función debounced
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
 * Inicializar validación de formularios
 */
function initFormValidation(form) {
    const inputs = form.querySelectorAll('input[required], select[required]');
    
    inputs.forEach(input => {
        // Validación en tiempo real
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => clearFieldError(input));
        
        // Validación especial para confirmación de contraseña
        if (input.id === 'confirmPassword') {
            input.addEventListener('input', validatePasswordMatch);
        }
    });
}

/**
 * Validar campo individual
 */
function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    let isValid = true;
    let errorMessage = '';
    
    // Validación de campos requeridos
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'Este campo es obligatorio';
    }
    
    // Validaciones específicas por tipo
    if (value && isValid) {
        switch (fieldName) {
            case 'email':
                if (!AuthState.validationRules.email.test(value)) {
                    isValid = false;
                    errorMessage = 'Ingresa un email válido';
                }
                break;
                
            case 'phone':
                if (!AuthState.validationRules.phone.test(value)) {
                    isValid = false;
                    errorMessage = 'Ingresa un teléfono válido (+57 300 123 4567)';
                }
                break;
                
            case 'password':
                const strength = calculatePasswordStrength(value);
                if (strength.score < 60) {
                    isValid = false;
                    errorMessage = 'La contraseña debe ser más segura';
                }
                break;
                
            case 'confirmPassword':
                const password = document.getElementById('password');
                if (password && value !== password.value) {
                    isValid = false;
                    errorMessage = 'Las contraseñas no coinciden';
                }
                break;
        }
    }
    
    // Mostrar/ocultar error
    showFieldError(field, isValid ? '' : errorMessage);
    
    return isValid;
}

/**
 * Validar coincidencia de contraseñas
 */
function validatePasswordMatch() {
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    
    if (!password || !confirmPassword) return;
    
    const isValid = password.value === confirmPassword.value;
    const errorMessage = isValid ? '' : 'Las contraseñas no coinciden';
    
    showFieldError(confirmPassword, errorMessage);
}

/**
 * Mostrar error en campo
 */
function showFieldError(field, message) {
    const errorElement = document.getElementById(`${field.name}Error`) || 
                        document.getElementById(`${field.id}Error`);
    const formGroup = field.closest('.form-group');
    
    if (errorElement) {
        errorElement.textContent = message;
    }
    
    if (formGroup) {
        formGroup.classList.toggle('form-group--error', !!message);
        formGroup.classList.toggle('form-group--success', !message && field.value.trim());
    }
}

/**
 * Limpiar error de campo
 */
function clearFieldError(field) {
    const errorElement = document.getElementById(`${field.name}Error`) || 
                        document.getElementById(`${field.id}Error`);
    const formGroup = field.closest('.form-group');
    
    if (errorElement && errorElement.textContent) {
        errorElement.textContent = '';
    }
    
    if (formGroup) {
        formGroup.classList.remove('form-group--error');
    }
}

/**
 * Manejar envío de formulario de login
 */
async function handleLogin(event) {
    event.preventDefault();
    
    if (AuthState.isLoading) return;
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Validar formulario
    if (!validateForm(form)) {
        return;
    }
    
    try {
        setLoadingState(true);
        
        // Simular llamada a API
        await simulateAPICall(2000);
        
        // En una aplicación real, aquí harías la llamada al backend
        console.log('Datos de login:', data);
        
        // Simular login exitoso
        showSuccessMessage('¡Bienvenido! Redirigiendo...');
        
        // Redirigir después de un breve delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error en login:', error);
        showErrorMessage('Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
        setLoadingState(false);
    }
}

/**
 * Manejar envío de formulario de registro
 */
async function handleRegister(event) {
    event.preventDefault();
    
    if (AuthState.isLoading) return;
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Validar formulario
    if (!validateForm(form)) {
        return;
    }
    
    // Verificar términos y condiciones
    if (!data.terms) {
        showErrorMessage('Debes aceptar los términos y condiciones');
        return;
    }
    
    try {
        setLoadingState(true);
        
        // Simular llamada a API
        await simulateAPICall(3000);
        
        // En una aplicación real, aquí harías la llamada al backend
        console.log('Datos de registro:', data);
        
        // Simular registro exitoso
        showSuccessMessage('¡Cuenta creada exitosamente! Redirigiendo al login...');
        
        // Redirigir al login después de un breve delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error en registro:', error);
        showErrorMessage('Error al crear la cuenta. Intenta nuevamente.');
    } finally {
        setLoadingState(false);
    }
}

/**
 * Validar formulario completo
 */
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

/**
 * Configurar estado de carga
 */
function setLoadingState(loading) {
    AuthState.isLoading = loading;
    
    const submitButton = document.querySelector('.auth-button--primary');
    const buttonText = submitButton?.querySelector('.button-text');
    const buttonSpinner = submitButton?.querySelector('.button-spinner');
    
    if (submitButton) {
        submitButton.disabled = loading;
    }
    
    if (buttonText) {
        buttonText.style.opacity = loading ? '0' : '1';
    }
    
    if (buttonSpinner) {
        buttonSpinner.style.display = loading ? 'flex' : 'none';
    }
}

/**
 * Inicializar botones sociales
 */
function initSocialButtons() {
    const googleButton = document.querySelector('.social-button--google');
    const microsoftButton = document.querySelector('.social-button--microsoft');
    
    if (googleButton) {
        googleButton.addEventListener('click', () => handleSocialLogin('google'));
    }
    
    if (microsoftButton) {
        microsoftButton.addEventListener('click', () => handleSocialLogin('microsoft'));
    }
}

/**
 * Manejar login social
 */
function handleSocialLogin(provider) {
    console.log(`Iniciando login con ${provider}`);
    
    // En una aplicación real, aquí integrarías con OAuth
    showInfoMessage(`Funcionalidad de ${provider} en desarrollo`);
}

/**
 * Simular llamada a API
 */
function simulateAPICall(delay = 1000) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simular éxito/error aleatorio para testing
            if (Math.random() > 0.1) { // 90% éxito
                resolve();
            } else {
                reject(new Error('Error simulado'));
            }
        }, delay);
    });
}

/**
 * Mostrar mensaje de éxito
 */
function showSuccessMessage(message) {
    showNotification(message, 'success');
}

/**
 * Mostrar mensaje de error
 */
function showErrorMessage(message) {
    showNotification(message, 'error');
}

/**
 * Mostrar mensaje informativo
 */
function showInfoMessage(message) {
    showNotification(message, 'info');
}

/**
 * Sistema de notificaciones simple
 */
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
        <div class="notification__content">
            <span class="notification__message">${message}</span>
            <button class="notification__close" aria-label="Cerrar">×</button>
        </div>
    `;
    
    // Estilos inline para la notificación
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

/**
 * Utilidades para debugging (solo en desarrollo)
 */
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.AuthDebug = {
        state: AuthState,
        validateField,
        calculatePasswordStrength,
        showNotification
    };
    
    console.log('🔧 Modo debug activado. Usa AuthDebug para testing.');
} 