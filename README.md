# Zona Safari

Aplicación web hecha en Angular que usa la PokéAPI. La idea es simular la Zona Safari de los juegos de Pokémon: eliges un hábitat, te aparece un Pokémon salvaje y tienes que atraparlo con las balls que tienes en la mochila. Los Pokémon que atrapas se guardan en tu colección.

Página desplegada: https://zona-safari-pokeapi.vercel.app

Repositorio: https://github.com/eerickebl/zona-safari-pokeapi

## Funcionalidades

- Elegir uno de los 9 hábitats de la PokéAPI (pradera, bosque, cueva, mar, etc.).
- Buscar un Pokémon al azar del hábitat elegido. A veces puede salir shiny.
- Lanzar balls, rocas o cebos, o huir. La probabilidad de captura se calcula con la tasa de captura del Pokémon y la probabilidad de que huya con su velocidad.
- Mochila con un número limitado de balls y estadísticas de la partida.
- Pokédex con un formulario para buscar cualquier Pokémon por nombre o número y ver sus datos.
- Colección de los Pokémon atrapados (se guarda en el localStorage) con búsqueda, filtro por hábitat y orden.
- Mensajes de carga, de error y cuando no se encuentra un resultado.

## Endpoints utilizados

- `https://pokeapi.co/api/v2/pokemon-habitat` y `/pokemon-habitat/{nombre}`: lista de hábitats y los Pokémon que viven en cada uno.
- `https://pokeapi.co/api/v2/pokemon-species/{id}`: nombre en español, descripción, tasa de captura, hábitat y si es legendario.
- `https://pokeapi.co/api/v2/pokemon/{id}`: imágenes, tipos, estadísticas y el grito del Pokémon.
- `https://pokeapi.co/api/v2/item/{nombre}`: datos de las balls (nombre, imagen, descripción y precio).

## Cómo ejecutarlo

Se necesita tener instalado Node.js (versión 22.22, 24.15 o superior) y npm.

```
git clone https://github.com/eerickebl/zona-safari-pokeapi.git
cd zona-safari-pokeapi
npm install
npm start
```

Después abrir http://localhost:4200 en el navegador.

Para compilar el proyecto:

```
npm run build
```

## Autor

Erick Bermeo
