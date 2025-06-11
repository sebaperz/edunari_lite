# Sistema de Autenticación Edunari

## Descripción

Este sistema implementa un sistema de autenticación completo para la plataforma Edunari que guarda los usuarios en un archivo CSV (`data/users.csv`) y permite registro e inicio de sesión.

## Características

✅ **Registro de usuarios** - Los usuarios pueden crear cuentas nuevas
✅ **Inicio de sesión** - Autenticación con email y contraseña
✅ **Almacenamiento en CSV** - Los datos se guardan en `data/users.csv`
✅ **Validación robusta** - Validación tanto en frontend como backend
✅ **Fallback local** - Funciona sin servidor usando localStorage
✅ **Buenas prácticas** - Código bien documentado y siguiendo estándares

## Estructura de archivos

```
edunari_lite/
├── data/
│   └── users.csv           # Base de datos de usuarios
├── js/
│   └── auth.js             # Lógica de autenticación frontend
├── server.js               # API backend con endpoints de auth
├── login.html              # Página de inicio de sesión
└── register.html           # Página de registro
```

## API Endpoints

### POST `/api/auth/login`
Autenticar usuario existente

**Cuerpo de la petición:**
```json
{
  "email": "usuario@email.com",
  "password": "contraseña123"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Autenticación exitosa",
  "user": { "email": "usuario@email.com" }
}
```

### POST `/api/auth/register`
Registrar nuevo usuario

**Cuerpo de la petición:**
```json
{
  "email": "nuevo@email.com",
  "password": "contraseña123"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "user": { "email": "nuevo@email.com" }
}
```

### GET `/api/auth/check-user?email=usuario@email.com`
Verificar si un email ya está registrado

**Respuesta:**
```json
{
  "success": true,
  "exists": true
}
```

## Formato del archivo CSV

El archivo `data/users.csv` tiene la siguiente estructura:

```csv
email,password
admin@edunari.com,admin123
test@test.com,password123
usuario@email.com,contraseña123
```

## Uso

### Iniciar el servidor
```bash
npm start
# o
node server.js
```

### Usuarios de prueba incluidos
- **Email:** `admin@edunari.com` | **Contraseña:** `admin123`
- **Email:** `test@test.com` | **Contraseña:** `password123`

### Registro de nuevos usuarios
1. Ir a `/register.html`
2. Completar el formulario con email y contraseña
3. El usuario se guardará automáticamente en `data/users.csv`

### Inicio de sesión
1. Ir a `/login.html`
2. Ingresar email y contraseña
3. Si las credenciales son correctas, se redirige a la página principal

## Validaciones implementadas

### Frontend (JavaScript)
- ✅ Formato de email válido
- ✅ Contraseña mínimo 6 caracteres
- ✅ Verificación de términos y condiciones
- ✅ Validación en tiempo real

### Backend (Node.js)
- ✅ Formato de email válido
- ✅ Contraseña mínimo 6 caracteres
- ✅ Verificación de email duplicado
- ✅ Sanitización de datos

## Funcionalidades adicionales

### Fallback sin servidor
Si el servidor no está disponible, el sistema puede funcionar usando `localStorage`:
- Los usuarios se guardan localmente en el navegador
- Permite desarrollo sin backend
- Se sincroniza automáticamente cuando el servidor esté disponible

### Características de seguridad
- ✅ Validación de entrada robusta
- ✅ Sanitización de datos
- ✅ Manejo de errores apropiado
- ✅ Headers CORS configurados
- ✅ Logs de seguridad en consola

## Próximas mejoras sugeridas

Para un entorno de producción, considera implementar:

1. **Encriptación de contraseñas** usando bcrypt
2. **Autenticación JWT** para sesiones
3. **Base de datos** (MySQL, PostgreSQL, MongoDB)
4. **Validación de email** por confirmación
5. **Recuperación de contraseña**
6. **Rate limiting** para prevenir ataques
7. **HTTPS** obligatorio

## Documentación de referencia

- [MDN Web Forms](https://developer.mozilla.org/en-US/docs/Learn/Forms)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Node.js File System](https://nodejs.org/api/fs.html)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

## Soporte

Si tienes problemas con el sistema de autenticación:

1. Verifica que el servidor esté corriendo en el puerto 3000
2. Revisa la consola del navegador para errores
3. Confirma que el archivo `data/users.csv` existe y tiene permisos de escritura
4. Verifica los logs del servidor para más detalles 