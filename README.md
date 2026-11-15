# 🌿 Zona Safari · Angular + PokéAPI

Aplicación web interactiva desarrollada con **Angular 22** que consume **PokéAPI** para simular una expedición en la Zona Safari: el usuario elige un hábitat real, encuentra Pokémon salvajes al azar y decide cómo capturarlos. Cada lanzamiento tiene una probabilidad calculada con los datos de la especie (tasa de captura, velocidad, si es legendario) y con reglas implementadas en la propia aplicación.

> **Aplicación desplegada:** https://zona-safari-pokeapi.vercel.app
>
> **Repositorio:** https://github.com/eerickebl/zona-safari-pokeapi
>
> **Práctica 02** · Programación y Plataformas Web · Universidad Politécnica Salesiana (Cuenca)
> **Autor:** Erick Bermeo · **Docente:** Ing. Gabriel A. León Paredes, PhD.

## Propósito

PokéAPI entrega datos, pero no ejecuta mecánicas de juego. El propósito de la aplicación es **convertir esos datos en una experiencia con lógica propia**: la tasa de captura de `/pokemon-species` se transforma en una probabilidad real de éxito, la velocidad de `/pokemon` define la probabilidad de huida, los hábitats de `/pokemon-habitat` deciden qué Pokémon aparecen y los objetos de `/item` forman la mochila del jugador.

## Funcionalidades principales

| Página | Qué se puede hacer |
| --- | --- |
| **Inicio** (`/`) | Presentación, progreso de la Pokédex Safari (especies capturadas / total), reglas del juego y endpoints utilizados. |
| **Explorar** (`/explorar`) | Elegir uno de los 9 hábitats, caminar por la hierba para que aparezca un Pokémon al azar, ver su probabilidad de captura y de huida, lanzar **balls**, **rocas** o **cebos**, o huir. Animación de las sacudidas de la ball, bitácora de la expedición, estadísticas y mochila con unidades limitadas. Admite `?habitat=forest` en la URL. |
| **Guía de campo** (`/guia`) | Buscador con formulario reactivo, validaciones y autocompletado de las especies. Muestra la ficha del Pokémon (en español), su hábitat y una tabla con la probabilidad de captura con cada ball y en cada estado de ánimo. Admite `?q=pikachu` en la URL. |
| **Mi colección** (`/coleccion`) | Pokémon capturados (guardados en `localStorage`), filtros por nombre/número y hábitat, orden, detalle de cada captura y opción de liberar. |

Además:

- Mensajes de **carga** en cada consulta, **errores** de conexión con botón de reintento y **resultados inexistentes** (Pokémon que no existe en la Guía, hábitat inválido en la URL, filtros sin coincidencias, rutas inexistentes).
- 1 de cada 64 encuentros es **shiny** (se usan las imágenes shiny de `/pokemon`).
- Diseño adaptable a móviles, navegación accesible con teclado y textos en español.

## Endpoints de PokéAPI utilizados

Base: `https://pokeapi.co/api/v2`

| Endpoint | Ejemplo | Datos usados | Dónde se usa |
| --- | --- | --- | --- |
| `GET /pokemon-habitat` y `GET /pokemon-habitat/{nombre}` | `/pokemon-habitat/forest` | Lista de hábitats y especies que viven en cada uno. | Selector de hábitats, Pokémon aleatorio de cada encuentro, progreso por hábitat, total de la Pokédex Safari. |
| `GET /pokemon-species/{id o nombre}` | `/pokemon-species/25` | `capture_rate`, nombre, categoría y descripción en español, `is_legendary`, `is_mythical`, `habitat`, `generation`, `varieties`. | Fórmula de captura, regla de huida, ficha del Pokémon, búsqueda de la Guía (404 → "Pokémon no encontrado"). |
| `GET /pokemon/{id}` | `/pokemon/25` | Imágenes normales, shiny, animadas y oficiales, tipos, estadísticas base (PS, velocidad…), altura, peso y grito (`cries`). | Escena del encuentro, ficha, colección y probabilidad de huida (velocidad). |
| `GET /item/{nombre}` | `/item/ultra-ball` | Nombre en español, imagen, descripción y precio de compra (`prices`) de `safari-ball`, `poke-ball`, `great-ball` y `ultra-ball`. | Mochila, selector de ball, tabla de probabilidades y detalle de cada captura. |

