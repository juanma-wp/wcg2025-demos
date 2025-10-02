# WP REST Auth Demo - WordCamp Galicia 2025

Plugin de demostración para la charla **"Hablando con WordPress desde fuera: autenticación y acceso a datos"**.

## 📋 Propósito

Este plugin demuestra **tres conceptos fundamentales** para trabajar con la WordPress REST API:

1. ✅ **Cómo crear custom endpoints protegidos**
2. ✅ **Cómo modificar/extender endpoints existentes de WordPress**
3. ✅ **Cómo la autenticación JWT/OAuth2 se aplica automáticamente a todos los endpoints**

## 🔌 Requisitos

Este plugin trabaja en conjunto con:
- [JWT Auth Pro WP REST API](https://github.com/juanma-wp/jwt-auth-pro-wp-rest-api)
- [OAuth2 Auth Pro WP REST API](https://github.com/juanma-wp/wp-rest-auth-oauth2)

**Nota:** También puedes usar **Application Passwords** (disponible desde WordPress 5.6) sin necesidad de plugins adicionales.

## 🚀 Instalación

1. Copia la carpeta `wp-rest-auth-demo` a tu directorio de plugins de WordPress (`wp-content/plugins/`)
2. Activa el plugin desde el panel de administración
3. El plugin registrará automáticamente todos los endpoints

## 🔑 Configuración de Application Passwords

Para usar Application Passwords (método de autenticación nativo de WordPress):

1. Ve a **Usuarios → Tu Perfil** en el panel de administración
2. Desplázate hasta la sección **"Application Passwords"**
3. Introduce un nombre para la aplicación (ej: "API Demo")
4. Haz clic en **"Add New Application Password"**
5. **Copia la contraseña generada** (formato: `xxxx xxxx xxxx xxxx xxxx xxxx`)
6. Úsala con tu nombre de usuario en las peticiones HTTP

**Ejemplo de uso:**
```bash
curl -u "tu_usuario:xxxx xxxx xxxx xxxx xxxx xxxx" \
  https://wcg2025-demo.wp.local/wp-json/wcg2025/v1/protected/user-data
```

> **Nota:** En todos los ejemplos de este documento, `wcg2025-demo.wp.local` es una URL de ejemplo. Reemplázala con la URL real de tu sitio WordPress.

## 📡 Endpoints Disponibles

### 🌍 Endpoints Públicos (sin autenticación)

#### `GET /wp-json/wcg2025/v1/public/stats`

Obtiene estadísticas públicas del sitio.

**Ejemplo de uso:**
```bash
curl https://wcg2025-demo.wp.local/wp-json/wcg2025/v1/public/stats
```

**Respuesta:**
```json
{
  "total_posts": 42,
  "total_pages": 7,
  "total_users": 5,
  "wordpress_version": "6.8",
  "site_name": "Mi Sitio WordPress",
  "authentication_status": "public"
}
```

---

### 🔒 Endpoints Protegidos (requieren autenticación)

#### `GET /wp-json/wcg2025/v1/protected/user-data`

Obtiene datos del usuario autenticado actual.

**Ejemplo con JWT:**
```bash
curl -H "Authorization: Bearer TU_TOKEN_JWT" \
  https://wcg2025-demo.wp.local/wp-json/wcg2025/v1/protected/user-data
```

**Ejemplo con OAuth2:**
```bash
curl -H "Authorization: Bearer TU_TOKEN_OAUTH2" \
  https://wcg2025-demo.wp.local/wp-json/wcg2025/v1/protected/user-data
```

**Ejemplo con Application Password:**
```bash
curl -u "usuario:xxxx xxxx xxxx xxxx xxxx xxxx" \
  https://wcg2025-demo.wp.local/wp-json/wcg2025/v1/protected/user-data
```

**Respuesta:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@ejemplo.com",
  "display_name": "Administrador",
  "roles": ["administrator"],
  "capabilities": ["manage_options", "edit_posts", "..."],
  "registered": "2024-01-15 10:30:00",
  "posts_count": 15,
  "auth_method": "jwt"
}
```

---

#### `GET /wp-json/wcg2025/v1/protected/my-drafts`

Obtiene los borradores del usuario autenticado.

**Ejemplo con JWT/OAuth2:**
```bash
curl -H "Authorization: Bearer TU_TOKEN" \
  https://wcg2025-demo.wp.local/wp-json/wcg2025/v1/protected/my-drafts
```

**Ejemplo con Application Password:**
```bash
curl -u "usuario:xxxx xxxx xxxx xxxx xxxx xxxx" \
  https://wcg2025-demo.wp.local/wp-json/wcg2025/v1/protected/my-drafts
```

**Respuesta:**
```json
{
  "total": 3,
  "drafts": [
    {
      "id": 123,
      "title": "Mi borrador",
      "excerpt": "Este es el contenido del borrador...",
      "modified": "2025-01-15 14:30:00",
      "edit_url": "https://wcg2025-demo.wp.local/wp-admin/post.php?post=123&action=edit"
    }
  ]
}
```

---

#### `PUT /wp-json/wcg2025/v1/protected/profile`

Actualiza el perfil del usuario autenticado.

**Ejemplo con JWT/OAuth2:**
```bash
curl -X PUT \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bio": "Desarrollador WordPress", "website": "https://ejemplo.com"}' \
  https://wcg2025-demo.wp.local/wp-json/wcg2025/v1/protected/profile
```

**Ejemplo con Application Password:**
```bash
curl -X PUT \
  -u "usuario:xxxx xxxx xxxx xxxx xxxx xxxx" \
  -H "Content-Type: application/json" \
  -d '{"bio": "Desarrollador WordPress", "website": "https://ejemplo.com"}' \
  https://wcg2025-demo.wp.local/wp-json/wcg2025/v1/protected/profile
```

**Respuesta:**
```json
{
  "success": true,
  "updated_fields": ["bio", "website"],
  "message": "Perfil actualizado correctamente"
}
```

---

### 👮 Endpoints con Capacidades Específicas

#### `POST /wp-json/wcg2025/v1/protected/editor-only`

Crea contenido destacado. **Solo editores o superiores**.

**Ejemplo con JWT/OAuth2:**
```bash
curl -X POST \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi contenido destacado",
    "content": "<p>Este es un contenido importante</p>"
  }' \
  https://wcg2025-demo.wp.local/wp-json/wcg2025/v1/protected/editor-only
