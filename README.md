# 🎓 Edunari Lite - Plataforma de Emprendimiento Universitario

Una plataforma web moderna para conectar emprendedores universitarios con su comunidad, facilitando la búsqueda y descubrimiento de productos y servicios estudiantiles.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación](#-instalación)
- [Mejores Prácticas Implementadas](#-mejores-prácticas-implementadas)
- [Funcionalidades](#-funcionalidades)
- [Accesibilidad](#-accesibilidad)
- [Rendimiento](#-rendimiento)
- [Seguridad](#-seguridad)
- [Contribución](#-contribución)
- [Referencias Oficiales](#-referencias-oficiales)

## ✨ Características

- **🔍 Búsqueda Inteligente**: Sistema de búsqueda semántica con algoritmo de relevancia
- **🎯 Filtrado Avanzado**: Filtros por categoría de productos y servicios
- **📊 Ordenamiento Dinámico**: Ordenamiento por precio (ascendente/descendente)
- **🔐 Autenticación Segura**: Sistema de login y registro con validación robusta
- **♿ Accesibilidad**: Cumple con estándares WCAG 2.1
- **📱 Responsive**: Diseño adaptativo para todos los dispositivos
- **🌙 Modo Oscuro**: Soporte automático para preferencias del usuario
- **⚡ Rendimiento**: Optimizado con técnicas modernas de JavaScript

## 🛠 Tecnologías

### Frontend
- **HTML5**: Semántico y accesible
- **CSS3**: Variables CSS, Grid, Flexbox, Media Queries
- **JavaScript ES6+**: Módulos, async/await, destructuring
- **Web APIs**: Fetch, URLSearchParams, IntersectionObserver

### Estándares y Metodologías
- **BEM**: Metodología CSS para nomenclatura consistente
- **WCAG 2.1**: Estándares de accesibilidad web
- **Progressive Enhancement**: Mejora progresiva de funcionalidades
- **Mobile First**: Diseño responsive desde dispositivos móviles

## 📁 Estructura del Proyecto

```
edunari_lite/
├── 📄 index.html              # Página principal
├── 📄 search-results.html     # Página de resultados de búsqueda
├── 📄 login.html             # Página de inicio de sesión
├── 📄 register.html          # Página de registro
├── 📄 about.html             # Página informativa
├── 📁 css/
│   ├── 🎨 styles.css         # Estilos globales y componentes base
│   ├── 🎨 search-results.css # Estilos específicos de búsqueda
│   ├── 🎨 auth.css          # Estilos de autenticación
│   └── 🎨 about.css         # Estilos de página informativa
├── 📁 js/
│   ├── ⚡ main.js            # Funcionalidades principales
│   ├── ⚡ search-results.js  # Lógica de búsqueda y filtrado
│   └── ⚡ auth.js           # Validación y autenticación
├── 📁 data/
│   ├── 📊 productos.csv      # Base de datos de productos
│   ├── 📊 servicios.csv      # Base de datos de servicios
│   └── 📊 emprendimientos.csv # Base de datos de emprendimientos
└── 📄 README.md             # Documentación del proyecto
```

## 🚀 Instalación

### Requisitos Previos
- Navegador web moderno (Chrome 90+, Firefox 88+, Safari 14+)
- Servidor web local (opcional para desarrollo)

### Instalación Local

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/edunari_lite.git
   cd edunari_lite
   ```

2. **Servir archivos localmente** (recomendado)
   ```bash
   # Usando Python 3
   python -m http.server 8000
   
   # Usando Node.js (npx)
   npx serve .
   
   # Usando PHP
   php -S localhost:8000
   ```

3. **Abrir en navegador**
   ```
   http://localhost:8000
   ```

## 🏆 Mejores Prácticas Implementadas

### JavaScript Moderno

#### 1. **Gestión de Estado Inmutable**
```javascript
// ✅ Uso de Object.seal() para control de mutabilidad
const SearchState = Object.seal({
    products: [],
    // Métodos controlados para actualizar estado
    updateQuery(query) {
        this.currentQuery = query;
    }
});
```

#### 2. **Manejo de Errores Robusto**
```javascript
// ✅ Try-catch con logging detallado
try {
    await loadData();
} catch (error) {
    console.error('❌ Error al cargar datos:', error);
    throw new Error(`Error de inicialización: ${error.message}`);
}
```

#### 3. **Programación Asíncrona Optimizada**
```javascript
// ✅ Promise.all para carga paralela
const responses = await Promise.all([
    fetch(CONFIG.CSV_FILES.PRODUCTS),
    fetch(CONFIG.CSV_FILES.SERVICES),
    fetch(CONFIG.CSV_FILES.BUSINESSES)
]);
```

#### 4. **Documentación JSDoc Completa**
```javascript
/**
 * Calcular puntuación de relevancia para ordenar resultados
 * @function calculateRelevanceScore
 * @param {Object} item - Item a evaluar
 * @param {string} query - Consulta de búsqueda
 * @returns {number} Puntuación de relevancia (0-100)
 */
```

### CSS Moderno

#### 1. **Variables CSS para Consistencia**
```css
:root {
    --color-primary: #0D9488;
    --spacing-4: 1rem;
    --transition-fast: 0.2s ease;
}
```

#### 2. **Diseño Responsive con Grid y Flexbox**
```css
.products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--spacing-6);
}
```

#### 3. **Accesibilidad y Preferencias del Usuario**
```css
/* Respeto por preferencias de movimiento reducido */
@media (prefers-reduced-motion: reduce) {
    .sort-button {
        transition: none;
    }
}

/* Soporte para modo oscuro */
@media (prefers-color-scheme: dark) {
    .sort-button {
        background-color: var(--color-gray-800);
    }
}
```

## 🔧 Funcionalidades

### Sistema de Búsqueda

#### Algoritmo de Relevancia
- **Búsqueda semántica** con puntuación TF-IDF simplificada
- **Coincidencias exactas** en tags tienen mayor peso
- **Posición de términos** afecta la relevancia
- **Disponibilidad** priorizada en resultados

#### Filtros Dinámicos
- **Categorías de productos**: Filtrado específico por tipo
- **Categorías de servicios**: Separación clara de ofertas
- **Ordenamiento por precio**: Tres estados (sin orden, ascendente, descendente)

### Sistema de Autenticación

#### Validación de Formularios
```javascript
// Validación en tiempo real con debounce
const debouncedUpdate = debounce((password) => {
    const strength = calculatePasswordStrength(password);
    updatePasswordStrengthUI(strength, strengthIndicator);
}, AUTH_CONFIG.DEBOUNCE_DELAY);
```

#### Indicador de Fortaleza de Contraseña
- **Algoritmo robusto** con múltiples criterios
- **Feedback visual** en tiempo real
- **Penalización** por patrones comunes
- **Bonus** por longitud y complejidad

## ♿ Accesibilidad

### Estándares WCAG 2.1 Implementados

#### 1. **Navegación por Teclado**
```javascript
// Soporte completo para navegación con Tab
toggle.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.click();
    }
});
```

#### 2. **ARIA Labels y Roles**
```html
<!-- Estados dinámicos para lectores de pantalla -->
<button aria-pressed="false" aria-label="Mostrar contraseña">
```

#### 3. **Contraste y Legibilidad**
- Ratios de contraste superiores a 4.5:1
- Tamaños de fuente escalables
- Indicadores visuales claros

#### 4. **Dispositivos Táctiles**
```css
/* Tamaños mínimos para touch */
@media (hover: none) and (pointer: coarse) {
    .sort-button {
        min-height: 44px;
    }
}
```

## ⚡ Rendimiento

### Optimizaciones Implementadas

#### 1. **Debouncing para Búsquedas**
```javascript
// Evita múltiples llamadas durante escritura rápida
const debouncedSearch = debounce(performSearch, 300);
```

#### 2. **Carga Paralela de Datos**
```javascript
// Carga simultánea de archivos CSV
const responses = await Promise.all(fetchPromises);
```

#### 3. **Estructuras de Datos Eficientes**
```javascript
// Map para búsquedas O(1)
const businessIndex = new Map();
SearchState.businesses.forEach(business => {
    businessIndex.set(business.id, business);
});
```

#### 4. **Lazy Loading y Paginación**
- Carga de resultados por páginas
- Renderizado eficiente de elementos DOM
- Scroll virtual para listas grandes

## 🔒 Seguridad

### Medidas de Seguridad Implementadas

#### 1. **Sanitización de Entrada**
```javascript
// Escape de HTML para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

#### 2. **Validación Robusta**
```javascript
// Validación tanto en cliente como preparación para servidor
const validationRules = Object.freeze({
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^(\+?57)?[\s-]?[3][0-9]{9}$/
});
```

#### 3. **Límites de Entrada**
```javascript
password: Object.freeze({
    minLength: 8,
    maxLength: 128, // Previene ataques DoS
})
```

## 🤝 Contribución

### Guías de Desarrollo

#### 1. **Estilo de Código**
- Usar **ESLint** y **Prettier** para consistencia
- Seguir convenciones de **nomenclatura BEM** en CSS
- Documentar funciones con **JSDoc**

#### 2. **Commits Semánticos**
```bash
feat: agregar nueva funcionalidad de filtros
fix: corregir bug en validación de email
docs: actualizar documentación de API
style: mejorar estilos de botones
refactor: optimizar algoritmo de búsqueda
```

#### 3. **Testing**
```javascript
// Ejemplo de test unitario
describe('calculatePasswordStrength', () => {
    it('should return weak for short passwords', () => {
        const result = calculatePasswordStrength('123');
        expect(result.level).toBe('weak');
    });
});
```

## 📚 Referencias Oficiales

### Documentación Consultada

#### JavaScript
- [MDN Web APIs](https://developer.mozilla.org/en-US/docs/Web/API) - APIs web estándar
- [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide) - Guía completa de JavaScript
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) - API para peticiones HTTP

#### CSS
- [MDN CSS Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference) - Referencia completa de CSS
- [CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout) - Sistema de layout Grid
- [CSS Flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout) - Layout flexible

#### Accesibilidad
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) - Estándares de accesibilidad
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) - Mejores prácticas ARIA
- [WebAIM](https://webaim.org/) - Recursos de accesibilidad web

#### Seguridad
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Vulnerabilidades web más comunes
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security) - Seguridad web

#### Rendimiento
- [Web.dev Performance](https://web.dev/performance/) - Optimización de rendimiento
- [Core Web Vitals](https://web.dev/vitals/) - Métricas de experiencia de usuario

### Estándares Seguidos

- **RFC 4180**: Formato CSV estándar
- **HTML5 Specification**: Semántica y estructura
- **ES2020+**: Características modernas de JavaScript
- **CSS3 Specification**: Propiedades y selectores modernos

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Equipo

- **Desarrollador Principal**: [Tu Nombre]
- **Diseño UX/UI**: [Nombre del Diseñador]
- **Testing**: [Nombre del Tester]

---

**¿Tienes preguntas?** Abre un [issue](https://github.com/tu-usuario/edunari_lite/issues) o contacta al equipo de desarrollo.

**¿Quieres contribuir?** Lee nuestra [guía de contribución](CONTRIBUTING.md) y envía un pull request. 