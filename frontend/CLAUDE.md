# CLAUDE.md – Frontend

---

## 0. Regla global inamovible

**NUNCA escribas tildes en ninguna palabra ni mensaje, sin importar el contexto.**

Correcto: "pagina", "validacion", "autenticacion", "navegacion", "funcion", "creacion".
Incorrecto: "página", "validación", "autenticación", "navegación", "función", "creación".

---

## 1. Empanadas UI – AI Agent Ruleset

Este archivo gobierna el agente que trabaja dentro de `frontend/`. Toda tarea de frontend debe respetar estas reglas antes de modificar cualquier archivo.

### Skills de referencia

| Skill | Cuando invocarla |
| --- | --- |
| `react-19` | Componentes, hooks, routing, reglas de React Compiler |
| `tailwind-4` | Clases Tailwind, tokens de diseno, responsive layouts |
| `typescript` | Tipos, interfaces, generics, strict mode |
| `zod-4` | Schemas de validacion (el proyecto usa Zod v3; aplica principios) |
| `ui-ux-pro-max` | Decisiones de diseno UI, look & feel, dashboards |
| `react-doctor` | Detectar problemas en React tras cambios importantes |
| `playwright` | Tests E2E |

---

## 2. Auto-invoke Skills

| Accion | Skill |
| --- | --- |
| Crear/modificar componentes React, hooks, routing | `react-19` |
| Trabajar con estilos Tailwind, tokens de color, responsive | `tailwind-4` |
| Disenar UI compleja, paneles, layouts | `ui-ux-pro-max` |
| Escribir tipos TypeScript, interfaces, generics | `typescript` |
| Agregar validaciones de formulario con Zod | `typescript` + `zod-4` |
| Revisar componentes React tras cambios importantes | `react-doctor` |
| Escribir o actualizar tests E2E | `playwright` |

---

## 3. Reglas criticas – No negociables

### React y estado

- SIEMPRE usar function components y hooks nativos.
- NUNCA usar `useMemo`/`useCallback` sin evidencia de problema de rendimiento; confiar en React Compiler.
- SIEMPRE obtener datos del servidor via TanStack Query; NUNCA guardar cache de API en `useState`.
- SIEMPRE manejar estados de loading, error y lista vacia en componentes que consumen queries.
- SIEMPRE llamar `invalidateQueries` en `onSuccess` de todas las mutaciones.

### Arquitectura y archivos

- SIEMPRE respetar la estructura de modulos: `menu/` para el menu publico, `admin/` para el panel, `shared/` solo para lo verdaderamente compartido.
- Mover logica a `shared/` SOLO si dos o mas modulos la necesitan; de lo contrario mantenerla local.
- NUNCA agregar logica especifica de un modulo dentro de `shared/`.
- SIEMPRE respetar la estructura interna de cada modulo: `components/`, `hooks/`, `helpers/`, `pages` a nivel raiz del modulo.

### TanStack Query

- SIEMPRE definir query keys por dominio siguiendo el patron `['recurso', 'scope']`:
  - `['categorias']` — menu publico
  - `['categorias', 'admin']` — panel admin
  - `['productos', 'admin']` — panel admin
- SIEMPRE invalidar `['categorias']` (sin scope) cuando cambia una categoria, para actualizar ambas vistas.
- NUNCA manipular el cache de TanStack Query manualmente si un `invalidateQueries` cubre el caso.

### Cliente Axios y contratos

- SIEMPRE usar la instancia `api` de `src/api/axios.ts` — nunca crear instancias de Axios adicionales.
- NUNCA hardcodear URLs absolutas; usar `config.apiUrl` de `src/config/env.ts`.
- SIEMPRE actualizar los tipos TypeScript locales cuando el backend cambia el shape de una respuesta.

### Estilos y UI

- La paleta del proyecto esta definida en `src/index.css` bajo `@theme`. Tokens principales:
  - `--color-terra: #C4522A` — color primario (botones, acciones)
  - `--color-espresso: #2C1208` — textos oscuros
  - `--color-cream: #FDF6EC` — fondo principal
  - `--color-sand: #F3E8D8` — fondo secundario
  - `--color-gold: #D4920A` — acentos
- SIEMPRE usar los tokens CSS definidos en `@theme` o clases Tailwind del proyecto. NUNCA usar inline styles con valores hex hardcodeados — usar clases Tailwind (`bg-terra`, `text-espresso`, etc.) para que los tokens se mantengan sincronizados.
- NUNCA introducir colores hex fuera de la paleta sin aprobacion.
- SIEMPRE verificar que el diseno sea responsive (menu publico en mobile, admin usable en tablet/desktop).
- SIEMPRE disenar mobile first: los estilos base aplican a mobile y se escalan hacia arriba con breakpoints (`sm:`, `md:`, `lg:`). Nunca disenar para desktop y adaptar hacia abajo. Toda pantalla debe tener version mobile y desktop funcionales.

### Routing y layout