```

**Ejemplo con Application Password:**
```bash
curl -X POST \
  -u "usuario:xxxx xxxx xxxx xxxx xxxx xxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi contenido destacado",
    "content": "<p>Este es un contenido importante</p>"
  }' \
  https://wcg2025-demo.wp.local/wp-json/wcg2025/v1/protected/editor-only
```

**Respuesta:**
```json
{
  "success": true,
  "post_id": 456,
  "message": "Contenido destacado creado exitosamente",
  "edit_url": "https://wcg2025-demo.wp.local/wp-admin/post.php?post=456&action=edit"
}
```

---

## 🔧 Campos Personalizados en Endpoints Existentes

El plugin también **extiende los endpoints estándar de WordPress** añadiendo campos personalizados a `/wp-json/wp/v2/posts`:

### Campos añadidos:

#### `reading_time` (integer)
Tiempo estimado de lectura en minutos (calculado automáticamente).

#### `author_bio` (string)
Biografía del autor del post.

#### `view_count` (integer, editable)
Contador de vistas del post. **Requiere autenticación para editar**.

### Ejemplo de uso:

**Obtener posts con campos personalizados:**
```bash
curl https://wcg2025-demo.wp.local/wp-json/wp/v2/posts/123
```

**Respuesta (extracto):**
```json
{
  "id": 123,
  "title": { "rendered": "Mi Post" },
  "content": { "rendered": "..." },
  "reading_time": 5,
  "author_bio": "Juan es desarrollador WordPress desde 2015",
  "view_count": 1234
}
```

**Actualizar el contador de vistas (requiere autenticación):**
```bash
curl -X POST \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"view_count": 1235}' \
  https://wcg2025-demo.wp.local/wp-json/wp/v2/posts/123
```

---

## 🎯 Casos de Uso para la Demo

### Demo 1: Endpoint Público vs Protegido

```bash
# 1. Acceso público - funciona sin token
curl https://wcg2025-demo.wp.local/wp-json/wcg2025/v1/public/stats

# 2. Intento sin autenticación - falla
curl https://wcg2025-demo.wp.local/wp-json/wcg2025/v1/protected/user-data

# 3. Con JWT - funciona
curl -H "Authorization: Bearer TU_JWT_TOKEN" \
  https://wcg2025-demo.wp.local/wp-json/wcg2025/v1/protected/user-data

# 4. Con OAuth2 - también funciona
curl -H "Authorization: Bearer TU_OAUTH2_TOKEN" \
  https://wcg2025-demo.wp.local/wp-json/wcg2025/v1/protected/user-data

# 5. Con Application Password - también funciona
curl -u "usuario:xxxx xxxx xxxx xxxx xxxx xxxx" \
  https://wcg2025-demo.wp.local/wp-json/wcg2025/v1/protected/user-data
