# Guión del test de tareas · IA que explica

Diseño de Futuros (UTDT) · TUTOR 2040 · versión del 11 de noviembre de 2026

Este test evalúa una sola cosa: el tutor de IA que explica y ayuda a aprender. El participante no recorre la escuela: está sentado en su mesa del aula-taller, con las gafas puestas, y hace seis tareas cortas. Es un modo aparte del test de mundo libre (que está en [`guion.md`](guion.md)) y se elige en la misma pantalla de preparación, con el botón **«Test de tareas · IA que explica»**.

Las tareas son **autoguiadas**: la persona las hace sola, sin que nadie intervenga. Lee las instrucciones, sigue las consignas que aparecen en pantalla, pasa de tarea sola y al final ve un agradecimiento. Alrededor de las tareas hay una charla corta antes (intro y preguntas previas) y otra después (preguntas finales y cierre), como en cualquier test de usabilidad. Si nadie puede acompañar, las preguntas se mandan como formulario.

Las respuestas del tutor están escritas de antemano: no usa la IA real ni la clave de Gemini. Así todos los participantes ven lo mismo y el test no depende de la conexión con el modelo.

## Objetivo

Queremos validar con estudiantes de secundaria si el tutor de las gafas sirve para **aprender algo que no entienden**: si se les ocurre pedirle una explicación, si pueden manejarla a su ritmo, si los ayuda a destrabarse sin resolverles el ejercicio y si pueden callarlo cuando quieren pensar solos.

En concreto, queremos aprender:

- **Pedir una explicación:** si se les ocurre pedirle al tutor que les explique algo, y con qué palabras.
- **Moverse dentro de la explicación:** si encuentran cómo pausar, repetir, ir más despacio, girar o acercar, y qué prefieren (voz, botones, mirada).
- **Repreguntar:** si se animan a preguntar algo en el medio sin miedo a perder el hilo, y si notan que la explicación retoma sola.
- **Ayuda en un ejercicio:** si piden ayuda cuando se traban, cómo toman que el tutor dé pistas y no la respuesta, y cuántas pistas necesitan.
- **Sugerencias que no pidieron:** si las ven, si las aceptan o las descartan, y si las sienten ayuda o interrupción.
- **Que el tutor no interrumpa:** si saben cómo silenciarlo un rato y cómo volver.

Queda afuera todo lo social (compañeros, docente, pizarrón compartido) y la escuela como espacio: eso lo mide el test de mundo libre. Si un participante comenta sobre eso, se anota pero no se profundiza.

## Hipótesis

Cada hipótesis dice en qué tarea se ve y qué dato de los resultados la confirma o la descarta. Los datos salen del archivo de resultados (ver «Resultados», al final); lo cualitativo, de la planilla del observador o del formulario.

| # | Creemos que… | Tarea | Cómo se confirma |
| --- | --- | --- | --- |
| H1 | La mayoría le pide la explicación al tutor por voz en menos de un minuto, sin buscar un menú. | 1 | `tiempo_hasta_logro_s` menor a 60 y `detalle_auto` «Lo pidió por voz». |
| H2 | Para manejar la explicación prefieren hablar («pará», «repetí», «más despacio») antes que tocar los botones del costado. | 2 | En `controles_corazon`, más controles «(voz)» que «(boton)». |
| H3 | Se animan a preguntar en el medio de la explicación y notan que retoma sola, sin pedírselo. | 3 | Tarea 3 en «ok» (no «parcial») y comentario en la pregunta final 3. |
| H4 | Cuando se traban piden ayuda antes de los dos minutos. Al principio les molesta que no les den la respuesta, pero llegan al resultado con dos pistas o menos. | 4 | `tiempo_hasta_logro_s`, `pistas_pedidas` ≤ 2 y `pidio_la_respuesta`. |
| H5 | Ven la sugerencia que no pidieron y la aceptan si están trabados; la sienten una ayuda, no una interrupción. | 5 | `sugerencias_aceptadas` frente a `sugerencias_descartadas`, y pregunta final 5. |
| H6 | Saben callar al tutor por voz («no me interrumpas») sin buscar en menús, y entienden cómo volver a escucharlo. | 6 | Tarea 6 en «ok» con «por voz» en el detalle, y pregunta final 6. |

## Preparación

La pantalla de preparación es la misma del test de mundo libre (ver [`guion.md`](guion.md)). La deja lista quien arma la prueba:

1. Abrir el link en **Chrome**, con micrófono. Si se puede, usar **auriculares**: con parlantes el micrófono también oye al tutor (el test descarta ese eco, pero con auriculares no hay nada que descartar).
2. Escribir el nombre del participante: va en el archivo de resultados.
3. Voz, mirada y cámara se configuran como siempre. La clave de Gemini no hace falta.
4. Tener a mano la planilla del observador (al final) o el formulario con las preguntas.
5. Cuando el participante esté sentado y haya terminado la intro y las preguntas previas, elegir **«Test de tareas · IA que explica»**.