Todas las peticiones pasan por `PokeApiService`, que guarda en caché las respuestas y las elimina si fallan para poder reintentar.

## Reglas de captura (lógica propia)

Basadas en la fórmula de captura de la 3.ª generación de los juegos. En la Zona Safari no se combate, por lo que el Pokémon siempre tiene los PS completos:

```
a = (tasa de captura × modificador de ánimo) × bono de la ball ÷ 3
b = 1048560 ÷ √(√(16711680 ÷ a))
P(captura) = (b ÷ 65536)^4          → la ball debe superar 4 comprobaciones (sacudidas)
P(huida por turno) = (5 % + velocidad ÷ 400 [+10 % si es legendario o mítico]) × modificador de ánimo
```

| Acción | Efecto (dura 1 a 5 turnos) |
| --- | --- |
| 🪨 Roca | Pokémon enojado: tasa de captura ×2 y huida ×2. |
| 🍓 Cebo | Pokémon comiendo: tasa de captura ×0,5 y huida ×0,5. |

Mochila inicial por expedición: 10 Safari Ball (×1,5), 15 Poké Ball (×1), 8 Super Ball (×1,5) y 4 Ultra Ball (×2).
El código de las reglas está en [`src/app/core/utils/captura.ts`](src/app/core/utils/captura.ts) y el estado del juego en [`src/app/core/services/safari.service.ts`](src/app/core/services/safari.service.ts).

## Tecnologías y conceptos de Angular aplicados

- Angular 22 con componentes *standalone*, detección de cambios OnPush (por defecto) y **signals** (`signal`, `computed`, `effect`, `input`, `output`, `viewChild`).
- **HttpClient** + RxJS (`forkJoin`, `switchMap`, `catchError`, `shareReplay`, `finalize`) para consumir la API REST.
- **Router** con carga diferida (`loadComponent`), títulos por ruta, ruta comodín 404 y *query params* enlazados a `input()` con `withComponentInputBinding`.
- **Formularios reactivos** (`FormGroup`, `FormControl`, `Validators`) en la Guía de campo.
- Comunicación entre componentes con `input()`/`output()` y servicios compartidos.
- *Pipe* propio (`porcentaje`) y nueva sintaxis de plantillas (`@if`, `@for`, `@let`).
- Persistencia en el navegador con `localStorage` (sin backend ni base de datos).

## Estructura del proyecto

```
src/app
├── app.ts / app.html / app.css      → cabecera, navegación y pie
├── app.config.ts / app.routes.ts     → proveedores (router, HttpClient) y rutas
├── core
│   ├── models     → interfaces de PokéAPI y modelos propios
│   ├── services   → PokeApiService, SafariService (juego), ColeccionService (capturas)
│   └── utils      → reglas de captura, mapeadores, catálogos en español, textos y errores
├── shared
│   ├── components → tipo-badge, barra-stat, cargando, mensaje-error, ficha-detalle
│   └── pipes      → porcentaje
└── pages
    ├── inicio
    ├── explorar   → selector-habitat, panel-encuentro, mochila
    ├── guia
    ├── coleccion
    └── no-encontrado
```

## Instalación y ejecución local

Requisitos: **Node.js** 22.22.3+ o 24.15+ y **npm**.

```bash
git clone https://github.com/eerickebl/zona-safari-pokeapi.git
cd zona-safari-pokeapi
npm install
npm start
```

Abrir `http://localhost:4200/`. Para generar la versión de producción:

```bash
npm run build
```

Los archivos quedan en `dist/zona-safari-pokeapi/browser`.

## Despliegue en Vercel

El repositorio incluye [`vercel.json`](vercel.json) con la configuración del proyecto Angular:

- Comando de compilación: `npm run build`
- Carpeta de salida: `dist/zona-safari-pokeapi/browser`
- Regla de reescritura a `index.html` para que las rutas (`/explorar`, `/guia`, `/coleccion`) funcionen al recargar.

Pasos: importar el repositorio de GitHub en [vercel.com/new](https://vercel.com/new), dejar el *framework* detectado como Angular y pulsar **Deploy**.

## Créditos

Datos e imágenes de [PokéAPI](https://pokeapi.co). Pokémon y sus nombres son marcas de Nintendo, Game Freak y Creatures. Proyecto académico sin fines de lucro.
