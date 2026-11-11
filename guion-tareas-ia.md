# Guión del test de tareas · IA que explica

Diseño de Futuros (UTDT) · TUTOR 2040 · rama `tareas-ia`

Este test evalúa una sola cosa: el tutor de IA que explica y ayuda a aprender. El participante no recorre la escuela: está sentado en su mesa del aula-taller, con las gafas puestas, y hace seis tareas cortas. Es un modo aparte del test de mundo libre (que está en [`guion.md`](guion.md)) y se elige en la misma pantalla de preparación.

Es **autoguiado**: la persona lo hace sola, sin moderador. Lee las instrucciones, sigue las consignas que aparecen en pantalla, pasa de tarea sin que nadie intervenga y al final descarga los resultados. Si alguien la acompaña, tiene un panel de respaldo escondido (Shift + M).

Las respuestas del tutor están escritas de antemano: no usa la IA real ni la clave de Gemini. Así todos los participantes ven lo mismo y el test no depende de la conexión con el modelo.

## Qué queremos aprender

- **Pedir una explicación:** si se les ocurre pedirle al tutor que les explique algo, y con qué palabras.
- **Moverse dentro de la explicación:** si encuentran cómo pausar, repetir, ir más despacio, girar o acercar, y qué prefieren (voz, botones, mirada).
- **Repreguntar:** si se animan a preguntar algo en el medio sin miedo a perder el hilo, y si notan que la explicación retoma sola.
- **Ayuda en un ejercicio:** si piden ayuda cuando se traban, cómo toman que el tutor dé pistas y no la respuesta, y cuántas pistas necesitan.
- **Sugerencias que no pidieron:** si las ven, si las aceptan o las descartan, y si las sienten ayuda o interrupción.
- **Que el tutor no interrumpa:** si saben cómo silenciarlo un rato y cómo volver.

## Preparación

La pantalla de preparación es la misma del test de mundo libre (ver [`guion.md`](guion.md)). La deja lista quien arma la prueba, o la misma persona:

1. Escribir el nombre del participante: va en el archivo de resultados.
2. Voz, mirada y cámara se configuran como siempre. La clave de Gemini no hace falta.
3. Elegir **«Test de tareas · IA que explica»**.

## Cómo lo vive la persona

1. **Instrucciones.** Aparece una pantalla «Antes de empezar» que explica en cinco puntos qué va a hacer: 6 tareas cortas, la consigna arriba, cómo hablarle al tutor (según la voz que haya en ese navegador), cómo mirar (según la mirada esté activada o no), que las tareas pasan solas y que no hay respuestas buenas ni malas. Con «Empezar» o Enter arranca la tarea 1 y empieza a correr su tiempo.
2. **Cada tarea.** Arriba hay una tarjeta blanca con el número de tarea, el escenario y la consigna. No muestra el nombre de la tarea, para no dar pistas. Cuando cambia de tarea, la tarjeta se anima para que se note.
3. **Pasar de tarea.** Cuando la tarea termina, la tarjeta muestra «✓ Listo · sigue en 4» y a los cuatro segundos pasa sola a la siguiente (con «Siguiente →» se adelanta). Si la persona se traba, puede tocar «Pasar a la siguiente» en la tarjeta o decir «siguiente tarea»: la tarea queda anotada como salteada.
4. **Fin.** Después de la tarea 6 aparece «¡Terminaste las 6 tareas!» con el botón «Descargar resultados».

Cuándo se considera terminada cada tarea para pasar a la siguiente está en cada tarea, abajo («Pasa a la siguiente»). Es un poco más exigente que el éxito: por ejemplo, en la tarea 1 alcanza con abrir la explicación para cumplirla, pero pasa a la siguiente recién cuando la explicación termina.

## Si alguien acompaña (opcional)

El panel del moderador sigue disponible, escondido: se abre y se cierra con **Shift + M**. Muestra las tareas con su escenario y su consigna, cuál está en curso, si se cumplió, los tiempos, las pistas, las frases de voz entendidas y no entendidas, las teclas y los botones de descarga. Desde ahí se puede marcar cada tarea a mano (sola, con empujón o no), saltar a cualquier tarea y, si el reconocimiento de voz falla, disparar con su tecla lo que la persona dijo (todas son Shift + tecla). Está en la misma pantalla que ve la persona: conviene abrirlo solo entre tareas o al final.

