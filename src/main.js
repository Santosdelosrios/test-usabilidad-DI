import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { N8AOPass } from 'n8ao';
import { buildWorld } from './world.js';
import { Navigator, STOPS } from './nav.js';
import { UI } from './ui.js';
import { aplicarLuz, LUCES } from './luz.js';
import { buildVida } from './vida.js';
import { HUD } from './hud.js';
import { Tareas } from './tareas.js';
import { aplicarCSS, cargar, setTipo, tipoActual } from './tipos.js';
import { redibujarTextos } from './textures.js';
import { Voz } from './voz.js';
import { Camara } from './camara.js';
import { Cerebro } from './ia.js';
import { TareasIA, sesionesGuardadas, instalarGuardadas, abrirGuardadas } from './tareas-ia.js';

// Acabado de imagen: leve desaturación, sombras frías, viñeta y grano (como las fotos del moodboard)
const Acabado = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uGrano: { value: 0.035 }, uVineta: { value: 0.32 }, uFoco: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uRes; uniform float uGrano; uniform float uVineta; uniform float uFoco;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      float sat = max(max(c.r, c.g), c.b) - min(min(c.r, c.g), c.b);
      c.rgb = mix(vec3(l), c.rgb, mix(0.86, 1.0, smoothstep(0.25, 0.5, sat)));
      c.rgb += vec3(-0.010, -0.002, 0.012) * (1.0 - smoothstep(0.0, 0.6, l));
      vec2 d = vUv - 0.5; d.x *= uRes.x / uRes.y;
      c.rgb *= 1.0 - uVineta * smoothstep(0.42, 1.05, length(d));
      // modo foco: la periferia se calma (menos color, menos luz)
      float per = smoothstep(0.16, 0.85, length(d)) * uFoco;
      float l2 = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      c.rgb = mix(c.rgb, vec3(l2), per * 0.75);
      c.rgb *= 1.0 - per * 0.4;
      float n = hash(floor(vUv * uRes) + fract(uTime * 7.13) * 91.7) - 0.5;
      c.rgb += n * uGrano * (0.6 + 0.4 * (1.0 - l));
      gl_FragColor = c;
    }`,
};

async function start() {
  aplicarCSS();
  try { await cargar(); } catch (e) { /* sigue con fuentes del sistema */ }

  const canvas = document.getElementById('mundo');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    document.getElementById('carga-estado').textContent = 'Este navegador no puede mostrar el mundo 3D (WebGL no disponible).';
    return;
  }
  const q = new URLSearchParams(location.search);
  // Calidad: arranca en media y se ajusta sola según cómo responde la compu
  const CALIDADES = {
    alta: { pr: 1.5, post: true, ao: 'Medium', aoHalf: false, bloom: true, smaa: true, sombra: 4096 },
    media: { pr: 1, post: true, ao: 'Performance', aoHalf: false, bloom: true, smaa: true, sombra: 3072 },
    baja: { pr: 1, post: false, sombra: 2048 },
    minima: { pr: 0.75, post: false, sombra: 2048 },
  };
  const ORDEN = ['alta', 'media', 'baja', 'minima'];
  let calidad = CALIDADES[q.get('calidad')] ? q.get('calidad') : 'media';
  let calidadAuto = !q.has('calidad') && !q.has('fijo');
  let usarPost = true;
  const prDe = (c) => (c.pr < 1 ? c.pr : Math.min(window.devicePixelRatio || 1, q.has('pr') ? +q.get('pr') : c.pr));
  let pr = prDe(CALIDADES[calidad]);
  renderer.setPixelRatio(pr);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false; // el sol y la arquitectura no se mueven: la sombra se calcula una vez
  renderer.shadowMap.needsUpdate = true;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;

  const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.05, 1600);
  const world = buildWorld(scene);
  world.sun.shadow.mapSize.set(CALIDADES[calidad].sombra, CALIDADES[calidad].sombra);
  world.root.updateMatrixWorld(true);
  // la ciudad y el mobiliario no se mueven: congelamos matrices
  world.root.traverse((o) => { o.matrixAutoUpdate = false; o.updateMatrix(); });
  const vida = buildVida({ scene, world, camera });

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(pr);
  composer.setSize(window.innerWidth, window.innerHeight);
  const ao = new N8AOPass(scene, camera, window.innerWidth, window.innerHeight);
  ao.configuration.aoRadius = 1.6;
  ao.configuration.distanceFalloff = 0.6;
  ao.configuration.intensity = 2.6;
  ao.configuration.gammaCorrection = false;
  ao.setQualityMode('Performance'); // (el modo de media resolución de N8AO no es compatible con esta versión de three)
  composer.addPass(ao);
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2), 0.36, 0.5, 1.7);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const smaa = new SMAAPass();
  composer.addPass(smaa);
  const acabado = new ShaderPass(Acabado);
  composer.addPass(acabado);
  const fijarRes = () => acabado.uniforms.uRes.value.set(window.innerWidth * pr, window.innerHeight * pr);
  fijarRes();

  // luz del día
  let luzActual = q.get('luz') === 'tarde' ? 'tarde' : 'manana';
  aplicarLuz(luzActual, { world, scene, renderer });
  const cambiarLuz = (nombre) => {
    if (nombre === luzActual || !LUCES[nombre]) return;
    const velo = document.getElementById('velo');
    velo.classList.add('on');
    setTimeout(() => {
      luzActual = nombre;
      aplicarLuz(nombre, { world, scene, renderer });
      ui.setLuz(nombre);
      velo.classList.remove('on');
    }, 260);
  };

  const nav = new Navigator({ camera, dom: canvas, scene, root: world.root, labelsEl: document.getElementById('etiquetas') });
  nav.pickables = world.pick;
  const ui = new UI({ nav, plan: world.plan, camera });
  const hud = new HUD({ nav, vida, world, camera, acabado, scene });
  const tareas = new Tareas({ hud, nav });
  nav.on('stop', (s) => hud.llegar(s));

  // Prueba (lo que ve Lu) vs Revisión (explorar el mundo como diseñador)
  let modo = 'revision';
  const botonModo = document.getElementById('modo');
  const capa = document.querySelector('.capa');
  function setModo(m) {
    modo = m;
    const prueba = m === 'prueba';
    capa.classList.toggle('fuera', prueba);
    hud.setVisible(prueba);
    document.getElementById('tarea').hidden = !prueba || !tareas.activa && tareas.el.num.textContent !== 'Fin';
    botonModo.textContent = prueba ? 'Revisión · H' : 'Volver a la prueba · H';
  }
  // al volver de Revisión, las gafas siguen a la cámara (pudo cambiar mientras tanto)
  function alternarModo() {
    setModo(modo === 'prueba' ? 'revision' : 'prueba');
    if (modo === 'prueba' && hud.camaraActiva && cam.estado) (cam.estado === 'con' ? hud.ponerGafas() : hud.quitarGafas());
  }
  botonModo.addEventListener('click', alternarModo);
  window.addEventListener('keydown', (e) => { if (e.code === 'KeyH' && !e.repeat) alternarModo(); });
  // ── preparación del moderador: voz, mirada, cámara, propuestas ──
  const intro = document.getElementById('intro');
  const $ = (id) => document.getElementById(id);
  const voz = new Voz({ hud, nav });
  voz.iniciar().then(() => { $('prep-voz').textContent = voz.describir(); $('prep-probar').disabled = !voz.modo; });
  const cerebro = new Cerebro({ hud, nav, voz });
  const pintarIA = () => { $('prep-ia-txt').textContent = cerebro.describir(); $('prep-clave').hidden = cerebro.backend === 'claude'; };
  cerebro.iniciar().then(() => { if (cerebro.clave) $('prep-clave').value = cerebro.clave; pintarIA(); });
  $('prep-clave').addEventListener('change', () => { if (cerebro.backend !== 'claude') cerebro.setClave($('prep-clave').value); pintarIA(); });
  $('prep-ia').addEventListener('click', async () => {
    if (cerebro.backend !== 'claude') cerebro.setClave($('prep-clave').value);
    if (!cerebro.activo) return pintarIA();
    $('prep-ia-txt').textContent = 'Probando…';
    try { const r = await cerebro.probar(); $('prep-ia-txt').textContent = `${cerebro.describir()} El tutor contestó: «${r}»`; } catch (e) { $('prep-ia-txt').textContent = `No funcionó: ${e.message}`; }
  });
  let propuestas = true, mirar = true, proyFijo = '';
  document.querySelectorAll('#intro [data-proy]').forEach((b) => b.addEventListener('click', () => { proyFijo = b.dataset.proy; elegir('[data-proy]', b); }));
  const elegir = (sel, b) => document.querySelectorAll(`#intro ${sel}`).forEach((x) => x.classList.toggle('on', x === b));
  document.querySelectorAll('#intro [data-tts]').forEach((b) => b.addEventListener('click', () => { voz.hablaTutor = b.dataset.tts === '1'; elegir('[data-tts]', b); }));
  document.querySelectorAll('#intro [data-mir]').forEach((b) => b.addEventListener('click', () => { mirar = b.dataset.mir === '1'; elegir('[data-mir]', b); }));
  document.querySelectorAll('#intro [data-prop]').forEach((b) => b.addEventListener('click', () => { propuestas = b.dataset.prop === '1'; elegir('[data-prop]', b); }));
  $('prep-probar').addEventListener('click', () => {
    $('prep-oido').textContent = 'Escuchando… decí algo como «Tutor, llevame al taller»';
    voz.probar((t) => { $('prep-oido').textContent = t; });
  });
  const chip = $('cam-chip');
  const cam = new Camara({
    alCambiar: (e) => {
      chip.textContent = e === 'con' ? 'Cámara · con gafas' : 'Cámara · sin gafas';
      chip.classList.toggle('con', e === 'con');
      if (modo !== 'prueba' || !hud.camaraActiva) return;
      if (e === 'con') hud.ponerGafas(); else hud.quitarGafas();
    },
    alInfo: (i) => {
      $('prep-cam-estado').textContent = i.txt;
      const cv = $('prep-caja'), g = cv.getContext('2d');
      g.clearRect(0, 0, cv.width, cv.height);
      if (i.cara && i.caja && cam.fuente.width) {
        const k = cv.width / cam.fuente.width;
        g.strokeStyle = i.estado === 'con' ? '#e8743b' : '#ecebe7'; g.lineWidth = 2;
        g.strokeRect(i.caja.x * k, i.caja.y * k, i.caja.width * k, i.caja.height * k);
      }
      if (hud.camaraActiva && !i.cara) chip.textContent = 'Cámara · no te veo';
    },
  });
  window.__cam = cam;
  if (!Camara.disponible()) { $('prep-cam').disabled = true; $('prep-cam-txt').textContent = 'Este navegador no tiene cámara disponible.'; }
  else if (window.claude && window.claude.use) {
    // dentro de claude.ai el visor bloquea la cámara: se usa la versión local
    $('prep-cam').disabled = true;
    $('prep-cam-txt').textContent = 'Dentro de claude.ai la cámara está bloqueada. Para detectar las gafas con la cámara, abrí el archivo del test en Chrome. Acá, el participante puede decir «me saco las gafas» o se usa la tecla G.';
  }
  $('prep-cam').addEventListener('click', async () => {
    $('prep-cam').disabled = true;
    $('prep-cam-caja').hidden = false;
    const ok = await cam.activar($('prep-video'));
    if (!ok) { $('prep-cam-txt').textContent = cam.error; $('prep-cam-caja').hidden = true; $('prep-cam').disabled = false; return; }
    $('prep-sin').disabled = $('prep-con').disabled = false;
  });
  const muestra = async (cual, b) => {
    const txt = b.textContent;
    b.disabled = true;
    b.textContent = cual === 'sin' ? 'Grabando sin gafas…' : 'Grabando con gafas…';
    const n = await cam.calibrar(cual, 3);
    b.disabled = false;
    b.textContent = `${txt.split(' · ')[0]} ✓ (${n})`;
  };
  $('prep-sin').addEventListener('click', () => muestra('sin', $('prep-sin')));
  $('prep-con').addEventListener('click', () => muestra('con', $('prep-con')));
  function empezar() {
    if (intro.hidden) return;
    intro.hidden = true;
    ui.hideHint();
    hud.setNombre($('prep-nombre').value);
    hud.setAjuste('sugerencias', propuestas);
    hud.setMirada(mirar);
    const conCamara = cam.activa && !!cam.modelo;
    if (cam.activa) $('cam-oculta').appendChild($('prep-video'));
    hud.setCamara(conCamara);
    if (cam.activa && !conCamara) cam.apagar(); // sin calibrar no sirve: que no gaste
    chip.hidden = !conCamara;
    if (cerebro.backend !== 'claude') cerebro.setClave($('prep-clave').value);
    cerebro.historia = [];
    setModo('prueba');
    tareas.empezar(1, { saltar: true });
    // mundo libre: sin tarjeta de tareas ni pasos; queda el itinerario del día
    document.body.classList.add('libre');
    hud.libre = true;
    hud.proyFijo = proyFijo || null;
    if (conCamara && cam.estado === 'sin') setTimeout(() => hud.quitarGafas(), 400);
    voz.encender();
  }
  $('intro-prueba').addEventListener('click', empezar);
  // Test de tareas · IA que explica: sentado en su mesa, con un tutor guionado (no usa la clave de Gemini)
  let tareasIA = null;
  function empezarTareasIA() {
    if (intro.hidden) return;
    intro.hidden = true;
    ui.hideHint();
    hud.setNombre($('prep-nombre').value);
    hud.setMirada(mirar);
    const conCamara = cam.activa && !!cam.modelo;
    if (cam.activa) $('cam-oculta').appendChild($('prep-video'));
    hud.setCamara(conCamara);
    if (cam.activa && !conCamara) cam.apagar();
    chip.hidden = !conCamara;
    tareasIA = new TareasIA({ hud, nav, scene, camera, world });
    tareasIA.empezarSesion();
    setModo('prueba');
    if (conCamara && cam.estado === 'sin') setTimeout(() => hud.quitarGafas(), 400);
    voz.encender();
  }
  $('intro-tareas-ia').addEventListener('click', empezarTareasIA);
  // resultados del test de tareas que quedaron guardados en este navegador (aunque se haya cerrado la pestaña)
  instalarGuardadas($('moderador'));
  {
    const n = sesionesGuardadas().length, b = $('intro-resultados');
    if (n) { b.hidden = false; b.textContent = `Resultados guardados del test de tareas · ${n}`; }
    b.addEventListener('click', () => abrirGuardadas($('moderador')));
  }
  $('intro-libre').addEventListener('click', () => { intro.hidden = true; setModo('revision'); });
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Enter' && e.code !== 'NumpadEnter') return;
    if (!intro.hidden) { e.preventDefault(); empezar(); return; }
    // el moderador pasa a la tarea siguiente con Enter
    const sig = $('t-sig');
    if (modo === 'prueba' && sig && !sig.hidden && sig.offsetParent) { e.preventDefault(); sig.click(); }
  });
  ui.setLuz(luzActual);
  ui.onLuz = (n) => cambiarLuz(n);
  async function cambiarTipo(k) {
    await setTipo(k);
    redibujarTextos();
    vida.redibujarTextos();
    ui.setTipo(k);
    if (ui.redibujarBase) ui.redibujarBase();
  }
  ui.onTipo = (k) => cambiarTipo(k);
  ui.setTipo(tipoActual());
  window.addEventListener('keydown', (e) => { if (e.code === 'KeyL') cambiarLuz(luzActual === 'manana' ? 'tarde' : 'manana'); });
  const pedida = STOPS.find((s) => s.id === (location.hash || '').slice(1));
  nav.goTo((pedida || STOPS[0]).id, { instant: true });
  if (pedida) setModo('revision'); else intro.hidden = false;

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    fijarRes();
  }
  window.addEventListener('resize', resize);

  function aplicarCalidad(n, manual = false) {
    if (!CALIDADES[n]) return;
    if (manual) calidadAuto = n === 'auto';
    calidad = n;
    const c = CALIDADES[n];
    pr = prDe(c);
    renderer.setPixelRatio(pr);
    composer.setPixelRatio(pr);
    usarPost = c.post;
    if (c.post) {
      ao.setQualityMode(c.ao);
      bloom.enabled = c.bloom;
      smaa.enabled = c.smaa;
    }
    const sh = world.sun.shadow;
    if (sh.mapSize.x !== c.sombra) {
      sh.mapSize.set(c.sombra, c.sombra);
      if (sh.map) { sh.map.dispose(); sh.map = null; }
      renderer.shadowMap.needsUpdate = true;
    }
    resize();
    ui.setCalidad && ui.setCalidad(calidadAuto ? 'auto' : n);
  }
  ui.onCalidad = (n) => { if (n === 'auto') { calidadAuto = true; ui.setCalidad('auto'); } else aplicarCalidad(n, true); };
  aplicarCalidad(calidad);
  ui.setCalidad && ui.setCalidad(calidadAuto ? 'auto' : calidad);

  // calidad automática: mide el tiempo real de cada cuadro y baja (o sube una vez) según haga falta
  const perf = { n: 0, acc: 0, ventanas: 0, saltar: 30 };
  function adaptar(dtReal) {
    if (!calidadAuto) return;
    if (perf.saltar > 0) { perf.saltar--; return; }
    if (dtReal > 0.25) return; // pestaña en segundo plano
    perf.n++; perf.acc += dtReal;
    if (perf.n < 45) return;
    const ms = (perf.acc / perf.n) * 1000;
    perf.n = 0; perf.acc = 0; perf.ventanas++;
    const i = ORDEN.indexOf(calidad);
    if (ms > 30 && i < ORDEN.length - 1) { aplicarCalidad(ORDEN[i + 1]); perf.saltar = 20; }
    else if (ms < 11 && perf.ventanas === 1 && calidad === 'media') { aplicarCalidad('alta'); perf.saltar = 20; }
  }

  const timer = new THREE.Timer();
  const captura = q.has('captura');
  let first = true, tSim = 0;
  function step(dt) {
    tSim += dt;
    nav.update(dt, tSim);
    for (const f of world.tick) f(tSim, dt);
    vida.tick(tSim, dt);
    hud.update(dt, tSim);
    if (tareasIA) tareasIA.update(dt, tSim);
    acabado.uniforms.uTime.value = tSim;
    if (usarPost) composer.render(dt);
    else renderer.render(scene, camera);
    if (hud.capturaPendiente) {
      hud.capturaPendiente = false;
      try {
        const c = document.createElement('canvas');
        c.width = 320; c.height = 200;
        const src = renderer.domElement;
        const sw = Math.min(src.width, src.height * 1.6), sh = sw / 1.6;
        c.getContext('2d').drawImage(src, (src.width - sw) / 2, (src.height - sh) / 2, sw, sh, 0, 0, 320, 200);
        hud.recibirCaptura(c.toDataURL('image/jpeg', 0.72));
      } catch (e) { hud.recibirCaptura(null); }
    }
    if (modo === 'revision') ui.draw();
    if (first) {
      first = false;
      const carga = document.getElementById('carga');
      carga.classList.add('fuera');
      setTimeout(() => carga.remove(), 900);
    }
  }
  function frame() {
    timer.update();
    const d = timer.getDelta();
    step(Math.min(d, 0.1));
    if (!captura) adaptar(d);
    requestAnimationFrame(frame);
  }
  // compilar los materiales antes del primer cuadro evita el tirón inicial
  document.getElementById('carga-estado').textContent = 'Preparando la escuela-nodo';
  try { await renderer.compileAsync(scene, camera); } catch (e) { /* sigue igual */ }
  if (captura) step(1 / 60);
  else requestAnimationFrame(frame);

  window.__hilo = { cerebro, voz, cam, cambiarTipo, nav, camera, renderer, scene, ao, ui, world, vida, hud, tareas, get tareasIA() { return tareasIA; }, setModo, bloom, aplicarCalidad, calidad: () => calidad, cambiarLuz, luz: (n) => { luzActual = n; aplicarLuz(n, { world, scene, renderer }); ui.setLuz(n); }, listo: true, stops: STOPS, step: (n = 1, dt = 1 / 60) => { for (let i = 0; i < n; i++) step(dt); } };
}

start();