```

### Demo 2: Capacidades de Usuario

```bash
# Con usuario subscriber - falla
curl -H "Authorization: Bearer TOKEN_SUBSCRIBER" \
  -X POST https://wcg2025-demo.wp.local/wp-json/wcg2025/v1/protected/editor-only

# Con usuario editor - funciona (JWT/OAuth2)
curl -H "Authorization: Bearer TOKEN_EDITOR" \
  -X POST -H "Content-Type: application/json" \
  -d '{"title": "Test", "content": "Contenido"}' \
  https://wcg2025-demo.wp.local/wp-json/wcg2025/v1/protected/editor-only

# Con usuario editor - funciona (Application Password)
curl -u "editor:xxxx xxxx xxxx xxxx xxxx xxxx" \
  -X POST -H "Content-Type: application/json" \
  -d '{"title": "Test", "content": "Contenido"}' \
  https://wcg2025-demo.wp.local/wp-json/wcg2025/v1/protected/editor-only
```

### Demo 3: Modificación de Endpoints Existentes

```bash
# Ver posts con campos personalizados
curl https://wcg2025-demo.wp.local/wp-json/wp/v2/posts?_fields=id,title,reading_time,author_bio,view_count

# Actualizar contador sin autenticación - falla
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"view_count": 100}' \
  https://wcg2025-demo.wp.local/wp-json/wp/v2/posts/123

# Actualizar contador con autenticación - funciona (JWT/OAuth2)
curl -X POST \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"view_count": 100}' \
  https://wcg2025-demo.wp.local/wp-json/wp/v2/posts/123

# Actualizar contador con autenticación - funciona (Application Password)
curl -X POST \
  -u "usuario:xxxx xxxx xxxx xxxx xxxx xxxx" \
  -H "Content-Type: application/json" \
  -d '{"view_count": 100}' \
  https://wcg2025-demo.wp.local/wp-json/wp/v2/posts/123
```

---

## 💡 Lo que Demuestra este Plugin

### 1. **La autenticación es transparente**

Una vez que JWT o OAuth2 autentican al usuario, **no necesitas hacer nada especial** en tus custom endpoints. Simplemente usas `is_user_logged_in()` y `current_user_can()` como siempre.

```php
'permission_callback' => function() {
    return is_user_logged_in(); // ¡Así de simple!
}
```

### 2. **Los mismos endpoints funcionan con múltiples métodos de autenticación**

No importa si el usuario se autentica con JWT, OAuth2, Application Passwords o cookies. Los endpoints funcionan igual porque WordPress gestiona la autenticación a nivel de framework.

### 3. **Puedes extender WordPress sin modificar el core**

Los campos personalizados añadidos con `register_rest_field()` aparecen automáticamente en las respuestas de la API sin tocar ningún archivo del core.

---

## 🎤 Guión Sugerido para la Demo (10 minutos)

### Minuto 0-2: Introducción
- Presentar el problema: "¿Cómo acceder a WordPress desde fuera?"
- Mostrar las demos React funcionando

### Minuto 2-4: Custom Endpoints
- Mostrar el código de un endpoint público vs protegido
- Demostrar con cURL/Postman ambos casos
- Explicar `permission_callback`

### Minuto 4-6: Autenticación Transparente
- Llamar al mismo endpoint con JWT
- Llamar al mismo endpoint con OAuth2
- Mostrar que ambos funcionan igual
- Mostrar el campo `auth_method` en la respuesta

### Minuto 6-8: Modificar Endpoints Existentes
- Mostrar cómo añadimos campos a `/wp/v2/posts`
- Demostrar `reading_time` (calculado)
- Demostrar `view_count` (editable con autenticación)

### Minuto 8-10: Capacidades y Cierre
- Mostrar endpoint que requiere capacidades específicas
- Intentar con usuario sin permisos (falla)
- Intentar con usuario con permisos (funciona)
- Mensaje final: "Todo funciona junto, sin fricción"

---

## 📚 Recursos Adicionales

- [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
- [Repositorio de las demos React](https://github.com/juanma-wp/wcg2025-demos)
- [JWT Auth Pro Plugin](https://github.com/juanma-wp/jwt-auth-pro-wp-rest-api)
- [OAuth2 Auth Pro Plugin](https://github.com/juanma-wp/wp-rest-auth-oauth2)

---

## 📄 Licencia

GPL v2 or later

---

## 👤 Autor

**Juan Manuel Garrido**
- GitHub: [@juanma-wp](https://github.com/juanma-wp)
- WordCamp Galicia 2025

---

**¡Disfruta de la charla! 🚀**
