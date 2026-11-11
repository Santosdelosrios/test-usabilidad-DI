# Test de usabilidad · TUTOR 2040

Prototipo navegable para el test de usabilidad de Diseño de Futuros (UTDT): unas gafas con tutor de IA en una escuela de 2040. El participante recorre la escuela en primera persona, le habla al tutor, elige un proyecto y lo hace con sus compañeros.

**Abrir el test:** https://santosdelosrios.github.io/test-usabilidad-DI/

- Abrirlo en Chrome, en una computadora con micrófono, cámara y parlantes.
- La primera vez, permitir el micrófono y la cámara.
- Para que el tutor converse libremente, pegar en la preparación una clave gratuita de Gemini (https://aistudio.google.com/apikey). La clave queda guardada solo en ese navegador: no está en este repositorio.
- La cámara solo se usa para saber si el participante tiene puestas las gafas: no guarda ni envía imágenes.

## Guión del test

El guión para moderar las sesiones (objetivo, hipótesis, preparación, intro, preguntas, escenario, proyectos y planilla del observador) está en [`guion.md`](guion.md).

## Test de tareas · IA que explica

Es un segundo modo, para evaluar solo al tutor que explica y ayuda a aprender. Se abre desde la pantalla de preparación con el botón «Test de tareas · IA que explica». El participante empieza sentado en su mesa del aula-taller y hace seis tareas: pedir que le expliquen el corazón (aparece en 3D sobre la mesa), moverse dentro de la explicación, repreguntar, resolver una ecuación con pistas, responder a una sugerencia del tutor y silenciarlo. El tutor de este modo tiene las respuestas escritas de antemano: no usa la clave de Gemini. Es autoguiado: la persona lee las instrucciones, cada tarea pasa sola a la siguiente cuando se cumple (o la saltea si se traba) y al final ve un agradecimiento. Los resultados se descargan desde un panel escondido (Shift + M), que además marca las tareas, toma tiempos y tiene teclas de respaldo (Shift + tecla) por si alguien acompaña. El guión, las frases de voz y las teclas están en [`guion-tareas-ia.md`](guion-tareas-ia.md).

## Compilarlo

Hace falta [Node.js](https://nodejs.org) 18 o más nuevo.

```bash
git clone https://github.com/Santosdelosrios/test-usabilidad-DI.git
cd test-usabilidad-DI
npm install
npm run build     # genera index.html (una sola página, con todo adentro)
npm start         # compila y lo abre en http://localhost:8000
```

Abrir `index.html` con doble clic también funciona, pero Chrome pide el permiso del micrófono muy seguido; por eso conviene `npm start`.

Lo que se publica en el link es el `index.html` de la raíz, en las ramas `main` y `gh-pages`. Después de cambiar algo: `npm run build`, commit y push a las dos ramas.

## Dónde está cada cosa

| Archivo | Qué hace |
| --- | --- |
| `template.html` | El HTML y todo el CSS: preparación del moderador, interfaz de las gafas |
| `build.mjs` | Junta el código y las tipografías en un solo `index.html` |
| `src/main.js` | Arranque: 3D, calidad gráfica, pantalla de preparación |
| `src/world.js`, `palette.js`, `textures.js`, `luz.js` | La escuela en 3D (three.js), materiales y luz |
| `src/vida.js`, `personas.js` | Compañeros, docente, pizarrón, proyecciones |
| `src/nav.js`, `guia.js`, `zonas.js` | Caminar por la escuela, ruta en el piso, zonas |
| `src/hud.js` | La interfaz de las gafas: tutor, paneles, avisos, etiquetas |
| `src/proyectos.js` | Los cuatro proyectos que se pueden elegir y su lógica |
| `src/ia.js` | El tutor con IA: qué se le manda al modelo y qué acciones puede hacer |
| `src/voz.js` | Reconocimiento de voz, voz del tutor y de los compañeros |
| `src/mirada.js` | Mirada con el mouse (sostener la vista para elegir) |
| `src/camara.js` | Detección de gafas puestas o sacadas con la cámara |
| `src/oculo.js` | Recorrido de la luz del sol por el hall |
| `src/tipos.js`, `ui.js`, `tareas.js` | Tipografías, modo revisión (tecla H) y restos de la versión guiada |
| `src/tareas-ia.js`, `corazon.js`, `ejercicio.js` | Test de tareas · IA que explica: las seis tareas y el panel del moderador, el corazón en 3D y el ejercicio con pistas |

Teclas del moderador durante el test: F2 mensaje de Santi, F3 mensaje de Prof. Sosa, F4 corta o devuelve internet, G pone o saca las gafas, H modo revisión. En el test de tareas, las teclas del moderador van con Shift (la lista está en su panel y en `guion-tareas-ia.md`).
