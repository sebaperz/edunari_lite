# 🚀 Guía Completa de Configuración - Edunari Lite

## 📋 Requisitos del Sistema

### Sistema Operativo
- **Linux**: Ubuntu 20.04+ / Arch Linux / Debian 11+
- **macOS**: 10.15+ (Catalina o superior)
- **Windows**: Windows 10 / Windows 11 con WSL2 (recomendado)

### Hardware Mínimo
- **RAM**: 4GB (8GB recomendado)
- **Almacenamiento**: 2GB de espacio libre
- **Procesador**: x64 compatible

## 🛠 Herramientas y Programas Requeridos

### 1. **Node.js y npm** (Obligatorio)

#### Linux (Ubuntu/Debian)
```bash
# Actualizar repositorios
sudo apt update

# Instalar Node.js LTS y npm
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version  # v18.x.x o superior
npm --version   # 9.x.x o superior
```

#### Linux (Arch Linux)
```bash
# Instalar Node.js y npm
sudo pacman -S nodejs npm

# Verificar instalación
node --version
npm --version
```

#### macOS
```bash
# Opción 1: Homebrew (recomendado)
brew install node

# Opción 2: Descargar desde nodejs.org
# https://nodejs.org/en/download/

# Verificar instalación
node --version
npm --version
```

#### Windows
```powershell
# Opción 1: Winget (Windows 11)
winget install OpenJS.NodeJS

# Opción 2: Chocolatey
choco install nodejs

# Opción 3: Descargar instalador desde nodejs.org
# https://nodejs.org/en/download/

# Verificar en PowerShell/CMD
node --version
npm --version
```

### 2. **Git** (Obligatorio para clonar proyecto)

#### Linux
```bash
# Ubuntu/Debian
sudo apt install git

# Arch Linux
sudo pacman -S git

# Verificar
git --version
```

#### macOS
```bash
# Viene preinstalado o instalar con Homebrew
brew install git

# Verificar
git --version
```

#### Windows
```bash
# Descargar desde: https://git-scm.com/download/win
# O usar Winget
winget install Git.Git
```

### 3. **Editor de Código** (Recomendado)

#### Visual Studio Code (Recomendado)
```bash
# Linux - snap
sudo snap install --classic code

# macOS - Homebrew
brew install --cask visual-studio-code

# Windows - Winget
winget install Microsoft.VisualStudioCode
```

**Extensiones Recomendadas para VS Code:**
- ES6 String HTML
- Live Server
- JavaScript (ES6) code snippets
- CSS Peek
- Auto Rename Tag
- Prettier - Code formatter

#### Alternativas
- **Sublime Text**: Editor ligero y rápido
- **WebStorm**: IDE completo (licencia requerida)
- **Atom**: Editor de GitHub (descontinuado pero funcional)

### 4. **Navegador Web Moderno** (Obligatorio)

#### Navegadores Compatibles
- **Chrome/Chromium 90+** (Recomendado)
- **Firefox 88+**
- **Safari 14+** (macOS)
- **Edge 90+** (Windows)

```bash
# Linux - Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt update && sudo apt install google-chrome-stable

# macOS - Chrome
brew install --cask google-chrome

# Windows - Chrome
winget install Google.Chrome
```

### 5. **Herramientas de Desarrollo** (Opcional pero recomendadas)

#### Nodemon (Desarrollo con auto-reload)
```bash
# Instalar globalmente
npm install -g nodemon

# O usar npx (sin instalación global)
npx nodemon server.js
```

#### Live Server (Servidor de desarrollo frontend)
```bash
# Instalar globalmente
npm install -g live-server

# O usar como extensión de VS Code
```

#### curl (Testing de API)
```bash
# Linux (usualmente preinstalado)
sudo apt install curl  # Ubuntu/Debian
sudo pacman -S curl    # Arch Linux

# macOS (preinstalado)
# Si no está: brew install curl

# Windows
# Incluido en Windows 10+ o instalar con:
winget install curl
```

## 📦 Instalación del Proyecto

### 1. **Clonar el Repositorio**
```bash
# Navegar al directorio deseado
cd ~/workspace  # o tu directorio de proyectos

# Clonar el proyecto
git clone https://github.com/tu-usuario/edunari_lite.git
cd edunari_lite

# Verificar estructura
ls -la
```

### 2. **Instalar Dependencias del Proyecto**
```bash
# Instalar todas las dependencias
npm install

# Verificar que se instalaron correctamente
npm list
```

**Dependencias Principales:**
- `express`: Servidor web
- `cors`: Manejo de CORS para API
- `nodemon`: Auto-reload en desarrollo (devDependency)

### 3. **Verificar Estructura de Datos**
```bash
# Crear directorio de datos si no existe
mkdir -p data

# Verificar archivos CSV requeridos
ls data/
# Debería mostrar:
# - productos.csv
# - servicios.csv
# - emprendimientos.csv
# - pioneers.csv (se crea automáticamente)
```

## 🚀 Ejecutar el Proyecto

### Desarrollo (con auto-reload)
```bash
# Opción 1: npm script
npm run dev

# Opción 2: nodemon directo
npx nodemon server.js

# Opción 3: si tienes nodemon global
nodemon server.js
```

### Producción
```bash
npm start
```

### Verificar que el servidor está corriendo
```bash
# En otra terminal
curl http://localhost:3000/api/status

# O abrir en navegador:
# http://localhost:3000
```

## 🌐 Acceso a la Aplicación

Una vez iniciado el servidor:

