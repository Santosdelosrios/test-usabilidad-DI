# Test de usabilidad · TUTOR 2040

Prototipo navegable para el test de usabilidad de Diseño de Futuros (UTDT): unas gafas con tutor de IA en una escuela de 2040. El participante recorre la escuela en primera persona, le habla al tutor, elige un proyecto y lo hace con sus compañeros.

**Abrir el test:** https://santosdelosrios.github.io/test-usabilidad-DI/

- Abrirlo en Chrome, en una computadora con micrófono, cámara y parlantes.
- La primera vez, permitir el micrófono y la cámara.
- Para que el tutor converse libremente, pegar en la preparación una clave gratuita de Gemini (https://aistudio.google.com/apikey). La clave queda guardada solo en ese navegador: no está en este repositorio.
- La cámara solo se usa para saber si el participante tiene puestas las gafas: no guarda ni envía imágenes.

## Guión del test

El guión que lee el moderador está en [`guion.md`](guion.md): una sesión de unos 50 minutos con objetivo, hipótesis, preparación, intro, preguntas, escenario con el horario del día (la clase en la mesa primero), proyectos y planillas del observador. La referencia detallada de la clase está en [`guion-tareas-ia.md`](guion-tareas-ia.md).

**Por ahora el test es solo llegar a la escuela y hacer la clase en la mesa (las 7 tareas: Biología, Matemática y Arte).** El proyecto, los mensajes de los compañeros y la docente y la presentación están apagados (`SOLO_CLASE` en `src/main.js`). El micrófono abierto todo el tiempo («manos libres») está apagado: todo se elige con la mirada, y al tutor se le habla mirando su punto, una frase por vez, con Gemini (`VOZ_CONTROL` en `src/main.js` vuelve a prender el manos libres). Antes de entrar, una bienvenida explica las gafas y hace probar la mirada. Lo que dice el moderador está en [`guion-moderador.md`](guion-moderador.md).

Cambios después del test piloto (16/11):

- **Una sola regla para elegir: mirar y después mirar el punto.** Mirar algo elegible (botones, opciones del tutor, carteles, flechas del piso) solo lo marca y hace aparecer un punto naranja al costado; mirar ese punto 1 segundo lo elige (se llena el anillo y destella). Así se puede leer sin elegir sin querer. El punto nunca tapa el texto: va a la derecha, o a la izquierda, abajo o arriba si ahí hay otro botón. Mirar el borde izquierdo o derecho de la pantalla gira la cabeza.
- **Recorrido guiado** al conectarse las gafas: 3 carteles (progreso, tutor, línea naranja) antes del saludo.
- **Progreso personalizado** arriba a la izquierda, con el nombre del participante: llegar, sentarse, las consignas de cada materia (3 de Biología, 3 de Matemática y 1 de Arte), los 3 repasos y el porcentaje.
- **Al tutor se le habla** (`src/tutor-voz.js`): mirarlo y mirar su punto abre el micrófono para una sola frase (no queda escuchando). Gemini recibe el manual de todo lo que se puede hacer en la prueba, la situación del momento (dónde está, qué consigna, si el corazón o el cuaderno están abiertos, qué cartel hay) y la lista de acciones posibles ahora; entiende el pedido y lo hace (llevarlo a la mesa, abrir o pausar el corazón, preguntar por una parte, dar una pista, anotar el paso que dijo, aceptar una sugerencia, contestar un repaso, no interrumpir…) o dice que no se puede y qué sí. Mientras escucha y piensa, la explicación espera. La clave de Gemini se pega en la preparación y queda solo en ese navegador. Sin clave o sin micrófono, el tutor muestra las preguntas frecuentes.
- **Preguntas frecuentes del tutor** (`src/ayuda.js`, con «Ver preguntas» o, sin clave, al mirarlo): ofrece lo que se puede hacer en ese momento y las preguntas más útiles según el contexto (dónde está, si tiene gafas, qué consigna, si el corazón o el cuaderno están abiertos); «Otra pregunta…» muestra todas. Respuestas escritas, sin IA. Si se queda quieto antes de la clase, el tutor le vuelve a ofrecer ayuda (hasta 3 veces).
- **Repaso de 2 preguntas** al terminar cada materia (Biología, Matemática y Arte), con respuesta inmediata (qué eligió, cuál era la correcta y por qué).
- **Cambio de clase** entre materias, sin cartel ni botón: después del repaso de Biología se levanta solo, sigue la línea naranja de las gafas y se sienta en la mesa de atrás, donde ya está la pantalla de Matemática (unos diez segundos, sin tocar nada; `src/cambio-clase.js`). Lo mismo después del repaso de Matemática: cruza el pasillo hasta la mesa junto al perchero, donde es Arte.
- **Arte, al final (consigna 7, `src/arte.js`):** en las gafas aparece una lámina con su dibujo de un paisaje (horizonte al medio, árbol en el centro, colores apagados) y la consigna es mejorarlo antes de entregarlo. El tutor tira tips de composición de a uno (horizonte en un tercio, sacar el árbol del centro, contraste de color, profundidad), pedidos con «Pedir un tip» o solos si pasan 12 segundos sin pedir (salvo en «No me interrumpas»). Cada tip trae dos opciones para probar y una para dejarlo como estaba; mirar una opción muestra en el dibujo cómo quedaría y mirar su punto la elige. No hay respuestas correctas: el dibujo es suyo. Termina al entregarlo. Los resultados anotan cada tip (quién lo trajo, qué eligió, qué opciones miró antes) y cómo quedó el dibujo.
- Textos más claros: consignas de Matemática sin ambigüedad, qué pasa al sacarse y ponerse las gafas, cómo entrar a la escuela.
- Los resultados guardan también los repasos, las consultas al tutor (por voz: lo que dijo, qué entendió, qué hizo y si se pudo), y lo que pasó antes de sentarse.

## La clase en la mesa (tutor que explica)

Es lo primero del día en el recorrido libre: a las 9:30 el tutor le ofrece al participante sentarse en su mesa del aula-taller (o lo lleva hasta ahí). Sentado, hace siete consignas cortas: pedir que le expliquen el corazón (aparece en 3D sobre la mesa), moverse dentro de la explicación, repreguntar, resolver una ecuación con pistas, responder a una sugerencia del tutor, silenciarlo y, en Arte, mejorar un dibujo con los tips del tutor. Cada materia es en una mesa distinta del aula-taller. Durante la clase el reloj de la escuela espera. Las explicaciones, las pistas, los tips y las respuestas del tutor están escritas de antemano; Gemini solo interpreta lo que el participante le dice y elige qué hacer. En esta versión (`SOLO_CLASE`), al terminar aparece el cierre y la prueba termina. F8 la empieza en cualquier momento. Los resultados de la clase se guardan solos en el navegador (aunque se cierre la pestaña) y se descargan desde un panel escondido (Shift + M) o desde «Resultados guardados» en la pantalla de preparación, que también junta a todos los participantes en un solo CSV. El detalle de cada consigna, las frases de voz y las teclas están en [`guion-tareas-ia.md`](guion-tareas-ia.md).

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
| `src/mirada.js` | Mirada con el mouse: mirar marca, mirar el punto naranja 1 segundo elige |
| `src/tutor-voz.js` | Hablarle al tutor: escucha una frase, Gemini la interpreta con el manual y el contexto, y hace la acción o dice que no |
| `src/ayuda.js` | Ayuda del tutor según el contexto, recorrido guiado de las gafas y empujón si se queda quieto |
| `src/camara.js` | Detección de gafas puestas o sacadas con la cámara |
| `src/oculo.js` | Recorrido de la luz del sol por el hall |
| `src/tipos.js`, `ui.js`, `tareas.js` | Tipografías, modo revisión (tecla H) y restos de la versión guiada |
| `src/tareas-ia.js`, `corazon.js`, `ejercicio.js`, `arte.js`, `cambio-clase.js` | La clase en la mesa: sentarse, las siete consignas, el panel del moderador y la vuelta al recorrido; el corazón en 3D, el ejercicio con pistas, la lámina de Arte con los tips del tutor y el cambio de clase caminando a la mesa de la materia siguiente |

Teclas del moderador durante el test: F2 mensaje de Santi, F3 mensaje de Prof. Sosa, F4 corta o devuelve internet, F8 empieza la clase en la mesa, G pone o saca las gafas, H modo revisión. Durante la clase, las teclas del moderador van con Shift (la lista está en su panel y en `guion-tareas-ia.md`).