## Intro

Quien acompaña lee este texto. Si la persona hace la prueba sola, se le manda escrito junto con el link.

> ¡Gracias por venir! Me llamo [nombre]. Con mi grupo de Diseño de Futuros estamos imaginando cómo podría ser la escuela secundaria en 2040: unas gafas con un tutor de inteligencia artificial que te ayuda a aprender.
>
> Hoy queremos ver si ese tutor sirve de verdad cuando no entendés algo. No te evaluamos a vos: evaluamos las gafas. Si algo no sale, es un problema del diseño, no tuyo.
>
> Vas a hacer seis tareas cortas, de un par de minutos cada una. La consigna aparece arriba en la pantalla y, cuando terminás una, pasa sola a la siguiente. Yo no te voy a ayudar durante las tareas: hacé lo que harías si estuvieras solo. Si te trabás, podés pasar a la siguiente.
>
> Mientras lo hacés, decí en voz alta lo que pensás, aunque te parezca obvio. Al tutor le hablás empezando con «Tutor…».
>
> La prueba anota qué tareas cumpliste, cuánto tardaste y las frases que le dijiste al tutor, con tu nombre. Eso queda en esta compu y lo usamos solo nosotros para mejorar el diseño. [Si se graba:] ¿Puedo grabar la pantalla y el audio? Si en algún momento querés frenar, avisá y paramos.

[Si se graba, iniciar la grabación.]

## Preguntas previas

Para romper el hielo y entender el perfil de cada participante. Son pocas, para no cansar antes de las tareas.

1. ¿En qué año estás? ¿Qué materia te cuesta más?
2. Cuando no entendés algo en clase, ¿qué hacés? ¿Le preguntás al profe, a un compañero, buscás un video?
3. ¿Usás alguna inteligencia artificial, como ChatGPT o Gemini? ¿Para la escuela? ¿Para qué?
4. Cuando alguien te explica algo, ¿preferís que te den la respuesta o que te den pistas para llegar solo?

## Cómo lo vive la persona

1. **Instrucciones.** Aparece una pantalla «Antes de empezar» que explica en cinco puntos qué va a hacer: 6 tareas cortas, la consigna arriba, cómo hablarle al tutor (según la voz que haya en ese navegador), cómo mirar (según la mirada esté activada o no), que las tareas pasan solas y que no hay respuestas buenas ni malas. Con «Empezar» o Enter arranca la tarea 1 y empieza a correr su tiempo.
2. **Cada tarea.** Arriba hay una tarjeta blanca con el número de tarea, el escenario y la consigna. No muestra el nombre de la tarea, para no dar pistas. Cuando cambia de tarea, la tarjeta se anima para que se note. La pantalla de la mesa y la pastilla «Hoy» muestran la materia: Biología (el corazón) en las tareas 1 a 3 y Matemática (ecuaciones) de la 4 a la 6.
3. **Pasar de tarea.** Cuando la tarea termina, la tarjeta muestra «✓ Listo · sigue en 4» y a los cuatro segundos pasa sola a la siguiente (con «Siguiente →» se adelanta). Si la persona se traba, puede tocar «Pasar a la siguiente» en la tarjeta o decir «siguiente tarea»: la tarea queda anotada como salteada.
4. **Fin.** Después de la tarea 6 aparece «¡Terminaste las 6 tareas!» con un agradecimiento. Ahí siguen las preguntas finales.

Cuándo se considera terminada cada tarea para pasar a la siguiente está en cada tarea, abajo («Pasa a la siguiente»). Es un poco más exigente que el éxito: por ejemplo, en la tarea 1 alcanza con abrir la explicación para cumplirla, pero pasa a la siguiente recién cuando la explicación termina.

## Si alguien acompaña

Quien acompaña observa y anota en la planilla, sin ayudar durante las tareas. Si la persona pregunta algo, se le responde «¿Vos qué harías?» y se retoma en el cierre.

El panel del moderador está escondido: se abre y se cierra con **Shift + M**. Muestra las tareas con su escenario y su consigna, cuál está en curso, si se cumplió, los tiempos, las pistas, las frases de voz entendidas y no entendidas, las teclas y los botones de descarga. Desde ahí se puede marcar cada tarea a mano (sola, con empujón o no), saltar a cualquier tarea y, si el reconocimiento de voz falla, disparar con su tecla lo que la persona dijo (todas son Shift + tecla). Está en la misma pantalla que ve la persona: conviene abrirlo solo entre tareas o al final.

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

