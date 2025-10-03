# Demo WC Galicia 2025 (Notes)

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

→ Postman

## JWT

- https://www.jwt.io/

## OAuth2

- https://www.freeformatter.com/url-parser-query-string-splitter.html