## Las seis tareas

### 1 · Pedir una explicación

- **Escenario:** En Biología están viendo el sistema circulatorio y no terminás de entender cómo funciona el corazón.
- **Consigna:** Usá las gafas para entender cómo funciona el corazón.
- **Éxito:** abre la explicación del corazón. El panel anota si fue por voz, con un botón o con la tecla del moderador.
- **Qué pasa:** sobre la mesa aparece un corazón esquemático flotante, con las cuatro cavidades, las venas cavas, la arteria pulmonar, las venas pulmonares, la aorta y los pulmones. La sangre son partículas: azul con poco oxígeno por el lado derecho hacia los pulmones, roja desde los pulmones por el lado izquierdo hasta la aorta. El tutor lo explica en nueve pasos, de a una oración, y en cada paso se ilumina la parte que nombra.
- **Qué observar:** si le habla al tutor sin dudar o busca un menú. Qué palabras usa. Cuánto tarda en pedirlo.
- **Pasa a la siguiente:** cuando la explicación termina (o la cierra). Si la pausa y no sigue, pasa igual al minuto y cuarto.
- **Tecla de respaldo, si alguien acompaña:** Shift + C.

### 2 · Moverse dentro de la explicación

- **Escenario:** La animación va rápido y no llegaste a ver por dónde entra la sangre.
- **Consigna:** Averiguá por dónde entra la sangre al corazón y a dónde va después.
- **Éxito:** usa pausar, repetir, girar, acercar o «más despacio», o pregunta por dónde entra o a dónde va, o dice la respuesta («entra por las venas cavas a la aurícula derecha»). La consigna no nombra ningún control a propósito.
- **Qué pasa:** si la explicación no estaba en marcha, arranca de nuevo. Al costado del corazón hay botones (Pausar, Repetir, Más despacio, Girar, Acercar, Cerrar) que también se eligen con la mirada.
- **Qué observar:** qué control busca primero (voz, botones, mirada). Si nota los botones. Si llega a la respuesta.
- **Pasa a la siguiente:** cuando, además de cumplirla, llegó a ver a dónde va la sangre: preguntó «¿y a dónde va después?», dijo la respuesta, o la explicación pasó por los pulmones o terminó. Si no, a los 45 segundos de cumplirla.
- **Teclas de respaldo, si alguien acompaña:** Shift + P, R, D, G, Z, E, A, X.

### 3 · Repreguntar

- **Escenario:** El tutor dijo «ventrículo» y no sabés qué es.
- **Consigna:** Averiguá qué es sin perder la explicación que estabas viendo.
- **Éxito:** pregunta por el ventrículo (o por otra parte) y la explicación vuelve a donde estaba. Si pregunta pero se pasa de tarea antes de que retome, queda «parcial».
- **Qué pasa:** al empezar la tarea, la explicación salta al paso del ventrículo derecho. Cuando pregunta, el tutor ilumina esa parte, contesta en una o dos oraciones y dice «Sigo donde estábamos». La respuesta tarda unos diez segundos.
- **Qué observar:** si pregunta sin miedo a perder el hilo. Si nota que la explicación retoma sola. Si la respuesta le alcanza.
- **Pasa a la siguiente:** tres segundos después de que la explicación retoma.
- **Teclas de respaldo, si alguien acompaña:** Shift + V (ventrículo), U (aurícula), O (aorta), L (válvula), K (venas cavas), Y (arteria pulmonar).

### 4 · Trabarse en un ejercicio