- SIEMPRE registrar rutas nuevas en `App.tsx`.
- Rutas publicas: sin wrapper. Rutas admin: siempre dentro de `<ProtectedRoute>`.
- `AdminLayout.tsx` es el layout del panel admin — NUNCA duplicar su estructura en paginas individuales.
- `ProtectedRoute` lee `localStorage` directamente (no hay contexto global de auth) — no cambiar ese patron.

### Formularios y validacion

- SIEMPRE usar React Hook Form + Zod para formularios con mas de dos campos.
- SIEMPRE usar `z.coerce.number()` para campos numericos en formularios.
- SIEMPRE usar `FormData` (no JSON) en formularios de productos para soportar upload de imagen.
- NUNCA confiar solo en validacion UI; mantener coherencia con las restricciones del backend.

### Autenticacion

- El token JWT se guarda en `localStorage` bajo la key `empanadas_admin_token`.
- `useAuth` en `src/shared/hooks/` es el unico lugar que maneja login/logout.
- NUNCA leer ni escribir `empanadas_admin_token` fuera de `useAuth` y `ProtectedRoute`.

### Precios

- Los precios llegan del backend como `string` (Decimal de Prisma).
- SIEMPRE hacer `parseFloat(producto.precio)` antes de operar o mostrar con formato numerico.
- NUNCA asumir que el precio es un `number` directamente desde la API.

---

## 4. Arboles de decision

### ¿Donde va un componente nuevo?

```
¿Lo usa mas de un modulo?
  └─ SI  → src/shared/components/
  └─ NO  → ¿Es del menu publico?
               └─ SI  → src/menu/components/
               └─ NO  → src/admin/<recurso>/components/
                         (o src/admin/ si es compartido entre admin/categorias y admin/productos)
```

### ¿Donde va la logica nueva?

```
¿Necesita datos del servidor?
  └─ SI  → Hook en src/<modulo>/hooks/ usando TanStack Query
  └─ NO  → ¿Se reutiliza en multiples componentes?
               └─ SI  → src/shared/hooks/ (si es generica) o helper en <modulo>/helpers/
               └─ NO  → Mantenerla local en el componente
```

### ¿Necesito actualizar el menu publico tras una mutacion admin?

```
¿La mutacion afecta Categoria o Producto?
  └─ SI  → invalidateQueries({ queryKey: ['categorias'] })
            (invalida tanto el cache publico como el admin en cascada)
  └─ NO  → Solo invalidar el query key especifico del recurso modificado
```

### ¿Como manejar una imagen en el formulario de producto?

```
¿El usuario selecciono una imagen nueva?
  └─ SI  → Incluir como campo "foto" en FormData al enviar
  └─ NO  → No incluir el campo "foto" en FormData
           (el backend conserva la imagen existente si no llega campo nuevo)
```

### ¿Agregar una pagina nueva al panel admin?

```
1. Crear src/admin/<recurso>/<Recurso>Page.tsx
2. Crear src/admin/<recurso>/hooks/use<Recurso>.ts con TanStack Query
3. Componer UI desde componentes del modulo + shared si aplica
4. Registrar ruta en App.tsx dentro de <ProtectedRoute>
5. Verificar que AdminLayout.tsx incluya navegacion al nuevo recurso si corresponde
```

---

## 5. Tech Stack

| Componente | Tecnologia |
| --- | --- |
| Framework | React 19 |
| Build | Vite 6 |
| Lenguaje | TypeScript 5.8 |
| Estilos | Tailwind CSS 4 (plugin @tailwindcss/vite) |
| Server state | TanStack Query 5 |
| Routing | React Router 7 |
| HTTP | Axios 1.8 |
| Formularios | React Hook Form 7 + Zod 3 |
| Fuentes | Manrope (sans), Playfair Display (display) |

---

## 6. Estructura del proyecto

```
frontend/src/
├── App.tsx                      # Router raiz, registro de todas las rutas
├── main.tsx                     # Entry point React, QueryClientProvider
├── index.css                    # Tokens @theme de Tailwind (paleta, fuentes)
├── api/
│   └── axios.ts                 # Instancia Axios con interceptor JWT
├── config/
│   └── env.ts                   # Lee VITE_API_URL del entorno
├── shared/
│   ├── components/
│   │   ├── ProtectedRoute.tsx   # Redirige a /admin/login si no hay token
│   │   └── ImageUpload.tsx      # Componente reutilizable de upload de imagen
│   └── hooks/
│       └── useAuth.ts           # login(), logout(), isAuthenticated
├── menu/                        # Modulo publico (sin auth)
│   ├── MenuPage.tsx             # Pagina principal del menu
│   ├── components/
│   │   ├── CategoriaSection.tsx
│   │   ├── ProductoCard.tsx
│   │   ├── Carrito.tsx
│   │   └── FormularioPedido.tsx
│   ├── hooks/
│   │   ├── useMenu.ts           # TanStack Query: categorias + productos publicos
│   │   └── useCarrito.ts        # Estado local del carrito (no persiste)
│   └── helpers/
│       └── whatsapp.helper.ts   # Genera URL de pedido por WhatsApp
└── admin/                       # Modulo admin (requiere auth)
    ├── AdminLayout.tsx          # Layout con sidebar/nav para todas las paginas admin
    ├── LoginPage.tsx
    ├── DashboardPage.tsx
    ├── categorias/
    │   ├── CategoriasPage.tsx
    │   ├── CategoriaForm.tsx
    │   └── hooks/
    │       └── useCategorias.ts # TanStack Query CRUD de categorias
    └── productos/
        ├── ProductosPage.tsx
        ├── ProductoForm.tsx
        └── hooks/
            └── useProductos.ts  # TanStack Query CRUD de productos (con FormData)
```