### URLs Principales
- **Página Principal**: http://localhost:3000
- **Búsqueda**: http://localhost:3000/search-results.html
- **Registro Pioneros**: http://localhost:3000/pioneer-register.html
- **Acerca de**: http://localhost:3000/about.html
- **Ayuda**: http://localhost:3000/help.html

### Endpoints de API
- **Estado del sistema**: `GET /api/status`
- **Búsqueda general**: `GET /api/search?q=termino`
- **Productos**: `GET /api/products?category=categoria&limit=50`
- **Servicios**: `GET /api/services?category=categoria&limit=50`
- **Emprendimientos**: `GET /api/entrepreneurs`
- **Registro pioneros**: `POST /api/pioneers`
- **Lista pioneros**: `GET /api/pioneers`

## 🔧 Configuración Avanzada

### Variables de Entorno
```bash
# Crear archivo .env (opcional)
touch .env

# Contenido del .env
PORT=3000
NODE_ENV=development
DATA_DIR=./data
CACHE_DURATION=300000
```

### Configuración de Puerto
```javascript
// En server.js, línea ~7
const PORT = process.env.PORT || 3000;  // Cambiar 3000 por el puerto deseado
```

### Habilitar HTTPS (Opcional)
```bash
# Generar certificados SSL para desarrollo
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

## 🧪 Testing y Desarrollo

### Herramientas de Testing
```bash
# Instalar herramientas de testing (opcional)
npm install --save-dev jest supertest

# Ejecutar tests (cuando estén configurados)
npm test
```

### Herramientas de Debugging
```bash
# Node.js con debugging
node --inspect server.js

# Chrome DevTools
# Abrir chrome://inspect en Chrome
```

### Linting y Formateo (Opcional)
```bash
# ESLint para JavaScript
npm install --save-dev eslint
npx eslint --init

# Prettier para formateo
npm install --save-dev prettier
echo '{"semi": true, "singleQuote": true}' > .prettierrc
```

## 📊 Monitoreo y Logs

### Logs del Servidor
```bash
# Ver logs en tiempo real
npm start | tee logs/server.log

# Con timestamp
npm start | while read line; do echo "$(date): $line"; done
```

### Monitoreo de Performance
```bash
# Instalar herramientas de monitoreo
npm install --save-dev clinic

# Analizar performance
npx clinic doctor -- node server.js
```

## 🔒 Consideraciones de Seguridad

### Firewall (Producción)
```bash
# Ubuntu/Debian
sudo ufw allow 3000/tcp

# CentOS/RHEL
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

### Proxy Reverso (Producción)
```nginx
# Configuración Nginx
server {
    listen 80;
    server_name tu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🐛 Solución de Problemas

### Problemas Comunes

#### Puerto 3000 ocupado
```bash
# Encontrar proceso usando el puerto
lsof -i :3000          # Linux/macOS
netstat -ano | findstr 3000  # Windows

# Matar proceso
kill -9 PID            # Linux/macOS
taskkill /PID PID /F   # Windows

# Usar puerto alternativo
PORT=3001 npm start
```

#### Error: "Cannot find module"
```bash
# Limpiar cache de npm
npm cache clean --force

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

#### Permisos de archivos (Linux/macOS)
```bash
# Dar permisos al directorio data
chmod 755 data/
chmod 644 data/*.csv

# Cambiar propietario si es necesario
sudo chown -R $USER:$USER data/
```

#### Memoria insuficiente
```bash
# Aumentar límite de memoria de Node.js
node --max-old-space-size=4096 server.js
```

### Logs de Debugging
```bash
# Habilitar logs verbose
DEBUG=* npm start

# Solo logs de la aplicación
DEBUG=edunari:* npm start
```

## 📚 Recursos Adicionales

### Documentación Oficial
- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/guide/)
- [npm Documentation](https://docs.npmjs.com/)

### Tutoriales Recomendados
- [MDN Web APIs](https://developer.mozilla.org/en-US/docs/Web/API)
- [JavaScript.info](https://javascript.info/)
- [CSS-Tricks](https://css-tricks.com/)

### Comunidad
- [Stack Overflow](https://stackoverflow.com/questions/tagged/node.js)
- [Node.js Community](https://nodejs.org/community/)
- [GitHub Issues](https://github.com/tu-usuario/edunari_lite/issues)

## ✅ Checklist de Verificación

Antes de comenzar el desarrollo, verifica que tienes:

- [ ] Node.js v18+ instalado
- [ ] npm funcionando correctamente
- [ ] Git configurado
- [ ] Editor de código instalado
- [ ] Navegador moderno disponible
- [ ] Proyecto clonado correctamente
- [ ] Dependencias instaladas (`npm install`)
- [ ] Servidor ejecutándose (`npm start`)
- [ ] Página principal accesible (http://localhost:3000)
- [ ] API respondiendo (`/api/status`)

## 🎓 Para Estudiantes

### Recomendaciones de Aprendizaje
1. **Empieza con lo básico**: HTML, CSS, JavaScript
2. **Aprende Node.js**: Fundamentos de backend
3. **Practica con APIs**: Fetch, async/await
4. **Debugging**: Usa Chrome DevTools
5. **Version Control**: Aprende Git básico

### Proyectos de Práctica
- Modificar estilos CSS
- Agregar nuevas funcionalidades
- Crear endpoints adicionales
- Implementar tests unitarios
- Mejorar la interfaz de usuario

---

**¿Problemas con la instalación?** Revisa la sección de [Solución de Problemas](#-solución-de-problemas) o crea un [issue](https://github.com/tu-usuario/edunari_lite/issues) con los detalles del error. 