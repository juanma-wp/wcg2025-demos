# Demo WC Galicia 2025 (Notes)

Usar Chrome!! 

👉 https://docs.google.com/presentation/d/1aA2FoCPgTwCEQcgEROAVTP8uLbUCLdqa/edit?usp=sharing&ouid=103017329496724066368&rtpof=true&sd=true


https://github.com/juanma-wp/wcg2025-demos/tree/main/react-wp-jwt-demo

https://github.com/juanma-wp/jwt-auth-pro-wp-rest-api
https://github.com/juanma-wp/oauth2-auth-pro-wp-rest-api

👉 https://excalidraw.com/#json=O7sM2JtIzoHPRZLENg2-5,3RkCN4lMKMzPwI1fz8wJTQ

## Cookies

https://wcg2025-demo.wp.local/wp-admin/

admin:b5GpT!kEqJ!cr)tdatPNkel$

- cookie `wordpress_logged_in_*`
- nonce `X-WP-Nonce`

👉 Network - filter by Fetch/Post
👉 Desde Edit Post

👉 Edit and Update post

👉 GET a endpoint público
```js
wp.apiFetch({ path: '/wp/v2/posts' }).then(console.log).catch(console.error);

```

👉 GET a endpoint que requiere autenticación
```js
wp.apiFetch({ path: '/wp/v2/users' }).then(console.log).catch(console.error);
```

👉 POST
```js
wp.apiFetch({
  path: '/wp/v2/posts',
  method: 'POST',
  data: {
    title: 'Post desde apiFetch',
    content: 'Este es un post de prueba creado con apiFetch',
    status: 'draft'
  }
}).then(console.log).catch(console.error);
```

X-WP-Nonce no disponible en el frontend

## Authentication Passwords

👉 GET a endpoint que requiere autenticación
```bash
curl -u "admin:XpBF zaTo TBCI z1ur PkIb YLZq" \
  https://wcg2025-demo.wp.local/wp-json/wp/v2/users/me
```

👉 POST
```bash
curl -X POST \
  -u "admin:XpBF zaTo TBCI z1ur PkIb YLZq" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi contenido con Authentication Passwords",
    "content": "<p>Este es un contenido importante usando Authentication Passwords</p>"
  }' \
  https://wcg2025-demo.wp.local/wp-json/wp/v2/posts
```

→ Postman
**Authorization** - Basic Auth
**Body** - raw - JSON

## JWT

Necesitamos un token que nos represente (como logeado) en la app (sin nuestras credenciales)

👉 https://excalidraw.com/#json=7jKgRoCJniUvR5I-6gvD6,oCqJa8TA3Mn960oagaOb2A

👉 Activte "JWT Auth Pro WP REST API"

/Users/juanmanuelgarrido/PROJECTS/2025/wcg2025-demos/react-wp-jwt-demo
👉 npm run dev 

📺 Open dual screens demo <> diagram

- https://www.jwt.io/

👉 GET a endpoint que requiere autenticación
```bash
curl -H "Authorization: Bearer TU_TOKEN_JWT" \
  https://wcg2025-demo.wp.local/wp-json/wp/v2/users/me
```

👉 POST
```bash
curl -X POST \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi contenido con JWT Token",
    "content": "<p>Este es un contenido importante usando JWT Token</p>"
  }' \
  https://wcg2025-demo.wp.local/wp-json/wp/v2/posts
```


## OAuth2

No queremos que nuestra third party app toque las credenciales


👉 Activte "OAuth2 Auth Pro WP REST API" (deactivate JWT plugin)

https://excalidraw.com/#json=YUZbGnsF5Qi6r3Mv38ul9,_jxLpNIysnU9lW8H__ciqg


- https://www.freeformatter.com/url-parser-query-string-splitter.html