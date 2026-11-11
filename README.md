# Test de usabilidad · TUTOR 2040

Prototipo navegable para el test de usabilidad de Diseño de Futuros (UTDT): unas gafas con tutor de IA en una escuela de 2040. El participante recorre la escuela en primera persona, le habla al tutor, elige un proyecto y lo hace con sus compañeros.

**Abrir el test:** https://santosdelosrios.github.io/test-usabilidad-DI/

- Abrirlo en Chrome, en una computadora con micrófono, cámara y parlantes.
- La primera vez, permitir el micrófono y la cámara.
- Para que el tutor converse libremente, pegar en la preparación una clave gratuita de Gemini (https://aistudio.google.com/apikey). La clave queda guardada solo en ese navegador: no está en este repositorio.
- La cámara solo se usa para saber si el participante tiene puestas las gafas: no guarda ni envía imágenes.

## Guión del test

El guión que lee el moderador está en [`guion.md`](guion.md): una sesión de unos 50 minutos con objetivo, hipótesis, preparación, intro, preguntas, escenario con el horario del día (la clase en la mesa primero), proyectos y planillas del observador. La referencia detallada de la clase está en [`guion-tareas-ia.md`](guion-tareas-ia.md).

**Por ahora el test es solo llegar a la escuela y hacer la clase en la mesa (las 6 tareas).** El proyecto, los mensajes de los compañeros y la docente y la presentación están apagados (`SOLO_CLASE` en `src/main.js`). Lo que dice el moderador está en [`guion-moderador.md`](guion-moderador.md).

## La clase en la mesa (tutor que explica)

Es lo primero del día en el recorrido libre: a las 9:30 el tutor le ofrece al participante sentarse en su mesa del aula-taller (o lo lleva hasta ahí). Sentado, hace seis consignas cortas: pedir que le expliquen el corazón (aparece en 3D sobre la mesa), moverse dentro de la explicación, repreguntar, resolver una ecuación con pistas, responder a una sugerencia del tutor y silenciarlo. Durante la clase el reloj de la escuela espera y el tutor tiene las respuestas escritas de antemano (no usa Gemini); al terminar, se levanta y sigue el recorrido. F8 la empieza en cualquier momento. Los resultados de la clase se guardan solos en el navegador (aunque se cierre la pestaña) y se descargan desde un panel escondido (Shift + M) o desde «Resultados guardados» en la pantalla de preparación, que también junta a todos los participantes en un solo CSV. El detalle de cada consigna, las frases de voz y las teclas están en [`guion-tareas-ia.md`](guion-tareas-ia.md).

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
| `src/tareas-ia.js`, `corazon.js`, `ejercicio.js` | La clase en la mesa: sentarse, las seis consignas, el panel del moderador y la vuelta al recorrido; el corazón en 3D y el ejercicio con pistas |

Teclas del moderador durante el test: F2 mensaje de Santi, F3 mensaje de Prof. Sosa, F4 corta o devuelve internet, F8 empieza la clase en la mesa, G pone o saca las gafas, H modo revisión. Durante la clase, las teclas del moderador van con Shift (la lista está en su panel y en `guion-tareas-ia.md`).
