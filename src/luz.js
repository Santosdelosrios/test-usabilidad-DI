import * as THREE from 'three';

// Dos momentos del día de Lu. Mañana: clase. Tarde: salida, la escuela-nodo encendida.
// Brújula del mundo: norte = +Z (la entrada mira al norte), este = −X, oeste = +X.
// La mañana es ~9:30 de un día de noviembre a ~33° S: sol al ENE, a 52° de altura.
export const LUCES = {
  manana: {
    nombre: 'Mañana',
    sol: [-0.9, 1.25, 0.33], solColor: '#fff0dc', solInt: 3.9,
    hemiCielo: '#dfe8f2', hemiSuelo: '#bcb5a9', hemiInt: 0.62,
    cieloArriba: '#86a2bf', cieloHorizonte: '#e7e5df', halo: 1,
    niebla: '#e4e3df', nieblaCerca: 90, nieblaLejos: 380,
    entorno: 0.3, exposicion: 1.0,
    interior: 1.0, emisivo: 1.0, fachada: 0,
  },
  tarde: {
    nombre: 'Tarde',
    sol: [0.93, 0.21, -0.3], solColor: '#ffb07a', solInt: 2.6,
    hemiCielo: '#a6b2c4', hemiSuelo: '#8c8176', hemiInt: 0.42,
    cieloArriba: '#6a7f9c', cieloHorizonte: '#f1c9a2', halo: 1.8,
    niebla: '#e6c8ab', nieblaCerca: 70, nieblaLejos: 320,
    entorno: 0.22, exposicion: 1.06,
    interior: 1.9, emisivo: 1.35, fachada: 1,
  },
};

export function aplicarLuz(nombre, { world, scene, renderer }) {
  const p = LUCES[nombre];
  const dir = new THREE.Vector3(...p.sol).normalize();
  const sun = world.sun;
  sun.position.copy(sun.target.position).addScaledVector(dir, 140);
  sun.color.set(p.solColor);
  sun.intensity = p.solInt;
  world.hemi.color.set(p.hemiCielo);
  world.hemi.groundColor.set(p.hemiSuelo);
  world.hemi.intensity = p.hemiInt;
  const u = world.skyU;
  u.top.value.set(p.cieloArriba);
  u.bottom.value.set(p.cieloHorizonte);
  u.sunDir.value.copy(dir);
  u.sunCol.value.set(p.solColor);
  u.sunGlow.value = p.halo;
  scene.fog.color.set(p.niebla);
  scene.fog.near = p.nieblaCerca;
  scene.fog.far = p.nieblaLejos;
  scene.environmentIntensity = p.entorno;
  renderer.toneMappingExposure = p.exposicion;
  world.rects.forEach((l) => (l.intensity = l.userData.base * p.interior));
  world.emisivos.forEach((e) => (e.mat.emissiveIntensity = e.base * p.emisivo));
  world.fachadaLuz.visible = p.fachada > 0;
  world.fachadaLuz.material.color.setScalar(2.4 * p.fachada);
  renderer.shadowMap.needsUpdate = true;
  return p;
}
