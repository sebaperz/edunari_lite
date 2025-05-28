# 🔍 Búsqueda Inteligente por Tags - Edunari

## Descripción General

Se ha implementado un sistema de búsqueda inteligente que permite buscar productos y servicios no solo por nombres y descripciones, sino también por **tags** (etiquetas/características) específicas.

## ✨ Funcionalidades Implementadas

### 1. Búsqueda Multifacética
- **Nombres**: Busca en nombres de productos y servicios
- **Descripciones**: Busca en descripciones detalladas
- **Tags**: Busca en características específicas (ej: "artesanal", "natural", "gaming")
- **Emprendimientos**: Busca en nombres de los emprendimientos

### 2. Búsqueda Inteligente
- **Múltiples términos**: Soporta búsquedas como "chocolate artesanal"
- **Coincidencias parciales**: Encuentra "program" en "programación"
- **Coincidencias exactas**: Prioriza matches exactos en tags
- **Insensible a mayúsculas**: "CHOCOLATE" = "chocolate"

### 3. Sistema de Relevancia
Los resultados se ordenan por:
1. **Disponibilidad** (productos disponibles primero)
2. **Puntuación de relevancia** basada en:
   - Coincidencias exactas en tags: +15 puntos
   - Coincidencias en nombres: +10-20 puntos
   - Coincidencias en tags parciales: +8 puntos
   - Coincidencias en descripciones: +5 puntos
   - Coincidencias en emprendimientos: +3 puntos
3. **Precio** (como criterio final)

### 4. Interfaz Mejorada
- **Resaltado de términos**: Los términos buscados aparecen destacados
- **Tags destacados**: Los tags que coinciden se muestran con color especial
- **Información de relevancia**: Muestra puntuación de relevancia (opcional)
- **Badges informativos**: Indica servicios y productos no disponibles
- **Descripciones**: Muestra descripciones truncadas de productos

## 🏷️ Ejemplos de Tags Disponibles

### Productos
- **Alimentos**: `chocolate`, `artesanal`, `natural`, `orgánico`, `casero`
- **Tecnología**: `gaming`, `RGB`, `HD`, `inteligente`, `automático`
- **Moda**: `cuero`, `elegante`, `casual`, `deportivo`, `vintage`
- **Hogar**: `ecológico`, `sostenible`, `decorativo`, `funcional`
- **Mascotas**: `interactivo`, `ortopédico`, `premium`, `seguro`

### Servicios
- **Diseño**: `gráfico`, `UX/UI`, `branding`, `creativo`, `digital`
- **Tecnología**: `programación`, `frontend`, `backend`, `móvil`, `web`
- **Marketing**: `digital`, `social media`, `analytics`, `email`
- **Educación**: `online`, `especializado`, `académico`, `profesional`
- **Salud**: `bienestar`, `terapia`, `nutrición`, `fitness`

## 🔧 Implementación Técnica

### Algoritmo de Búsqueda
```javascript
// Función principal de coincidencia
function matchesSearchQuery(item, query) {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const itemTags = item.tags.split(',').map(tag => tag.trim());
    
    return queryTerms.every(term => {
        // Búsqueda en campos principales
        const matchesFields = /* búsqueda en nombre, descripción, etc. */;
        
        // Búsqueda exacta en tags
        const matchesExactTag = itemTags.some(tag => tag === term);
        
        // Búsqueda parcial en tags
        const matchesPartialTag = itemTags.some(tag => tag.includes(term));
        
        return matchesFields || matchesExactTag || matchesPartialTag;
    });
}
```

### Sistema de Puntuación
```javascript
function calculateRelevanceScore(item, query) {
    let score = 0;
    
    // Pesos por campo
    const weights = {
        nombre: 10,
        tags: 8,
        descripcion: 5,
        emprendimiento: 3
    };
    
    // Bonificaciones especiales
    if (exactTagMatch) score += 15;
    if (nameStartsWith) score += 20;
    
    return score;
}
```

## 📊 Datos de Prueba

El sistema incluye:
- **150 emprendimientos** con información completa
- **336 productos** con tags detallados
- **378 servicios** con características específicas
- **Total: 714 items** con tags para búsqueda

## 🚀 Cómo Usar

### Búsquedas Simples
- `chocolate` → Encuentra productos con chocolate
- `diseño` → Encuentra servicios de diseño
- `natural` → Encuentra productos naturales/orgánicos

### Búsquedas Múltiples
- `chocolate artesanal` → Productos que sean chocolate Y artesanales
- `diseño gráfico` → Servicios de diseño gráfico específicamente
- `ropa deportiva` → Ropa para deportes

### Búsquedas por Emprendimiento
- `María` → Productos/servicios de emprendimientos con "María"
- `Tech Solutions` → Items del emprendimiento "Tech Solutions"

## 🎯 Beneficios para Estudiantes

1. **Aprendizaje de Algoritmos**: Implementación de búsqueda fuzzy y scoring
2. **Buenas Prácticas**: Código modular, documentado y escalable
3. **UX/UI**: Interfaz intuitiva con feedback visual
4. **Optimización**: Búsqueda eficiente con debouncing
5. **Accesibilidad**: Soporte para teclado y lectores de pantalla

## 🔗 Archivos Modificados

- `js/search-results.js` - Lógica de búsqueda mejorada
- `css/search-results.css` - Estilos para resaltado y tags
- `search-results.html` - Interfaz con información de búsqueda
- `test-search-tags.html` - Página de pruebas interactiva

## 📚 Referencias

- [MDN - String.prototype.includes()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes)
- [MDN - Array.prototype.every()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every)
- [MDN - Regular Expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions)
- [CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)

---

**Desarrollado con buenas prácticas de programación para estudiantes** 🎓 