### Query keys por dominio

| Key | Uso |
| --- | --- |
| `['categorias']` | Menu publico (sin auth) |
| `['categorias', 'admin']` | Panel admin — listado de categorias |
| `['productos', 'admin']` | Panel admin — listado de productos |

---

## 7. Comandos

```bash
npm install          # instalar dependencias
npm run dev          # Vite dev server → http://localhost:5173
npm run build        # tsc -b && vite build → dist/
npm run preview      # preview del build de produccion
```

No hay linter ni test runner configurado aun. Si se agrega ESLint: `npm run lint` debe pasar limpio antes de commits.

---

## 8. Checklist de QA antes de terminar una tarea

### Estado y datos
- [ ] Componentes con listas manejan estados: loading, error y lista vacia
- [ ] Mutaciones invalidan los query keys correctos en `onSuccess`
- [ ] Precios mostrados con `parseFloat()` aplicado antes de formatear

### Formularios
- [ ] Formularios con mas de dos campos usan React Hook Form + Zod
- [ ] Campos numericos usan `z.coerce.number()`
- [ ] Formulario de producto usa `FormData` si incluye imagen

### Autenticacion
- [ ] Rutas admin envueltas en `<ProtectedRoute>`
- [ ] Sin lecturas directas de `localStorage` fuera de `useAuth` y `ProtectedRoute`

### Estilos
- [ ] Colores nuevos usan tokens de `@theme` o valores de la paleta definida
- [ ] Paginas son usables en mobile (menu) y tablet/desktop (admin)

### Build y contratos
- [ ] `npm run build` pasa sin errores TypeScript
- [ ] Tipos actualizados si el backend cambio el shape de una respuesta
- [ ] Sin URLs absolutas hardcodeadas — usar `config.apiUrl`

### General
- [ ] Sin valores sensibles en codigo fuente
- [ ] Rutas nuevas registradas en `App.tsx`
- [ ] Smoke test manual del flujo modificado

---

## 9. Convenciones de nombres

| Elemento | Patron | Ejemplo |
| --- | --- | --- |
| Paginas | `<Modulo><Nombre>Page` o solo `<Nombre>Page` | `MenuPage`, `CategoriasPage` |
| Componentes | PascalCase | `ProductoCard`, `CategoriaForm` |
| Hooks | `use<Recurso>` o `use<Recurso><Accion>` | `useCategorias`, `useCarrito` |
| Query key publica | `['recurso']` | `['categorias']` |
| Query key admin | `['recurso', 'admin']` | `['productos', 'admin']` |
| Tipos de API | `<Recurso>Admin` o `<Recurso>` | `CategoriaAdmin`, `Producto` |
| Helpers | `<dominio>.helper.ts` | `whatsapp.helper.ts` |
| Instancia Axios | `api` (importar desde `src/api/axios.ts`) | `api.get(...)` |

---

## 10. Convenciones de API

### URLs base

- Base URL desde `config.apiUrl` (default `http://localhost:3000`)
- Prefijo de rutas: `/api/`

### Endpoints disponibles

| Metodo | Ruta | Auth | Descripcion |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | No | Login admin |
| GET | `/api/categorias` | No | Menu publico con productos |
| GET | `/api/admin/categorias` | JWT | Listado de categorias |
| POST | `/api/admin/categorias` | JWT | Crear categoria |
| PUT | `/api/admin/categorias/:id` | JWT | Editar categoria |
| GET | `/api/admin/productos` | JWT | Listado de productos |
| POST | `/api/admin/productos` | JWT | Crear producto (multipart/form-data) |
| PUT | `/api/admin/productos/:id` | JWT | Editar producto (multipart/form-data) |
| DELETE | `/api/admin/productos/:id` | JWT | Eliminar producto |

### Serializacion

- Precios: `string` (Decimal de Prisma) → siempre `parseFloat()` antes de usar
- Fechas: ISO 8601 string
- Booleanos desde FormData: el backend los recibe como string `"true"`/`"false"` — React Hook Form los envia correctamente con `z.preprocess`

### Ejemplo de respuesta de producto

```json
{
  "id": 1,
  "nombre": "Empanada de carne",
  "descripcion": "Con cebolla y huevo",
  "precio": "350.00",
  "precioUnidad": "40.00",
  "fotoUrl": "https://res.cloudinary.com/.../foto.jpg",
  "disponible": true,
  "orden": 1,
  "categoriaId": 2
}
```

### Soft delete

- `Categoria`: `activa: false` — no se elimina fisicamente
- `Producto`: `disponible: false` — no se elimina fisicamente
- El menu publico solo muestra categorias con `activa: true` y productos con `disponible: true`
