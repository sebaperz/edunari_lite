# 🎓 Edunari - Plataforma de Emprendimientos Estudiantiles

**Edunari** es una plataforma web que conecta a estudiantes emprendedores de la Universidad Simón Bolívar con potenciales compradores, promoviendo el ecosistema emprendedor universitario.

## 🚀 Características Principales

- **Búsqueda Inteligente**: Sistema de búsqueda con relevancia y múltiples criterios
- **Base de Datos CSV + Pandas**: Fácil de mantener y escalable
- **Interfaz Moderna**: Diseño responsivo con CSS Grid y Flexbox
- **API RESTful**: Endpoints para integración y desarrollo
- **46 Emprendimientos**: Cubriendo 23 categorías diferentes
- **138 Items**: 72 productos + 66 servicios

## 🗂️ Estructura del Proyecto

```
edunari2/
├── data/                          # Base de datos CSV
│   ├── emprendimientos.csv        # Información de emprendimientos
│   ├── productos.csv              # Catálogo de productos
│   └── servicios.csv              # Catálogo de servicios
├── scripts/
│   ├── data_manager.py            # Gestor de datos con Pandas
│   └── server.py                  # Servidor HTTP con API
├── css/
│   └── styles.css                 # Estilos modernos
├── js/
│   └── main.js                    # JavaScript interactivo
├── index.html                     # Página principal
├── results.html                   # Página de resultados
├── about.html                     # Página acerca de
└── requirements.txt               # Dependencias Python
```

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura semántica
- **CSS3**: Grid, Flexbox, Variables CSS
- **JavaScript ES6+**: Async/await, Fetch API
- **Diseño Responsivo**: Mobile-first approach

### Backend
- **Python 3**: Servidor HTTP nativo
- **Pandas**: Manejo eficiente de datos CSV
- **JSON API**: Comunicación cliente-servidor

### Base de Datos
- **CSV Files**: Fácil edición con Excel/Google Sheets
- **Pandas DataFrames**: Búsquedas y filtros optimizados
- **Estructura Relacional**: Emprendimientos → Productos/Servicios

## 📊 Sistema de Base de Datos CSV

### Ventajas del Sistema CSV + Pandas

✅ **Fácil de Editar**: Compatible con Excel, Google Sheets, LibreOffice  
✅ **Excelente Rendimiento**: Pandas optimiza las búsquedas  
✅ **Escalable**: Maneja miles de registros eficientemente  
✅ **Separación Clara**: Datos organizados en tablas relacionales  
✅ **Versionado**: Compatible con Git para control de versiones  
✅ **Análisis de Datos**: Integración con herramientas de ciencia de datos  
✅ **Ideal para Estudiantes**: Fácil de entender y mantener  

### Estructura de Datos

#### emprendimientos.csv
```csv
id,nombre,categoria,tipo,emprendedor_nombre,emprendedor_carrera,emprendedor_semestre,emprendedor_instagram,emprendedor_email
1,Dulces Artesanales María,alimentos,producto,María González,Ingeniería Química,8,@dulcesmaria,maria.dulces@gmail.com
```

#### productos.csv
```csv
id,emprendimiento_id,nombre,descripcion,precio,disponible,stock,tags
101,1,Brownies de Chocolate,Brownies artesanales con chocolate belga y nueces,15000,true,20,"chocolate,artesanal,postre,dulce,nueces"
```

#### servicios.csv
```csv
id,emprendimiento_id,nombre,descripcion,precio,disponible,duracion,tags
2701,27,Logos Profesionales,Diseño de logos únicos para empresas,50000,true,3 días,"logos,profesionales,empresas,branding,identidad"
```

## 🚀 Instalación y Uso

### Prerrequisitos
```bash
# En Arch Linux
sudo pacman -S python python-pandas

# En Ubuntu/Debian
sudo apt install python3 python3-pandas

# Con pip
pip install pandas
```

