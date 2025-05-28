const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Cache de datos
let cache = {
    data: { products: [], services: [], businesses: [] },
    lastLoaded: null
};

/**
 * Asegurar que existe el directorio data
 */
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

/**
 * Parser de línea CSV que maneja comillas según RFC 4180
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

/**
 * Parser de archivos CSV
 */
function parseCSV(filePath) {
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Archivo no encontrado: ${filePath}`);
        return [];
    }

    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.trim().split('\n');
        
        if (lines.length < 2) return [];
        
        const headers = lines[0].split(',').map(h => h.trim());
        
        return lines.slice(1).map(line => {
            const values = parseCSVLine(line);
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] || '';
            });
            return obj;
        }).filter(obj => Object.values(obj).some(val => val.trim())); // Filtrar filas vacías
        
    } catch (error) {
        console.error(`❌ Error parseando ${filePath}:`, error);
        return [];
    }
}

/**
 * Cargar datos CSV con cache inteligente
 */
function loadData() {
    const now = Date.now();
    
    // Retornar cache si es válido
    if (cache.lastLoaded && (now - cache.lastLoaded) < CACHE_DURATION) {
        return cache.data;
    }

    try {
        const files = {
            products: path.join(DATA_DIR, 'productos.csv'),
            services: path.join(DATA_DIR, 'servicios.csv'),
            businesses: path.join(DATA_DIR, 'emprendimientos.csv')
        };

        cache.data = {
            products: parseCSV(files.products),
            services: parseCSV(files.services),
            businesses: parseCSV(files.businesses)
        };
        
        cache.lastLoaded = now;
        
        const { products, services, businesses } = cache.data;
        console.log(`📊 Datos cargados: ${products.length} productos, ${services.length} servicios, ${businesses.length} emprendimientos`);
        
        return cache.data;
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        return cache.data;
    }
}

/**
 * Crear índice de emprendimientos para búsquedas O(1)
 */
function createBusinessIndex(businesses) {
    const index = {};
    businesses.forEach(business => {
        index[business.id] = business;
    });
    return index;
}

/**
 * Verificar si un item coincide con la consulta de búsqueda
 */
function matchesQuery(item, query) {
    const searchableFields = [
        item.nombre,
        item.descripcion,
        item.categoria,
        item.tags
    ].filter(Boolean).map(field => field.toLowerCase());
    
    return searchableFields.some(field => field.includes(query));
}

/**
 * Enriquecer items con datos del emprendimiento
 */
function enrichItems(items, businessIndex, type) {
    return items.map(item => ({
        ...item,
        type,
        business: businessIndex[item.emprendimiento_id] || {}
    }));
}

/**
 * Buscar en todos los datos
 */
function searchData(query, limit = 50) {
    const data = loadData();
    const normalizedQuery = query.toLowerCase().trim();
    const businessIndex = createBusinessIndex(data.businesses);
    
    const results = [];
    
    // Buscar en productos
    data.products.forEach(product => {
        if (matchesQuery(product, normalizedQuery)) {
            results.push({
                ...product,
                type: 'producto',
                business: businessIndex[product.emprendimiento_id] || {}
            });
        }
    });
    
    // Buscar en servicios
    data.services.forEach(service => {
        if (matchesQuery(service, normalizedQuery)) {
            results.push({
                ...service,
                type: 'servicio',
                business: businessIndex[service.emprendimiento_id] || {}
            });
        }
    });
    
    return results.slice(0, limit);
}

// ==================== ENDPOINTS API ====================

/**
 * Estadísticas del sistema
 */
app.get('/api/status', (req, res) => {
    try {
        const data = loadData();
        
        res.json({
            total_products: data.products.length,
            total_services: data.services.length,
            total_businesses: data.businesses.length,
            available_products: data.products.filter(p => p.disponible === 'true').length,
            available_services: data.services.filter(s => s.disponible === 'true').length,
            last_updated: cache.lastLoaded ? new Date(cache.lastLoaded).toISOString() : null
        });
    } catch (error) {
        console.error('❌ Error en /api/status:', error);
        res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }
});

/**
 * Búsqueda general
 */
app.get('/api/search', (req, res) => {
    try {
        const query = req.query.q?.trim();
        
        if (!query) {
            return res.json([]);
        }
        
        const results = searchData(query);
        console.log(`🔍 Búsqueda: "${query}" - ${results.length} resultados`);
        
        res.json(results);
    } catch (error) {
        console.error('❌ Error en /api/search:', error);
        res.status(500).json({ error: 'Error en búsqueda' });
    }
});

/**
 * Lista de emprendimientos
 */
app.get('/api/entrepreneurs', (req, res) => {
    try {
        const data = loadData();
        res.json(data.businesses);
    } catch (error) {
        console.error('❌ Error en /api/entrepreneurs:', error);
        res.status(500).json({ error: 'Error obteniendo emprendimientos' });
    }
});

/**
 * Productos con filtro opcional por categoría
 */
app.get('/api/products', (req, res) => {
    try {
        const data = loadData();
        const category = req.query.category?.trim();
        const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Máximo 100
        
        let products = data.products;
        if (category) {
            products = products.filter(p => p.categoria === category);
        }
        
        const businessIndex = createBusinessIndex(data.businesses);
        const enrichedProducts = enrichItems(products.slice(0, limit), businessIndex, 'producto');
        
        res.json(enrichedProducts);
    } catch (error) {
        console.error('❌ Error en /api/products:', error);
        res.status(500).json({ error: 'Error obteniendo productos' });
    }
});

/**
 * Servicios con filtro opcional por categoría
 */
app.get('/api/services', (req, res) => {
    try {
        const data = loadData();
        const category = req.query.category?.trim();
        const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Máximo 100
        
        let services = data.services;
        if (category) {
            services = services.filter(s => s.categoria === category);
        }
        
        const businessIndex = createBusinessIndex(data.businesses);
        const enrichedServices = enrichItems(services.slice(0, limit), businessIndex, 'servicio');
        
        res.json(enrichedServices);
    } catch (error) {
        console.error('❌ Error en /api/services:', error);
        res.status(500).json({ error: 'Error obteniendo servicios' });
    }
});

// ==================== PIONEROS ====================

/**
 * Registrar pionero
 */
app.post('/api/pioneers', (req, res) => {
    try {
        const { name, email, phone } = req.body;
        
        if (!name?.trim() || !email?.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nombre y email son requeridos' 
            });
        }
        
        ensureDataDir();
        
        const pioneersFile = path.join(DATA_DIR, 'pioneers.csv');
        const timestamp = new Date().toISOString();
        
        // Verificar si el archivo existe y tiene el formato correcto
        if (!fs.existsSync(pioneersFile)) {
            // Crear archivo con headers en el formato original
            const headers = 'Fecha y Hora,Nombre Completo,Correo Electrónico,Teléfono,Términos Aceptados\n';
            fs.writeFileSync(pioneersFile, headers, 'utf8');
        }
        
        // Formatear línea CSV con el formato original
        const csvLine = `${timestamp},"${name}",${email},${phone || ''},Sí\n`;
        
        fs.appendFileSync(pioneersFile, csvLine, 'utf8');
        
        console.log(`👤 Nuevo pionero: ${name} - ${email}`);
        
        res.json({ 
            success: true, 
            message: 'Pionero registrado exitosamente' 
        });
        
    } catch (error) {
        console.error('❌ Error guardando pionero:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

/**
 * Obtener pioneros registrados
 */
app.get('/api/pioneers', (req, res) => {
    try {
        const pioneersFile = path.join(DATA_DIR, 'pioneers.csv');
        
        if (!fs.existsSync(pioneersFile)) {
            return res.json([]);
        }
        
        const pioneers = parseCSV(pioneersFile);
        res.json(pioneers);
        
    } catch (error) {
        console.error('❌ Error obteniendo pioneros:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error obteniendo datos' 
        });
    }
});

// ==================== INICIALIZACIÓN ====================

// Inicializar directorio de datos
ensureDataDir();

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor Edunari corriendo en http://localhost:${PORT}`);
    console.log(`📁 Directorio de datos: ${path.resolve(DATA_DIR)}`);
    console.log('');
    console.log('📡 Endpoints disponibles:');
    console.log(`   GET  /api/status`);
    console.log(`   GET  /api/search?q=termino`);
    console.log(`   GET  /api/entrepreneurs`);
    console.log(`   GET  /api/products?category=categoria&limit=50`);
    console.log(`   GET  /api/services?category=categoria&limit=50`);
    console.log(`   POST /api/pioneers`);
    console.log(`   GET  /api/pioneers`);
    console.log('');
    
    // Cargar datos al inicio
    loadData();
});

module.exports = app; 