- **Escenario:** Estás resolviendo una ecuación para matemática y te trabaste en un paso.
- **Consigna:** Seguí con el ejercicio. Podés usar las gafas si te sirven.
- **Éxito:** pide ayuda y llega al resultado después de las pistas. Si lo resuelve sin pedir ayuda, queda «parcial».
- **Qué pasa:** se cierra el corazón y aparece un cuaderno con `3x + 5 = 20`. El participante dice en voz alta lo que haría. El tutor anota los pasos que entiende, tacha los equivocados y da pistas de a una cuando se las piden: primero qué mirar, después qué operación hacer y, por último, cómo quedaría. Nunca dice la respuesta, ni aunque se la pidan. Al llegar a `x = 5` le pide que lo compruebe. En esta tarea el tutor no sugiere nada por su cuenta: espera a que le pidan ayuda.
- **Qué observar:** cuánto tarda en pedir ayuda. Si pide la respuesta directa y cómo reacciona a que no se la den. Cuántas pistas usa.
- **Pasa a la siguiente:** cuando resuelve el ejercicio (con pistas o sin ellas) y contesta la pregunta de comprobación, o diez segundos después de resolverlo.
- **Teclas de respaldo, si alguien acompaña:** Shift + H (pide ayuda), 1 (primer paso), 2 (`3x = 15`), 3 (divide por 3), 4 (`x = 5`), 5 (lo comprobó), 0 (paso equivocado).

### 5 · Una sugerencia que no pidió

- **Escenario:** no hay escenario nuevo: la tarjeta solo dice que siga trabajando.
- **Consigna:** Seguí trabajando con el ejercicio.
- **Éxito:** ve la sugerencia del tutor y la acepta o la descarta. Si la ve pero no responde, queda «parcial».
- **Qué pasa:** aparece otro ejercicio, `2x − 4 = 10`. Si pasan 20 segundos sin avances, o si dice un paso equivocado, el tutor sugiere algo por su cuenta («¿Te ayudo? Fijate qué pasa con el − 4 cuando lo pasás al otro lado») con dos botones: «Dale» y «Ahora no». Si lo resuelve antes de ver una sugerencia, el tutor le ofrece otro ejercicio para practicar, también con «Dale» y «Ahora no».
- **Qué observar:** si nota la sugerencia, si la lee, si la acepta o la descarta y por qué. Si la siente ayuda o interrupción.
- **Pasa a la siguiente:** quince segundos después de responder la sugerencia, o cuando termina el ejercicio y lo comprueba.
- **Teclas de respaldo, si alguien acompaña:** Shift + S (el tutor sugiere ahora), 7 («Dale»), 8 («Ahora no»).

### 6 · Que el tutor no interrumpa

- **Escenario:** Querés pensar el ejercicio solo, sin que el tutor te diga nada.
- **Consigna:** Hacé que las gafas no te interrumpan por un rato.
- **Éxito:** activa el modo foco (por voz, con el menú o con la tecla F) o apaga la iniciativa del tutor en Ajustes.
- **Qué pasa:** aparece un tercer ejercicio, `5x − 3 = 12`, y el tutor sugiere algo cada 15 segundos sin avances (hasta tres veces). Con el foco activo no sugiere nada (el panel cuenta las sugerencias retenidas) y arriba a la izquierda aparece «Foco» con el tiempo. Se sale del foco por voz («ya podés hablar»), con el botón «Salir del foco» o con la tecla F.
- **Qué observar:** cómo intenta callar al tutor (voz, menú, foco). Si entiende que está en foco. Si sabe cómo volver.
- **Pasa a la siguiente:** cuando el foco lleva diez segundos activo (o cinco segundos después de apagar la iniciativa del tutor). Después aparece la pantalla final.
- **Tecla de respaldo, si alguien acompaña:** Shift + F.

## Frases de voz previstas

El tutor entiende por palabras clave, sin tildes ni mayúsculas, y tolera variantes. No hace falta decir «Tutor» primero para los pedidos claros. Mientras el tutor habla, los pedidos cortos («pará», «¿qué es…?», «repetí», «no me interrumpas») lo cortan.

