# COSMO STREET

Sitio de e-commerce y lookbook para una marca de accesorios con estética urbana. El proyecto combina una tienda pública, una galería editorial y un panel de administración para gestionar productos, looks, configuración de la tienda y pedidos.

## Descripción general

COSMO STREET es una landing/storefront estática desarrollada con HTML, CSS y JavaScript vanilla. La interfaz principal permite:

- explorar productos por categoría
- buscar piezas por nombre o material
- agregar productos a favoritos y carrito
- calcular subtotal, envío y total
- abrir WhatsApp con el pedido
- navegar a una galería de looks (lookbook)

Además, incluye un panel admin protegido por contraseña para administrar:

- catálogo de productos
- looks
- configuraciones globales de la tienda
- ticker y hero principal
- drops / promociones
- pedidos y estructura de datos en Firestore

## Stack tecnológico

- HTML5
- CSS3
- JavaScript vanilla
- Firebase Hosting
- Firestore Database
- Firebase CLI

## Estructura del proyecto

```text
.
├── admin.css
├── admin.html
├── admin.js
├── 404.html
├── favicon.svg
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── index.css
├── index.html
├── index.js
├── lookbook.css
├── lookbook.html
├── lookbook.js
├── .firebaserc
├── .gitignore
└── README.md
```

## Funcionalidades principales

### Tienda pública
- Home con hero, categorías, ticker y colección destacada
- Navegación por categorías: collares, pulseras, aros y anillos
- Carrito con cantidad ajustable y cálculo de envío
- Lista de favoritos
- Búsqueda rápida de productos
- Botón de compra que redirige a WhatsApp con el resumen del pedido

### Lookbook
- Página separada para mostrar combinaciones visuales de productos
- Permite armar “looks” completos desde el panel admin
- Un mismo look puede incluir varios productos y accionarlos rápidamente al carrito

### Panel admin
- Auth simple con contraseña configurada la primera vez
- Gestión de productos en Firestore
- Configuración de tienda (WhatsApp, precios, ofertas, copia del hero)
- Administración de looks y drops
- Carga de categorías y ajustes visuales

## Requisitos

Necesitás:

- Node.js y npm (opcional, pero útil si usarás Firebase CLI)
- Firebase CLI
- Una cuenta de Firebase
- Un proyecto Firebase configurado

## Configuración local

### 1) Instalar Firebase CLI

```bash
npm install -g firebase-tools
```

### 2) Iniciar sesión

```bash
firebase login
```

### 3) Verificar el proyecto

El proyecto ya incluye un `.firebaserc` con el proyecto por defecto:

```json
{
  "projects": {
    "default": "cosmo-street"
  }
}
```

Asegurate de que ese proyecto exista en Firebase.

### 4) Ejecutar localmente

Como es una aplicación estática, podés servir la carpeta raíz con cualquier servidor HTTP local:

```bash
python -m http.server 8000
```

Luego abrí:

- `http://localhost:8000/` para la tienda
- `http://localhost:8000/admin.html` para el panel admin
- `http://localhost:8000/lookbook.html` para el lookbook

## Despliegue en Firebase

Desde la raíz del proyecto:

```bash
firebase deploy
```

Esto publicará el sitio con la configuración establecida en `firebase.json` y desplegará la base de Firestore usando las reglas y los índices definidos.

## Firebase y Firestore

La app usa colecciones como:

- `products`
- `looks`
- `drops`
- `config`
- `orders`

La estructura de reglas se define en `firestore.rules`.

El panel admin se encarga de crear o actualizar esos documentos desde la UI, y la tienda los consume para renderizar productos y contenido dinámico.

## Panel administrativo

### Primer acceso

1. Abrí `admin.html`
2. Si no hay contraseña configurada, se mostrará la pantalla de setup
3. Creá una contraseña de al menos 6 caracteres
4. La app guardará un hash SHA-256 en Firestore

### Uso

Una vez validado, se habilita la administración de:

- catálogo de productos
- hero principal
- ticker promocional
- lookbook
- drops / campañas
- configuración de envío y WhatsApp

## Nota de seguridad

Este proyecto está pensado como un prototipo/ejemplo y usa una estrategia simple de administrador con contraseña hash. Es suficiente para un proyecto personal o demo, pero para producción se recomienda migrar a autenticación de Firebase (Firebase Auth) con reglas de Firestore más estrictas y controles de permisos por rol.

## Personalización rápida

Puntos típicos para ajustar en este proyecto:

- número de WhatsApp en `index.js` y `admin.js`
- montos de envío (`freeShippingMin`, `shippingCost`)
- texto del hero y ticker desde el panel admin
- paleta visual y tipografías en `index.css` / `admin.css` / `lookbook.css`
- catálogo de productos desde Firestore o desde el panel admin

## Licencia

Proyecto de uso interno / personal. Revisa y ajusta la licencia según el uso final que le quieras dar al proyecto.

## Autor

COSMO STREET
