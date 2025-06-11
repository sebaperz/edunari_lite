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

// ==================== AUTENTICACIÓN DE USUARIOS ====================

/**
 * Leer usuarios del archivo CSV
 */
function getUsers() {
    const usersFile = path.join(DATA_DIR, 'users.csv');
    
    if (!fs.existsSync(usersFile)) {
        // Crear archivo con usuarios por defecto
        const headers = 'email,password,nombre,apellido,numero_telefono\n';
        const defaultUsers = 'admin@edunari.com,admin123,Administrador,Sistema,+56 9 8765 4321\ntest@test.com,password123,Juan,Pérez,+56 9 5555 1234\n';
        fs.writeFileSync(usersFile, headers + defaultUsers, 'utf8');
    }
    
    return parseCSV(usersFile);
}

/**
 * Guardar usuarios al archivo CSV
 */
function saveUsers(users) {
    const usersFile = path.join(DATA_DIR, 'users.csv');
    
    let csvContent = 'email,password,nombre,apellido,numero_telefono\n';
    users.forEach(user => {
        const nombre = user.nombre || '';
        const apellido = user.apellido || '';
        const numero_telefono = user.numero_telefono || '';
        csvContent += `${user.email},${user.password},${nombre},${apellido},${numero_telefono}\n`;
    });
    
    fs.writeFileSync(usersFile, csvContent, 'utf8');
}

/**
 * Autenticar usuario
 */
app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email?.trim() || !password?.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email y contraseña son requeridos' 
            });
        }
        
        const users = getUsers();
        const user = users.find(u => 
            u.email.toLowerCase() === email.toLowerCase().trim() && 
            u.password === password.trim()
        );
        
        if (user) {
            console.log(`✅ Login exitoso: ${email}`);
            res.json({ 
                success: true, 
                message: 'Autenticación exitosa',
                user: { 
                    email: user.email,
                    nombre: user.nombre || '',
                    apellido: user.apellido || '',
                    numero_telefono: user.numero_telefono || ''
                }
            });
        } else {
            console.log(`❌ Login fallido: ${email}`);
            res.status(401).json({ 
                success: false, 
                message: 'Email o contraseña incorrectos' 
            });
        }
        
    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

/**
 * Registrar nuevo usuario
 */
app.post('/api/auth/register', (req, res) => {
    try {
        const { email, password, nombre, apellido, numero_telefono } = req.body;
        
        if (!email?.trim() || !password?.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email y contraseña son requeridos' 
            });
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({ 
                success: false, 
                message: 'Formato de email inválido' 
            });
        }
        
        // Validar longitud de contraseña
        if (password.trim().length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'La contraseña debe tener al menos 6 caracteres' 
            });
        }
        
        const users = getUsers();
        
        // Verificar si el usuario ya existe
        const existingUser = users.find(u => 
            u.email.toLowerCase() === email.toLowerCase().trim()
        );
        
        if (existingUser) {
            return res.status(409).json({ 
                success: false, 
                message: 'Ya existe una cuenta con este email' 
            });
        }
        
        // Agregar nuevo usuario
        users.push({ 
            email: email.toLowerCase().trim(), 
            password: password.trim(),
            nombre: nombre?.trim() || '',
            apellido: apellido?.trim() || '',
            numero_telefono: numero_telefono?.trim() || ''
        });
        
        // Guardar usuarios
        saveUsers(users);
        
        console.log(`👤 Usuario registrado: ${email}`);
        
        res.status(201).json({ 
            success: true, 
            message: 'Usuario registrado exitosamente',
            user: { email: email.toLowerCase().trim() }
        });
        
    } catch (error) {
        console.error('❌ Error en registro:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

/**
 * Verificar si un usuario existe
 */
app.get('/api/auth/check-user', (req, res) => {
    try {
        const { email } = req.query;
        
        if (!email?.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email es requerido' 
            });
        }
        
        const users = getUsers();
        const userExists = users.some(u => 
            u.email.toLowerCase() === email.toLowerCase().trim()
        );
        
        res.json({ 
            success: true, 
            exists: userExists 
        });
        
    } catch (error) {
        console.error('❌ Error verificando usuario:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

/**
 * Obtener información del perfil de usuario
 */
app.get('/api/auth/profile', (req, res) => {
    try {
        const { email } = req.query;
        
        if (!email?.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email es requerido' 
            });
        }
        
        const users = getUsers();
        const user = users.find(u => 
            u.email.toLowerCase() === email.toLowerCase().trim()
        );
        
        if (user) {
            res.json({ 
                success: true, 
                user: {
                    email: user.email,
                    nombre: user.nombre || '',
                    apellido: user.apellido || '',
                    numero_telefono: user.numero_telefono || ''
                }
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }
        
    } catch (error) {
        console.error('❌ Error obteniendo perfil:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
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
    console.log(`   POST /api/auth/login`);
    console.log(`   POST /api/auth/register`);
    console.log(`   GET  /api/auth/check-user?email=email`);
    console.log(`   GET  /api/auth/profile?email=email`);
    console.log(`   POST /api/pioneers`);
    console.log(`   GET  /api/pioneers`);
    console.log('');
    
    // Cargar datos al inicio
    loadData();
});

module.exports = app; 