## Preguntas finales

Después de la pantalla final. Pedir ejemplos concretos de lo que vivieron. Si la persona hizo la prueba sola, van en el formulario.

1. En una palabra, ¿cómo te sentiste con el tutor?
2. ¿Se te ocurrió enseguida pedirle que te explique el corazón? ¿Qué esperabas que pasara?
3. Cuando preguntaste qué era el ventrículo, ¿sentiste que perdías la explicación? ¿Te diste cuenta de que siguió donde estaba?
4. En el ejercicio, ¿qué te pareció que no te diera la respuesta? ¿Las pistas te ayudaron o te frustraron?
5. Cuando el tutor te sugirió algo sin que se lo pidieras, ¿lo sentiste como ayuda o como interrupción? ¿Por qué?
6. ¿Cómo hiciste para que no te interrumpiera? ¿Sabrías cómo volver a escucharlo?
7. ¿Preferís hablarle o tocar botones? ¿En qué momento te entendió mal?
8. Comparado con preguntarle a un profe o buscar un video, ¿qué tiene de mejor y de peor?
9. ¿Lo usarías para estudiar? ¿Para qué materia o tema?
10. Del 1 al 5, ¿qué tan fácil fue usar el tutor? ¿Y qué tan útil te pareció para entender?

## Cierre y registro

> ¡Muchas gracias! Todo lo que nos contaste nos ayuda a mejorar el tutor. ¿Te quedó alguna duda de las que dejamos para el final?

Si alguien observaba, ahora puede preguntar. Después, detener la grabación y descargar los resultados (ver abajo).

**Planilla del observador** (una copia por participante). Anotar arriba: participante, edad, año, fecha, si usó auriculares o parlantes y si la mirada estaba activada. Los tiempos, pistas y frases ya los anota la prueba: la planilla es para lo que la prueba no ve.

| Tarea | ¿Lo logró? (solo / con empujón / no) | Cómo lo hizo (voz, botón, mirada) | Frases textuales | Gestos o dudas |
| --- | --- | --- | --- | --- |
| 1 · Pedir una explicación | | | | |
| 2 · Moverse dentro de la explicación | | | | |
| 3 · Repreguntar | | | | |
| 4 · Trabarse en un ejercicio | | | | |
| 5 · Una sugerencia que no pidió | | | | |
| 6 · Que el tutor no interrumpa | | | | |

Anotar también las respuestas a la pregunta final 10 (los dos números del 1 al 5) y cualquier comentario sobre que el tutor no dé la respuesta. Si se usó el panel, la marca de cada tarea (sola, con empujón, no) queda también en el archivo de resultados.

## Frases de voz previstas

El tutor entiende por palabras clave, sin tildes ni mayúsculas, y tolera variantes. No hace falta decir «Tutor» primero para los pedidos claros. Mientras el tutor habla, los pedidos cortos («pará», «¿qué es…?», «repetí», «no me interrumpas») lo cortan. Lo que el micrófono oye del propio tutor por los parlantes se descarta, para que no se conteste solo.

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

**Se guardan solos.** Mientras la persona hace las tareas, la prueba guarda lo que va pasando en ese navegador, cada pocos segundos y también si se cierra o se recarga la pestaña. No hace falta descargar nada antes de cerrar.

Para bajarlos:

- **Durante o al final de la sesión:** Shift + M abre el panel. «Descargar esta sesión» baja dos archivos con el nombre del participante y la fecha. Si Chrome bloquea la segunda descarga, «Solo JSON» baja únicamente el JSON.
- **Después, o si se cerró la pestaña:** abrir el link de nuevo en la misma compu y el mismo navegador. En la pantalla de preparación aparece **«Resultados guardados del test de tareas»**, con la lista de sesiones: cada una se baja por separado y **«Descargar todas · un CSV»** junta a todos los participantes en una sola tabla, una fila por tarea y por participante.

Las sesiones quedan solo en ese navegador de esa compu: si la prueba se hace en varias compus, hay que bajar los resultados de cada una. Si se borran los datos del navegador, se pierden.

Qué traen los archivos:

- **CSV** (separado por punto y coma, se abre en Excel o en Google Sheets): una fila por tarea con el participante, la fecha, si terminó la sesión, el estado automático, el detalle, si la salteó, la marca del moderador (si alguien acompañó), los intentos, el tiempo hasta cumplirla y el tiempo total, las pistas, las sugerencias (mostradas, aceptadas, descartadas y retenidas por el foco), los controles y preguntas del corazón, y cuántas frases entendió y cuántas no. Abajo, una tabla por ejercicio y la lista de frases de voz con el segundo y la tarea.
- **JSON** con todo lo anterior y además el registro crudo de eventos, segundo a segundo.
