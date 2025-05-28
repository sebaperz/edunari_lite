# Configuración del Servidor Edunari

## Requisitos Previos

- Node.js (versión 14 o superior)
- npm (viene incluido con Node.js)

## Instalación

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Crear la carpeta data (opcional, se crea automáticamente):**
   ```bash
   mkdir data
   ```

## Ejecución

### Modo Desarrollo (con auto-reload)
```bash
npm run dev
```

### Modo Producción
```bash
npm start
```

## Acceso

Una vez iniciado el servidor:
- **URL**: http://localhost:3000
- **Puerto**: 3000 (configurable en server.js)

## Funcionalidades

### Registro de Pioneros
- **Endpoint**: `POST /api/pioneers`
- **Archivo de datos**: `data/pioneers.csv`
- **Formato CSV**: Fecha y Hora, Nombre Completo, Correo Electrónico, Teléfono, Términos Aceptados

### Consulta de Pioneros (opcional)
- **Endpoint**: `GET /api/pioneers`
- **Respuesta**: JSON con todos los registros

## Estructura de Archivos

```
edunari_lite/
├── server.js              # Servidor Express
├── package.json           # Dependencias y scripts
├── data/
│   └── pioneers.csv       # Datos de pioneros (se crea automáticamente)
├── js/
│   └── pioneer-register.js # JavaScript del formulario
├── css/
├── index.html
├── pioneer-register.html
└── ...
```

## Características

✅ **Sin descargas**: Los datos se guardan directamente en el servidor  
✅ **Archivo local**: `data/pioneers.csv` se mantiene en el proyecto  
✅ **Backup automático**: Los datos también se guardan en localStorage  
✅ **Validación**: Validación tanto en frontend como backend  
✅ **CORS habilitado**: Permite peticiones desde el frontend  
✅ **Manejo de errores**: Fallback a localStorage si el servidor falla  

## Solución de Problemas

### Error: "Cannot find module"
```bash
npm install
```

### Puerto 3000 ocupado
Cambiar el puerto en `server.js`:
```javascript
const PORT = 3001; // o cualquier otro puerto disponible
```

### Permisos de escritura
Asegúrate de que el directorio tenga permisos de escritura:
```bash
chmod 755 data/
```

## Logs

El servidor mostrará en consola:
- Registros de nuevos pioneros
- Errores de validación
- Estado del servidor

## Datos de Ejemplo

El archivo `pioneers.csv` tendrá el formato:
```csv
Fecha y Hora,Nombre Completo,Correo Electrónico,Teléfono,Términos Aceptados
2025-01-15T10:30:00.000Z,"Juan Pérez",juan@email.com,3001234567,Sí
2025-01-15T11:15:00.000Z,"María García",maria@email.com,3009876543,Sí
``` 