| Para | Ejemplos |
| --- | --- |
| Abrir la explicación | «Tutor, explicame cómo funciona el corazón», «mostrame el corazón», «no entiendo el sistema circulatorio» |
| Pausar y seguir | «pará», «pausá», «esperá», «un momento», «stop» · «seguí», «continuá», «dale, seguí» |
| Repetir | «repetí», «otra vez», «¿qué dijiste?» · «desde el principio» repite todo |
| Velocidad | «más despacio», «va muy rápido», «más lento» · «velocidad normal», «más rápido» |
| Girar y acercar | «girálo», «dalo vuelta», «de costado» · «acercalo», «más grande», «zoom» · «alejalo», «más chico» |
| Cerrar | «cerralo», «ya entendí», «listo, gracias» |
| Preguntar por una parte | «¿qué es el ventrículo?», «¿qué es la aurícula?», «¿qué es la aorta?», «¿qué son las válvulas?», «¿qué son las venas cavas?», «¿qué es la arteria pulmonar?», «¿por qué es azul?» |
| Preguntar por el recorrido | «¿por dónde entra la sangre?», «¿y a dónde va después?» |
| Decir la respuesta | «entra por las venas cavas a la aurícula derecha», «va a los pulmones» |
| Pedir ayuda en el ejercicio | «no sé cómo seguir», «me trabé», «dame una pista», «ayudame», «¿qué hago?» · «dame la respuesta» (no la da) |
| Decir un paso | «paso el cinco restando», «resto cinco de los dos lados», «me queda tres x igual a quince», «divido por tres», «x es cinco», «x igual a cinco», «da quince» |
| Comprobar | «sí, da veinte» |
| Responder una sugerencia | «dale», «sí» · «ahora no», «no, gracias» |
| Silenciar al tutor | «no me interrumpas», «dejame pensar», «silencio un rato», «callate», «necesito concentrarme», «modo foco» |
| Volver a escucharlo | «ya podés hablar», «salí del foco», «volvé a ayudarme» |

Lo que no se entiende queda anotado en el panel como «sin acción», con la frase textual. Si el participante piensa en voz alta sin hablarle al tutor, también queda ahí.

## Teclas del moderador

Todas van con **Shift**, para no chocar con las teclas de las gafas. La misma lista está en el panel del moderador.

| Tecla | Qué hace |
| --- | --- |
| Shift + M | Abre o cierra el panel del moderador |
| Shift + N | Siguiente tarea (después de la 6, termina) |
| Shift + B | Tarea anterior |
| Shift + C | Abre o cierra el corazón («explicame cómo funciona el corazón») |
| Shift + P | Pausar o seguir |
| Shift + R | Repetir el paso |
| Shift + D | Más despacio o velocidad normal |
| Shift + G | Girar |
| Shift + Z | Acercar o alejar |
| Shift + E | «¿Por dónde entra la sangre?» |
| Shift + A | «¿Y a dónde va después?» |
| Shift + X | Dijo la respuesta («entra por las venas cavas») |
| Shift + V / U / O / L / K / Y | «¿Qué es…?»: ventrículo / aurícula / aorta / válvula / venas cavas / arteria pulmonar |
| Shift + H | Pide ayuda en el ejercicio (siguiente pista) |
| Shift + 1 / 2 / 3 / 4 | Dijo el primer paso / el resultado del primer paso / el segundo paso / el resultado |
| Shift + 5 | Dijo que lo comprobó |
| Shift + 0 | Dijo un paso equivocado |
| Shift + S | El tutor sugiere algo por su cuenta, ahora |
| Shift + 7 / 8 | Responde «Dale» / «Ahora no» |
| Shift + F | Activa o saca el foco («no me interrumpas») |

Las teclas de siempre siguen igual: G pone o saca las gafas, H pasa al modo revisión, F es el foco de las gafas y la barra espaciadora sirve para hablar en claude.ai.

## Resultados

El botón **«Descargar resultados»** de la pantalla final (también está en el panel de respaldo) baja dos archivos con el nombre del participante y la fecha. Conviene descargarlos antes de cerrar o recargar la página: no se guardan en otro lado.

- **CSV** (separado por punto y coma, se abre en Excel o en Google Sheets): una fila por tarea con el estado automático, el detalle, si la salteó, la marca del moderador (si alguien acompañó), los intentos, el tiempo hasta cumplirla y el tiempo total, las pistas, las sugerencias (mostradas, aceptadas, descartadas y retenidas por el foco), los controles y preguntas del corazón, y cuántas frases entendió y cuántas no. Abajo, una tabla por ejercicio y la lista de frases de voz con el segundo y la tarea.
- **JSON** con todo lo anterior y además el registro crudo de eventos, segundo a segundo.

Si Chrome bloquea la segunda descarga, el botón «Solo JSON» baja únicamente el JSON.
