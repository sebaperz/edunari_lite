/**
 * Pioneer Registration Form Handler
 * Handles form validation, submission, and CSV data storage
 * Following modern JavaScript best practices
 */

class PioneerRegistration {
    constructor() {
        this.form = document.getElementById('pioneerForm');
        this.submitButton = document.getElementById('registerButton');
        this.successMessage = document.getElementById('successMessage');
        
        this.init();
    }

    /**
     * Initialize the form handler
     */
    init() {
        if (!this.form) {
            console.error('Pioneer registration form not found');
            return;
        }

        this.bindEvents();
        this.setupValidation();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Form submission
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        
        // Real-time validation
        const inputs = this.form.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    /**
     * Setup form validation rules
     */
    setupValidation() {
        this.validationRules = {
            fullName: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
                message: 'El nombre debe contener solo letras y espacios'
            },
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Ingresa un correo electrónico válido'
            },
            phone: {
                required: true
            },
            terms: {
                required: true,
                message: 'Debes aceptar los términos y condiciones'
            }
        };
    }

    /**
     * Handle form submission
     * @param {Event} event - Form submit event
     */
    async handleSubmit(event) {
        event.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        this.setLoadingState(true);

        try {
            const formData = this.getFormData();
            await this.saveToCSV(formData);
            this.showSuccess();
            this.resetForm();
        } catch (error) {
            console.error('❌ Error procesando registro:', error);
            
            // Mostrar mensaje de error más específico
            let errorMessage = 'Hubo un error al procesar tu registro.';
            
            if (error.message.includes('servidor')) {
                errorMessage = 'No se pudo conectar con el servidor. Los datos se guardaron localmente y serán procesados más tarde.';
            } else if (error.message.includes('email')) {
                errorMessage = 'Por favor verifica que el correo electrónico sea válido.';
            } else if (error.message.includes('requeridos')) {
                errorMessage = 'Por favor completa todos los campos obligatorios.';
            }
            
            this.showError(errorMessage + ' Por favor, inténtalo de nuevo.');
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Validate the entire form
     * @returns {boolean} - True if form is valid
     */
    validateForm() {
        let isValid = true;
        const inputs = this.form.querySelectorAll('input[required]');
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    /**
     * Validate a single field
     * @param {HTMLInputElement} field - Field to validate
     * @returns {boolean} - True if field is valid
     */
    validateField(field) {
        const fieldName = field.name;
        const value = field.value.trim();
        const rules = this.validationRules[fieldName];
        
        if (!rules) return true;

        // Clear previous errors
        this.clearFieldError(field);

        // Required validation
        if (rules.required && !value) {
            this.showFieldError(field, 'Este campo es obligatorio');
            return false;
        }

        // Checkbox validation (for terms)
        if (field.type === 'checkbox' && rules.required && !field.checked) {
            this.showFieldError(field, rules.message);
            return false;
        }

        // Skip other validations if field is empty and not required
        if (!value && !rules.required) return true;

        // Minimum length validation
        if (rules.minLength && value.length < rules.minLength) {
            this.showFieldError(field, `Debe tener al menos ${rules.minLength} caracteres`);
            return false;
        }

        // Pattern validation
        if (rules.pattern && !rules.pattern.test(value)) {
            this.showFieldError(field, rules.message);
            return false;
        }

        // Email specific validation
        if (fieldName === 'email' && value) {
            if (!this.isValidEmail(value)) {
                this.showFieldError(field, 'Ingresa un correo electrónico válido');
                return false;
            }
        }

        return true;
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} - True if email is valid
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Show field error
     * @param {HTMLInputElement} field - Field with error
     * @param {string} message - Error message
     */
    showFieldError(field, message) {
        const errorElement = document.getElementById(field.name + 'Error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        field.classList.add('form-input--error');
        field.setAttribute('aria-invalid', 'true');
    }

    /**
     * Clear field error
     * @param {HTMLInputElement} field - Field to clear error from
     */
    clearFieldError(field) {
        const errorElement = document.getElementById(field.name + 'Error');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        
        field.classList.remove('form-input--error');
        field.removeAttribute('aria-invalid');
    }

    /**
     * Get form data as object
     * @returns {Object} - Form data
     */
    getFormData() {
        const formData = new FormData(this.form);
        const data = {
            timestamp: new Date().toISOString(),
            fullName: formData.get('fullName').trim(),
            email: formData.get('email').trim().toLowerCase(),
            phone: formData.get('phone').trim(),
            terms: formData.get('terms') === 'on'
        };
        
        return data;
    }

    /**
     * Save data to CSV file via server
     * @param {Object} data - Data to save
     */
    async saveToCSV(data) {
        try {
            const response = await fetch('/api/pioneers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: data.fullName,
                    email: data.email,
                    phone: data.phone
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al guardar los datos');
            }

            console.log('✅ Datos guardados exitosamente en el servidor:', result);
            
            // También guardar en localStorage para backup
            this.saveToLocalStorage(data);
            
        } catch (error) {
            console.error('❌ Error al enviar datos al servidor:', error);
            
            // Fallback: guardar solo en localStorage si el servidor falla
            this.saveToLocalStorage(data);
            
            // Re-lanzar el error para que sea manejado por handleSubmit
            throw new Error('No se pudo conectar con el servidor. Los datos se guardaron localmente.');
        }
    }

    /**
     * Format data for CSV (ya no se usa para descarga, pero se mantiene para compatibilidad)
     * @param {Object} data - Data to format
     * @returns {string} - CSV formatted string
     */
    formatDataForCSV(data) {
        const headers = ['Fecha y Hora', 'Nombre Completo', 'Correo Electrónico', 'Teléfono', 'Términos Aceptados'];
        const values = [
            data.timestamp,
            `"${data.fullName}"`,
            data.email,
            data.phone,
            data.terms ? 'Sí' : 'No'
        ];
        
        return headers.join(',') + '\n' + values.join(',');
    }

    /**
     * Download CSV file (función obsoleta, mantenida para compatibilidad)
     * @param {string} csvContent - CSV content
     * @param {Object} data - Original data
     */
    async downloadCSV(csvContent, data) {
        // Esta función ya no se usa, pero se mantiene para evitar errores
        console.log('downloadCSV: Esta función ya no se utiliza. Los datos se envían al servidor.');
    }

    /**
     * Get existing CSV data from localStorage (función obsoleta)
     * @returns {string} - Existing CSV data
     */
    getExistingCSVData() {
        return localStorage.getItem('pioneers_csv') || '';
    }

    /**
     * Save data to localStorage for persistence and backup
     * @param {Object} data - Data to save
     */
    saveToLocalStorage(data) {
        const existingData = JSON.parse(localStorage.getItem('pioneers_data') || '[]');
        existingData.push(data);
        localStorage.setItem('pioneers_data', JSON.stringify(existingData));
        
        console.log('Datos guardados en localStorage como backup');
    }

    /**
     * Set loading state
     * @param {boolean} isLoading - Loading state
     */
    setLoadingState(isLoading) {
        const buttonText = this.submitButton.querySelector('.button-text');
        const buttonSpinner = this.submitButton.querySelector('.button-spinner');
        
        if (isLoading) {
            this.submitButton.disabled = true;
            buttonText.style.display = 'none';
            buttonSpinner.style.display = 'flex';
            this.submitButton.classList.add('loading');
        } else {
            this.submitButton.disabled = false;
            buttonText.style.display = 'block';
            buttonSpinner.style.display = 'none';
            this.submitButton.classList.remove('loading');
        }
    }

    /**
     * Show success message
     */
    showSuccess() {
        this.form.style.display = 'none';
        this.successMessage.style.display = 'block';
        
        // Scroll to success message
        this.successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Auto-hide after 5 seconds and show form again
        setTimeout(() => {
            this.successMessage.style.display = 'none';
            this.form.style.display = 'block';
        }, 5000);
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // Create or update error message element
        let errorDiv = document.getElementById('formError');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'formError';
            errorDiv.className = 'form-error-general';
            this.form.insertBefore(errorDiv, this.form.firstChild);
        }
        
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    /**
     * Reset form to initial state
     */
    resetForm() {
        this.form.reset();
        
        // Clear all error messages
        const errorElements = this.form.querySelectorAll('.form-error');
        errorElements.forEach(element => {
            element.textContent = '';
            element.style.display = 'none';
        });
        
        // Remove error classes
        const inputs = this.form.querySelectorAll('.form-input--error');
        inputs.forEach(input => {
            input.classList.remove('form-input--error');
            input.removeAttribute('aria-invalid');
        });
    }

    /**
     * Export all pioneer data to CSV file
     * This function can be called to download all stored pioneer data
     */
    exportAllPioneersToCSV() {
        const allData = JSON.parse(localStorage.getItem('pioneers_data') || '[]');
        
        if (allData.length === 0) {
            console.log('No hay datos de pioneros para exportar');
            return;
        }

        // Create CSV content with all data
        const headers = ['Fecha y Hora', 'Nombre Completo', 'Correo Electrónico', 'Teléfono', 'Términos Aceptados'];
        let csvContent = headers.join(',') + '\n';
        
        allData.forEach(data => {
            const values = [
                data.timestamp,
                `"${data.fullName}"`,
                data.email,
                data.phone,
                data.terms ? 'Sí' : 'No'
            ];
            csvContent += values.join(',') + '\n';
        });

        // Download the complete CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'pioneers.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PioneerRegistration();
});

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PioneerRegistration;
} 