### Ejecutar el Proyecto
```bash
# Clonar el repositorio
git clone <repository-url>
cd edunari2

# Instalar dependencias
pip install -r requirements.txt

# Iniciar el servidor
python3 scripts/server.py
```

El servidor se iniciará en `http://localhost:8000` y abrirá automáticamente el navegador.

## 🔍 API Endpoints

### Búsqueda General
```http
GET /api/search?q=chocolate
```

### Estadísticas del Sistema
```http
GET /api/status
```

### Lista de Emprendimientos
```http
GET /api/entrepreneurs
```

### Productos por Categoría
```http
GET /api/products?category=alimentos&limit=10
```

### Servicios por Categoría
```http
GET /api/services?category=diseño-grafico&limit=10
```

## 📈 Algoritmo de Búsqueda

El sistema implementa un algoritmo de relevancia inteligente:

- **Coincidencia exacta en nombre**: +3 puntos
- **Coincidencia en tags**: +2 puntos por tag
- **Coincidencia en descripción**: +1 punto
- **Coincidencia en emprendimiento/emprendedor**: +1 punto

Los resultados se ordenan por score de relevancia descendente.

## 🎯 Categorías Disponibles

### Productos (12 categorías)
- Alimentos
- Bisutería y Manualidades
- Bolsos y Maletas
- Cuidado Personal y Belleza
- Deportes
- Electrodomésticos
- Escuela
- Hogar y Jardín
- Informática
- Mascotas
- Moda Hombre
- Moda Mujeres

### Servicios (11 categorías)
- Asesoría Profesional
- Diseño Gráfico
- Edición de Fotos y Videos
- Enseñanza
- Escritura y Traducción
- Fotografía
- Marketing
- Música y Audio
- Programación
- Reparaciones
- Salud y Bienestar

## 🧪 Pruebas del Sistema

```bash
# Ejecutar pruebas completas
python3 test_csv_system.py

# Probar API directamente
curl "http://localhost:8000/api/search?q=chocolate"
curl "http://localhost:8000/api/status"
```

## 📚 Documentación Técnica

### Arquitectura del Sistema

1. **Frontend**: SPA (Single Page Application) con navegación dinámica
2. **Backend**: Servidor HTTP Python con manejo de rutas API
3. **Datos**: Sistema CSV con Pandas para consultas optimizadas
4. **Comunicación**: API REST con respuestas JSON

### Flujo de Búsqueda

1. Usuario ingresa término en la interfaz
2. JavaScript envía petición a `/api/search`
3. Pandas busca en DataFrames usando máscaras booleanas
4. Sistema calcula relevancia y ordena resultados
5. API devuelve JSON con resultados
6. Frontend renderiza cards de resultados

### Optimizaciones Implementadas

- **Carga única de datos**: Singleton pattern para DataFrames
- **Búsqueda vectorizada**: Pandas optimiza operaciones
- **Índices implícitos**: Pandas maneja indexación automáticamente
- **Procesamiento de tags**: Conversión string → lista para búsquedas
- **Cache de emprendimientos**: Evita joins repetitivos

## 🎓 Valor Educativo

Este proyecto demuestra:

- **Arquitectura MVC**: Separación clara de responsabilidades
- **API Design**: Endpoints RESTful bien estructurados
- **Data Management**: Uso profesional de Pandas
- **Frontend Moderno**: JavaScript ES6+ y CSS Grid
- **Buenas Prácticas**: Código limpio, documentado y mantenible

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Autores

- **Estudiante USB** - *Desarrollo inicial* - Universidad Simón Bolívar

## 🙏 Agradecimientos

- Universidad Simón Bolívar por fomentar el emprendimiento estudiantil
- Comunidad de desarrolladores Python y JavaScript
- Pandas Development Team por la excelente librería
- Todos los estudiantes emprendedores que inspiran este proyecto

---

**Edunari** - Conectando emprendedores estudiantiles con el mundo 🌟 