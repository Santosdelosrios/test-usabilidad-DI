import * as THREE from 'three';
import * as T from './textures.js';

// Paleta del moodboard: negro · grafito · gris claro · naranja.
// Regla de la etapa 2: el naranja es el SISTEMA (nodo, umbral, antena, pizarrón). Nada más es naranja.
export const C = {
  negro: '#0b0c0e',
  grafito: '#2b2e33',
  gris: '#d0d2d6',
  naranja: '#e8743b',
  blanco: '#ecebe7',
  blancoTecho: '#e8e7e3',
  hormigon: '#d6d5d1',
  salvia: '#86917c',
  cielo: '#8fa9c2',
  horizonte: '#e6e4de',
  asfalto: '#55585d',
};

const std = (o) => new THREE.MeshStandardMaterial(o);

// "Modular": juntas de panel calculadas en espacio de mundo (sin texturas ni UVs).
export function panelizar(mat, size = [1.2, 1.2], ancho = 0.012, fuerza = 0.075) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uPanel = { value: new THREE.Vector2(size[0], size[1]) };
    sh.uniforms.uJunta = { value: new THREE.Vector2(ancho, fuerza) };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNor;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vec4 wpJ = vec4(transformed, 1.0);
        vec3 wnJ = objectNormal;
        #ifdef USE_INSTANCING
          wpJ = instanceMatrix * wpJ;
          wnJ = mat3(instanceMatrix) * wnJ;
        #endif
        vWPos = (modelMatrix * wpJ).xyz;
        vWNor = normalize(mat3(modelMatrix) * wnJ);`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWPos;
        varying vec3 vWNor;
        uniform vec2 uPanel;
        uniform vec2 uJunta;`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          vec3 an = abs(vWNor);
          vec2 pp = an.x > 0.6 ? vWPos.zy : (an.z > 0.6 ? vWPos.xy : vWPos.xz);
          vec2 g = abs(fract(pp / uPanel - 0.5) - 0.5) * uPanel;
          vec2 fw = fwidth(pp);
          vec2 l = 1.0 - smoothstep(vec2(uJunta.x * 0.5), vec2(uJunta.x * 0.5) + fw, g);
          float j = max(l.x, l.y) * clamp(1.0 - max(fw.x, fw.y) / (uJunta.x * 4.0), 0.0, 1.0);
          diffuseColor.rgb *= 1.0 - uJunta.y * j;
        }`);
  };
  mat.customProgramCacheKey = () => 'panel';
  return mat;
}

export function makeMaterials() {
  const M = {};
  // monolítico y modular
  M.muro = panelizar(std({ color: C.blanco, roughness: 0.9 }), [2.4, 2.1], 0.018, 0.11);
  M.muroInt = panelizar(std({ color: '#efeeea', roughness: 0.93 }), [1.2, 4.75], 0.014, 0.085);
  M.techo = panelizar(std({ color: C.blancoTecho, roughness: 1 }), [1.2, 1.2], 0.014, 0.075);
  M.muroLiso = std({ color: C.blanco, roughness: 0.9 });
  M.hormigon = std({ color: C.hormigon, roughness: 0.85 });
  M.blancoCalido = std({ color: '#e7e4de', roughness: 0.8 });
  // "Tron": blanco brillante con laca
  M.blancoBrillo = new THREE.MeshPhysicalMaterial({ color: '#f2f1ed', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 });
  M.blancoSatin = new THREE.MeshPhysicalMaterial({ color: '#efeee9', roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.45 });
  M.grafito = std({ color: C.grafito, roughness: 0.55 });
  M.grafitoSatin = new THREE.MeshPhysicalMaterial({ color: '#2d3035', roughness: 0.38, metalness: 0.2, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  M.grafitoMate = std({ color: '#33363b', roughness: 0.9 });
  M.negro = std({ color: C.negro, roughness: 0.5 });
  M.gris = std({ color: C.gris, roughness: 0.7 });
  // "Iron Man / concept sheet": plata
  M.plata = std({ color: '#cfd2d6', roughness: 0.26, metalness: 0.9 });
  M.metal = M.plata;
  M.vidrioOscuro = std({ color: '#121418', roughness: 0.08, metalness: 0.35 });
  M.pizarron = std({ color: '#0d0f12', roughness: 0.06, metalness: 0.2 });
  M.vidrio = new THREE.MeshStandardMaterial({ color: '#c9d3d9', roughness: 0.35, metalness: 0.0, transparent: true, opacity: 0.16, depthWrite: false });
  M.vidrioTinte = new THREE.MeshStandardMaterial({ color: '#56616b', roughness: 0.04, metalness: 0.3, transparent: true, opacity: 0.42, depthWrite: false });
  // el sistema
  M.naranja = std({ color: C.naranja, emissive: C.naranja, emissiveIntensity: 3.2, roughness: 0.4 });
  M.luz = std({ color: '#ffffff', emissive: '#fffaf1', emissiveIntensity: 2.6 });
  M.luzFria = std({ color: '#ffffff', emissive: '#eef4ff', emissiveIntensity: 2.6 });
  M.luzCalida = std({ color: '#ffffff', emissive: '#ffd9b0', emissiveIntensity: 2.2 });
  // naturaleza y textiles (neutros)
  M.planta = std({ color: C.salvia, roughness: 1, flatShading: true });
  M.plantaOscura = std({ color: '#6c7766', roughness: 1, flatShading: true });
  M.tronco = std({ color: '#7d766e', roughness: 1 });
  M.cesped = std({ color: '#98a28d', roughness: 1 });
  M.tela = std({ color: '#383b40', roughness: 1 });
  M.telaClara = std({ color: '#c8c6c0', roughness: 1 });
  M.telaArena = std({ color: '#aaa294', roughness: 1 });
  M.listones = std({ color: '#cbc8c1', roughness: 0.9 });
  M.asfalto = std({ color: C.asfalto, roughness: 0.95 });
  // ciudad-maqueta con pisos marcados
  M.ciudad = ['#dcdbd8', '#cfd0d1', '#c4c6c9', '#e3e1dc', '#a2a6ab'].map((c) => panelizar(std({ color: c, roughness: 0.95 }), [3.4, 3.3], 0.07, 0.12));
  // texturas procedurales
  M.pisoInt = (w, d) => std({ color: '#dddcd8', roughness: 0.42, map: T.hormigon(w / 4, d / 4) });
  M.pisoExt = (w, d) => std({ color: '#d4d2cc', roughness: 0.95, map: T.baldosas(w / 2.4, d / 2.4) });
  M.pisoTecnico = (w, d) => std({ color: '#c9cacc', roughness: 0.6, map: T.grilla(w / 0.6, d / 0.6) });
  M.frenteRack = std({ color: '#26292d', roughness: 0.6, map: T.perforado() });
  // "planetario / monolito": chapa perforada
  M.perfo = (rx = 1, ry = 1) => std({ color: '#ecebe8', roughness: 0.55, metalness: 0.25, map: T.perforadoClaro(rx, ry) });
  return M;
}
