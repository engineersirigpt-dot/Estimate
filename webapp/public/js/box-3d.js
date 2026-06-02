/**
 * Pornchai RFQ — 3D Box Template Viewer (Jarvis AI Holographic v2)
 * Three.js cinematic 3D with dimension lines, AI HUD, holographic effects
 */

window.Box3D = (function() {
'use strict';

// Multi-instance support: each container gets its own state
const _instances = new Map();
// Legacy globals — point to "active" instance for backward compat
let _scene, _camera, _renderer, _controls, _animId, _box, _container, _clock;
let _glowMeshes = [], _scanLine, _particles, _dimGroup, _hudOverlay;
let _rawW=0, _rawL=0, _rawD=0, _hasSize=false, _typeId=1, _fluteDir=null;

function cleanupInstance(containerId) {
  const inst = _instances.get(containerId);
  if (!inst) return;
  if (inst.animId) cancelAnimationFrame(inst.animId);
  if (inst.hudOverlay) inst.hudOverlay.remove();
  if (inst.renderer) { inst.renderer.dispose(); inst.renderer.domElement?.remove(); }
  if (inst.controls) inst.controls.dispose();
  _instances.delete(containerId);
}

function cleanup() {
  // Cleanup ALL instances
  for (const [id] of _instances) cleanupInstance(id);
  if (_animId) cancelAnimationFrame(_animId);
  _animId = null;
  _glowMeshes = []; _scanLine = null; _particles = null; _dimGroup = null;
  if (_hudOverlay) { _hudOverlay.remove(); _hudOverlay = null; }
  if (_renderer) { _renderer.dispose(); _renderer.domElement?.remove(); _renderer = null; }
  if (_controls) { _controls.dispose(); _controls = null; }
  _scene = null; _camera = null; _box = null; _clock = null;
}

function init(container, width, height) {
  // Cleanup only THIS container's previous instance (not all)
  const containerId = container.id || container.dataset?.boxId || ('box3d_' + Math.random().toString(36).slice(2));
  if (!container.id) container.id = containerId;
  cleanupInstance(containerId);
  _container = container;
  _clock = new THREE.Clock();

  _scene = new THREE.Scene();
  _scene.fog = new THREE.FogExp2(0x0a0520, 0.06);

  // Background
  const bgC = document.createElement('canvas');
  bgC.width = 512; bgC.height = 512;
  const ctx = bgC.getContext('2d');
  const grad = ctx.createRadialGradient(256, 200, 30, 256, 256, 450);
  grad.addColorStop(0, '#1e1145');
  grad.addColorStop(0.4, '#130d30');
  grad.addColorStop(1, '#050210');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  _scene.background = new THREE.CanvasTexture(bgC);

  _camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
  _camera.position.set(4, 3, 5);

  _renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  _renderer.setSize(width, height);
  _renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  _renderer.shadowMap.enabled = true;
  _renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  _renderer.toneMapping = THREE.ACESFilmicToneMapping;
  _renderer.toneMappingExposure = 1.3;
  container.innerHTML = '';
  container.appendChild(_renderer.domElement);
  _renderer.domElement.style.borderRadius = '10px';
  _renderer.domElement.style.cursor = 'grab';

  // Lighting — cinematic 5-point setup
  _scene.add(new THREE.AmbientLight(0x6040a0, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(5, 8, 4); key.castShadow = true;
  key.shadow.mapSize.set(2048,2048); key.shadow.bias = -0.0005;
  key.shadow.camera.near = 0.1; key.shadow.camera.far = 20;
  _scene.add(key);
  // Fill light (cool purple)
  _scene.add(new THREE.DirectionalLight(0xa78bfa, 0.7).translateX(-4).translateY(3).translateZ(-3));
  // Level 4: Environment map for realistic reflections (procedural)
  try {
    const pmremGen = new THREE.PMREMGenerator(_renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x1a1035);
    envScene.add(new THREE.AmbientLight(0xffffff, 0.3));
    envScene.add(new THREE.DirectionalLight(0xffffff, 0.8).translateX(3).translateY(5).translateZ(2));
    const envMap = pmremGen.fromScene(envScene, 0.04).texture;
    _scene.environment = envMap;
    pmremGen.dispose();
  } catch(e) { /* fallback: no env map */ }
  // Rim lights (cyan + purple + emerald)
  _scene.add(new THREE.PointLight(0x38bdf8, 0.6, 12).translateX(2).translateY(-1).translateZ(3));
  _scene.add(new THREE.PointLight(0x7c3aed, 0.4, 8).translateX(-3).translateY(2).translateZ(-2));
  _scene.add(new THREE.PointLight(0x6ee7b7, 0.3, 10).translateX(0).translateY(-1).translateZ(-4));
  // Under-glow (dramatic bottom light)
  _scene.add(new THREE.PointLight(0x7c3aed, 0.2, 6).translateY(-0.5));

  // Holo grid
  _scene.add(createHoloGrid());

  // Reflective floor (subtle mirror)
  const floorGeo = new THREE.PlaneGeometry(12, 12);
  const floorMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a0520, roughness: 0.15, metalness: 0.8,
    transparent: true, opacity: 0.4, side: THREE.DoubleSide,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI/2; floor.position.y = -0.005;
  floor.receiveShadow = true;
  _scene.add(floor);

  // Holographic scan beam (horizontal light plane that moves up/down)
  const scanGeo = new THREE.PlaneGeometry(4, 0.015);
  const scanMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { color: { value: new THREE.Color(0x38bdf8) }, opacity: { value: 0.6 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 color; uniform float opacity; varying vec2 vUv;
      void main(){ float a = smoothstep(0.0,0.3,vUv.x)*smoothstep(1.0,0.7,vUv.x); gl_FragColor = vec4(color, a*opacity); }`,
  });
  _scanLine = new THREE.Mesh(scanGeo, scanMat);
  _scanLine.rotation.x = Math.PI/2;
  _scanLine.position.y = 0.5;
  _scene.add(_scanLine);

  // Energy pulse rings (holographic floor rings)
  const ringColors = [0x7c3aed, 0x38bdf8, 0x6ee7b7, 0xa78bfa, 0x818cf8];
  for (let i = 0; i < 5; i++) {
    const rGeo = new THREE.TorusGeometry(1.2 + i*0.35, 0.004, 8, 80);
    const rMat = new THREE.MeshBasicMaterial({ color: ringColors[i], transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false });
    const rMesh = new THREE.Mesh(rGeo, rMat);
    rMesh.rotation.x = Math.PI/2;
    rMesh.position.y = 0.01 + i*0.004;
    rMesh.userData.isPulseRing = true;
    rMesh.userData.ringIdx = i;
    _scene.add(rMesh);
  }

  // Particles
  _particles = createParticles();
  _scene.add(_particles);

  // Rotating ring
  const ringGeo = new THREE.TorusGeometry(2.2, 0.005, 8, 80);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.25 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI/2; ring.position.y = 0.02;
  ring.userData.isRing = true;
  _scene.add(ring);

  // Orbit controls — SLOW rotation
  if (typeof THREE.OrbitControls !== 'undefined') {
    _controls = new THREE.OrbitControls(_camera, _renderer.domElement);
    _controls.enableDamping = true;
    _controls.dampingFactor = 0.05;
    _controls.autoRotate = true;
    _controls.autoRotateSpeed = 0.15; // ultra slow — gentle rotation
    _controls.maxPolarAngle = Math.PI * 0.8;
    _controls.minDistance = 2.5;
    _controls.maxDistance = 12;
    _controls.target.set(0, 0.5, 0);
  }

  // AI HUD overlay
  createHUD(container, width, height);
}

// === HUD (HTML overlay) ===
function createHUD(container, w, h) {
  container.style.position = 'relative';
  const hud = document.createElement('div');
  hud.style.cssText = `position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;overflow:hidden;border-radius:10px`;
  const cornerSize = '18px';
  const cornerColor = 'rgba(124,58,237,0.6)';
  const cornerStyle = (top, right, bottom, left, borderT, borderR, borderB, borderL) =>
    `position:absolute;${top!==null?'top:4px;':''}${right!==null?'right:4px;':''}${bottom!==null?'bottom:4px;':''}${left!==null?'left:4px;':''}width:${cornerSize};height:${cornerSize};${borderT?`border-top:2px solid ${cornerColor};`:''}${borderR?`border-right:2px solid ${cornerColor};`:''}${borderB?`border-bottom:2px solid ${cornerColor};`:''}${borderL?`border-left:2px solid ${cornerColor};`:''}`;

  hud.innerHTML = `
    <!-- Targeting corners -->
    <div style="${cornerStyle(1,null,null,1,1,0,0,1)}"></div>
    <div style="${cornerStyle(1,1,null,null,1,1,0,0)}"></div>
    <div style="${cornerStyle(null,null,1,1,0,0,1,1)}"></div>
    <div style="${cornerStyle(null,1,1,null,0,1,1,0)}"></div>
    <!-- Type badge -->
    <div style="position:absolute;top:8px;right:10px;text-align:right;max-width:calc(100% - 60px)">
      <div id="hud_type" style="font-size:10px;font-weight:700;color:#e9e0ff;font-family:monospace;text-shadow:0 0 10px rgba(233,224,255,0.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div>
    </div>
    <!-- Flute direction indicator -->
    <div id="hud_flute" style="position:absolute;bottom:28px;left:10px;pointer-events:none;font-family:monospace;font-size:9px;color:#d8b4fe;text-shadow:0 0 6px rgba(216,180,254,0.5)"></div>
    <!-- Dimension HUD bar -->
    <div id="hud_dims" style="position:absolute;bottom:6px;left:0;right:0;display:flex;justify-content:center;gap:20px;font-family:monospace"></div>
    <div style="position:absolute;bottom:6px;right:12px;font-size:7px;color:rgba(196,181,253,0.5);font-family:monospace;letter-spacing:1.5px;text-transform:uppercase">drag to rotate</div>
    <style>
      @keyframes hudPulse{0%,100%{opacity:0.6}50%{opacity:1}}
      @keyframes hudGlow{0%,100%{text-shadow:0 0 6px currentColor}50%{text-shadow:0 0 14px currentColor,0 0 20px currentColor}}
      @keyframes cornerPulse{0%,100%{border-color:rgba(124,58,237,0.4)}50%{border-color:rgba(124,58,237,0.9)}}
    </style>
  `;
  // Animate corners
  hud.querySelectorAll('div[style*="border-"]').forEach((el, i) => {
    if (i < 4) el.style.animation = `cornerPulse 3s ease-in-out ${i*0.5}s infinite`;
  });
  container.appendChild(hud);
  _hudOverlay = hud;
}

function updateHUD(typeId, sz) {
  const names = {1:'Reverse Tuck End',2:'Straight Tuck End',3:'TTSLB',4:'TTAB',5:'Tray ฝาครอบ',6:'Frame-Vue',7:'Four Corner',8:'Gable Top',9:'Sleeve',10:'Pillow Box',11:'Seal End',12:'Custom'};
  const el = document.getElementById('hud_type');
  if (el) el.innerHTML = `<span style="color:#a78bfa;font-size:9px;letter-spacing:0.5px">TYPE ${typeId}</span> <span style="color:#7dd3fc;font-size:10px;letter-spacing:0.5px">— ${names[typeId]||''}</span>`;

  const dims = document.getElementById('hud_dims');
  if (!dims) return;
  if (_hasSize) {
    const mkDim = (label, val, color, icon) => `
      <div style="text-align:center;background:rgba(10,5,32,0.5);border:1px solid ${color}33;border-radius:6px;padding:3px 10px;backdrop-filter:blur(4px)">
        <div style="font-size:7px;color:${color};opacity:0.8;letter-spacing:1.5px;text-transform:uppercase">${label}</div>
        <div style="font-size:15px;font-weight:800;color:${color};text-shadow:0 0 12px ${color};animation:hudGlow 3s ease-in-out infinite;letter-spacing:-0.5px">${val}<span style="font-size:8px;opacity:0.6;margin-left:2px">mm</span></div>
      </div>`;
    dims.innerHTML = mkDim('W', _rawW, '#d8b4fe') + mkDim('L', _rawL, '#7dd3fc') + (_rawD ? mkDim('D', _rawD, '#6ee7b7') : '');
  } else {
    dims.innerHTML = `<div style="font-size:10px;color:#c4b5fd;animation:hudPulse 2s ease-in-out infinite;background:rgba(10,5,32,0.5);padding:4px 16px;border-radius:6px;border:1px solid rgba(196,181,253,0.2)">กรอกขนาด W × L × D เพื่อดูขนาดจริง</div>`;
  }
}

// === HOLOGRAPHIC GRID ===
function createHoloGrid() {
  const group = new THREE.Group();
  const gridGeo = new THREE.PlaneGeometry(14, 14, 28, 28);
  const gridMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { time: { value: 0 }, color: { value: new THREE.Color(0x7c3aed) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      uniform float time; uniform vec3 color; varying vec2 vUv;
      void main(){
        vec2 grid = abs(fract(vUv*14.0-0.5)-0.5)/fwidth(vUv*14.0);
        float line = min(grid.x, grid.y);
        float alpha = 1.0-min(line,1.0);
        float dist = length(vUv-0.5)*2.0;
        alpha *= smoothstep(1.0,0.2,dist) * 0.2;
        float pulse = sin(time*0.5-dist*3.0)*0.5+0.5;
        alpha *= 0.6 + pulse*0.4;
        gl_FragColor = vec4(color, alpha);
      }`,
    side: THREE.DoubleSide,
  });
  const grid = new THREE.Mesh(gridGeo, gridMat);
  grid.rotation.x = -Math.PI/2; grid.position.y = -0.01;
  group.add(grid);
  return group;
}

function createParticles() {
  const count = 120;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count*3);
  const sizes = new Float32Array(count);
  for (let i=0; i<count; i++) {
    pos[i*3]=(Math.random()-0.5)*10;
    pos[i*3+1]=Math.random()*5;
    pos[i*3+2]=(Math.random()-0.5)*10;
    sizes[i] = 0.01 + Math.random()*0.04;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color:0xc4b5fd, size:0.035, transparent:true, opacity:0.5, blending:THREE.AdditiveBlending, depthWrite:false }));
}

// === 3D DIMENSION LINES ===
function createDimLines(n, typeId) {
  const g = new THREE.Group();
  if (!_hasSize) return g;

  const hw=n.w/2, hl=n.l/2, hd=n.d/2;
  const offset = 0.15;
  const arrowSize = 0.06;

  // W line (width - along X, bottom front) — bright purple
  addDimLine3D(g, new THREE.Vector3(-hw, 0, hl+offset), new THREE.Vector3(hw, 0, hl+offset), 0xd8b4fe, `W: ${_rawW}mm`);

  // L line (length - along Z, bottom right) — bright cyan
  addDimLine3D(g, new THREE.Vector3(hw+offset, 0, hl), new THREE.Vector3(hw+offset, 0, -hl), 0x7dd3fc, `L: ${_rawL}mm`);

  // D line (depth - along Y, front right) — bright green
  if (_rawD > 0) {
    addDimLine3D(g, new THREE.Vector3(hw+offset, 0, hl+offset), new THREE.Vector3(hw+offset, n.d, hl+offset), 0x6ee7b7, `D: ${_rawD}mm`);
  }

  return g;
}

function addDimLine3D(group, start, end, color, labelText) {
  // Main line
  const pts = [start, end];
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 });
  group.add(new THREE.LineSegments(geo, mat));

  // End ticks
  const tickLen = 0.06;
  const dir = new THREE.Vector3().subVectors(end, start).normalize();
  const perp = new THREE.Vector3(0, 1, 0);
  if (Math.abs(dir.y) > 0.9) perp.set(0, 0, 1);
  const tick = perp.clone().multiplyScalar(tickLen);

  [[start, tick], [end, tick]].forEach(([p, t]) => {
    const tGeo = new THREE.BufferGeometry().setFromPoints([
      p.clone().add(t), p.clone().sub(t)
    ]);
    group.add(new THREE.LineSegments(tGeo, mat.clone()));
  });

  // Label sprite
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(10,5,32,0.7)';
  ctx.roundRect(0, 8, canvas.width, 48, 8);
  ctx.fill();
  ctx.strokeStyle = `#${color.toString(16).padStart(6,'0')}`;
  ctx.lineWidth = 2;
  ctx.roundRect(0, 8, canvas.width, 48, 8);
  ctx.stroke();
  ctx.fillStyle = `#${color.toString(16).padStart(6,'0')}`;
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(labelText, 128, 42);

  const tex = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(spriteMat);
  const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
  sprite.position.copy(mid).add(new THREE.Vector3(0, 0.12, 0));
  sprite.scale.set(0.6, 0.15, 1);
  group.add(sprite);
}

// === MATERIALS ===
let _customBoxColor = null; // Per-F preview color override
let _artworkTexture = null; // Uploaded artwork texture
let _coatingType = ''; // Coating info for realistic render

function boxMat(color, op) {
  // Level 4: Adjust material based on coating type
  let roughness = 0.25, clearcoat = 0.5, clearcoatRoughness = 0.3;
  if (_coatingType) {
    if (/gloss.*uv|uv.*gloss/i.test(_coatingType)) { roughness = 0.05; clearcoat = 1.0; clearcoatRoughness = 0.05; } // UV Gloss = super shiny
    else if (/matt.*uv|uv.*matt/i.test(_coatingType)) { roughness = 0.7; clearcoat = 0.2; clearcoatRoughness = 0.8; } // UV Matt = silky matte
    else if (/gloss.*opp|opp.*gloss/i.test(_coatingType)) { roughness = 0.1; clearcoat = 0.8; clearcoatRoughness = 0.1; } // OPP Gloss = smooth shiny
    else if (/matt.*opp|opp.*matt/i.test(_coatingType)) { roughness = 0.6; clearcoat = 0.15; clearcoatRoughness = 0.7; } // OPP Matt = soft touch
    else if (/water/i.test(_coatingType)) { roughness = 0.3; clearcoat = 0.4; clearcoatRoughness = 0.4; } // Waterbase = subtle
  }
  const mat = new THREE.MeshPhysicalMaterial({
    color: _customBoxColor || color || 0xffffff, roughness, metalness: 0.08, clearcoat, clearcoatRoughness,
    transparent: true, opacity: op ?? 0.92, side: THREE.DoubleSide,
  });
  // Level 3: Apply artwork texture to front face
  if (_artworkTexture) {
    mat.map = _artworkTexture;
    mat.color.set(0xffffff); // Don't tint artwork
    mat.opacity = 0.95;
    mat.transparent = true;
  }
  return mat;
}

function holoEdges(mesh, color) {
  const edges = new THREE.EdgesGeometry(mesh.geometry, 15);
  mesh.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color:color||0xa78bfa, transparent:true, opacity:0.7 })));
  const glow = new THREE.LineSegments(edges.clone(), new THREE.LineBasicMaterial({ color:color||0x7c3aed, transparent:true, opacity:0.25, blending:THREE.AdditiveBlending }));
  glow.scale.multiplyScalar(1.01);
  mesh.add(glow);
  _glowMeshes.push(glow);
}

// === FLUTE DIRECTION — corrugated lines baked into box surface ===

// Generate corrugated flute texture (color map)
// vertical=true → lines run top-to-bottom, vertical=false → lines run left-to-right
function createFluteColorMap(vertical) {
  const res = 512;
  const c = document.createElement('canvas');
  c.width = res; c.height = res;
  const ctx = c.getContext('2d');

  // Kraft brown base
  ctx.fillStyle = '#b8864f';
  ctx.fillRect(0, 0, res, res);

  // Bold corrugated flute ridges — clearly visible alternating strips
  const fluteCount = 16; // fewer = thicker & more visible
  const spacing = res / fluteCount;

  for (let i = 0; i < fluteCount; i++) {
    // Ridge (raised) = lighter, Valley (recessed) = darker
    const isRidge = i % 2 === 0;
    if (isRidge) {
      ctx.fillStyle = '#d4a870'; // light kraft ridge
    } else {
      ctx.fillStyle = '#96693a'; // dark kraft valley
    }

    if (vertical) {
      ctx.fillRect(spacing * i, 0, spacing, res);
    } else {
      ctx.fillRect(0, spacing * i, res, spacing);
    }

    // Add ridge highlight line (3D effect)
    if (isRidge) {
      ctx.fillStyle = 'rgba(255,220,180,0.3)';
      if (vertical) {
        ctx.fillRect(spacing * i + 2, 0, 3, res);
      } else {
        ctx.fillRect(0, spacing * i + 2, res, 3);
      }
    }
  }

  // Fine grain noise for kraft paper feel
  const imgData = ctx.getImageData(0, 0, res, res);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
    imgData.data[i] += noise;
    imgData.data[i+1] += noise;
    imgData.data[i+2] += noise * 0.6;
  }
  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Generate bump/normal map for corrugated ridges
function createFluteBumpMap(vertical) {
  const res = 512;
  const c = document.createElement('canvas');
  c.width = res; c.height = res;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#808080'; // neutral gray = no bump
  ctx.fillRect(0, 0, res, res);

  const fluteCount = 16;
  const spacing = res / fluteCount;

  for (let i = 0; i < fluteCount; i++) {
    // Strong contrast: ridge = bright white, valley = dark
    const isRidge = i % 2 === 0;
    const bright = isRidge ? 220 : 60;
    ctx.fillStyle = `rgb(${bright},${bright},${bright})`;
    if (vertical) {
      ctx.fillRect(spacing * i, 0, spacing, res);
    } else {
      ctx.fillRect(0, spacing * i, res, spacing);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Create corrugated material with flute direction
function fluteMat(vertical, opacity) {
  const colorMap = createFluteColorMap(vertical);
  const bumpMap = createFluteBumpMap(vertical);
  return new THREE.MeshPhysicalMaterial({
    map: colorMap,
    bumpMap: bumpMap,
    bumpScale: 0.08,
    roughness: 0.7,
    metalness: 0.0,
    clearcoat: 0.1,
    transparent: true,
    opacity: opacity ?? 0.95,
    side: THREE.DoubleSide,
  });
}

// Apply corrugated flute texture to all walls of the box group
function applyFluteToBox(group, n, fluteDir) {
  if (!fluteDir) return;

  // fluteDir='short' → ลอนขนานด้านสั้น (W) → on front/back: vertical, on sides: horizontal
  // fluteDir='long'  → ลอนขนานด้านยาว (L) → on front/back: horizontal, on sides: vertical

  group.traverse(child => {
    if (!child.isMesh) return;
    // Skip dimension sprites, edges, non-box panels
    if (child.isSprite || child.isLineSegments) return;

    const geo = child.geometry;
    if (!geo || !geo.parameters) return;

    const gw = geo.parameters.width;
    const gh = geo.parameters.height;
    const gd = geo.parameters.depth;

    // Identify face by geometry dimensions (thin panel = wall)
    const t = 0.02; // thickness threshold
    const isWall = (gw < t || gh < t || gd < t);
    if (!isWall) return;

    // Determine which face this is and correct flute orientation
    let vertical;
    if (gd < t) {
      // Front/back face (W×D panel perpendicular to Z)
      vertical = fluteDir === 'short';
    } else if (gw < t) {
      // Side face (L×D panel perpendicular to X)
      vertical = fluteDir === 'long';
    } else if (gh < t) {
      // Top/bottom face (W×L panel perpendicular to Y)
      vertical = fluteDir === 'short';
    } else {
      return;
    }

    // Replace material with corrugated flute material
    const oldOpacity = child.material?.opacity ?? 0.92;
    child.material.dispose();
    child.material = fluteMat(vertical, Math.max(oldOpacity, 0.92));
  });

  // Add direction arrow indicator on top of box
  addFluteArrow(group, n, fluteDir);
}

// Flute direction arrow on top surface
function addFluteArrow(group, n, fluteDir) {
  const res = 256;
  const c = document.createElement('canvas');
  c.width = res; c.height = res;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, res, res);

  // Semi-transparent dark background circle
  ctx.beginPath();
  ctx.arc(128, 115, 60, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fill();

  ctx.save();
  ctx.translate(128, 115);
  if (fluteDir === 'long') ctx.rotate(Math.PI / 2);

  // Double arrow
  ctx.strokeStyle = '#f0d080';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -38); ctx.lineTo(0, 38);
  ctx.stroke();

  // Arrowheads
  ctx.fillStyle = '#f0d080';
  ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(-9, -30); ctx.lineTo(9, -30); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, 44); ctx.lineTo(-9, 30); ctx.lineTo(9, 30); ctx.closePath(); ctx.fill();

  // Wave lines between arrows (corrugated symbol)
  ctx.strokeStyle = 'rgba(255,220,160,0.7)';
  ctx.lineWidth = 1.5;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    const x = i * 8;
    for (let y = -18; y <= 18; y += 2) {
      const wave = Math.sin(y * 0.35) * 3;
      if (y === -18) ctx.moveTo(x + wave, y); else ctx.lineTo(x + wave, y);
    }
    ctx.stroke();
  }
  ctx.restore();

  // Label
  ctx.font = 'bold 17px monospace';
  ctx.fillStyle = '#f0d080';
  ctx.textAlign = 'center';
  const label = fluteDir === 'short' ? '↕ FLUTE' : '↔ FLUTE';
  ctx.fillText(label, 128, 200);

  ctx.font = '13px monospace';
  ctx.fillStyle = 'rgba(240,208,128,0.7)';
  ctx.fillText(fluteDir === 'short' ? 'ด้านสั้น' : 'ด้านยาว', 128, 220);

  const tex = new THREE.CanvasTexture(c);
  const size = Math.min(n.w, n.l) * 0.55;
  const geo = new THREE.PlaneGeometry(size, size);
  const mat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, opacity: 0.9,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const arrow = new THREE.Mesh(geo, mat);
  arrow.position.set(0, n.d + 0.025, 0);
  arrow.rotation.x = -Math.PI / 2;
  arrow.userData.isFluteArrow = true;
  group.add(arrow);
}

function addP(group, w, h, d, x, y, z, color, op) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, boxMat(color, op));
  mesh.position.set(x, y, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  holoEdges(mesh);
  group.add(mesh);
  return mesh;
}

function normalize(w, l, d) {
  const s = 2.0/Math.max(w,l,d,1);
  return { w:w*s, l:l*s, d:d*s };
}

// ============================================================
// TEMPLATE BUILDERS
// ============================================================
function buildType1(w,l,d) {
  const n=normalize(w,l,d), g=new THREE.Group();
  const hw=n.w/2, hl=n.l/2, t=0.012;
  addP(g, n.w, n.d, t, 0, n.d/2, hl, 0xffffff);
  addP(g, n.w, n.d, t, 0, n.d/2, -hl, 0xf0ecff);
  addP(g, t, n.d, n.l, -hw, n.d/2, 0, 0xe8e0ff);
  addP(g, t, n.d, n.l, hw, n.d/2, 0, 0xe8e0ff);
  addP(g, n.w, t, n.l, 0, 0, 0, 0xf5f0ff, 0.85);
  // Top lid slightly open
  const topGeo = new THREE.PlaneGeometry(n.w*0.95, n.l*0.95);
  const top = new THREE.Mesh(topGeo, boxMat(0xede9fe, 0.7));
  top.position.set(0, n.d+0.015, -n.l*0.04);
  top.rotation.x = -Math.PI/2+0.12;
  holoEdges(top); top.castShadow=true; g.add(top);
  // Tuck flap
  const fGeo = new THREE.PlaneGeometry(n.w*0.8, n.d*0.28);
  const flap = new THREE.Mesh(fGeo, boxMat(0xddd6fe, 0.55));
  flap.position.set(0, n.d+0.05, hl-n.d*0.08);
  flap.rotation.x = -Math.PI/2+0.3;
  holoEdges(flap, 0x38bdf8); g.add(flap);
  // Dimensions
  g.add(createDimLines(n, 1));
  return g;
}

function buildTray(w,l,d) {
  const n=normalize(w,l,d), g=new THREE.Group();
  const hw=n.w/2, hl=n.l/2, t=0.012;
  addP(g, n.w, t, n.l, 0, 0, 0, 0xffffff, 0.9);
  addP(g, n.w, n.d, t, 0, n.d/2, hl, 0xe8e0ff, 0.85);
  addP(g, n.w, n.d, t, 0, n.d/2, -hl, 0xe8e0ff, 0.85);
  addP(g, t, n.d, n.l, -hw, n.d/2, 0, 0xede9fe, 0.85);
  addP(g, t, n.d, n.l, hw, n.d/2, 0, 0xede9fe, 0.85);
  g.add(createDimLines(n, 5));
  return g;
}

function buildGable(w,l,d) {
  const n=normalize(w,l,d), g=new THREE.Group();
  const hw=n.w/2, hl=n.l/2, t=0.012;
  addP(g, n.w, n.d, t, 0, n.d/2, hl, 0xffffff);
  addP(g, n.w, n.d, t, 0, n.d/2, -hl, 0xf0ecff);
  addP(g, t, n.d, n.l, -hw, n.d/2, 0, 0xe8e0ff);
  addP(g, t, n.d, n.l, hw, n.d/2, 0, 0xe8e0ff);
  addP(g, n.w, t, n.l, 0, 0, 0, 0xf5f0ff, 0.85);
  const pk = n.d*0.25;
  const rs = new THREE.Shape();
  rs.moveTo(-hw, 0); rs.lineTo(0, pk); rs.lineTo(hw, 0); rs.closePath();
  const rGeo = new THREE.ExtrudeGeometry(rs, { depth:n.l, bevelEnabled:false });
  const roof = new THREE.Mesh(rGeo, boxMat(0xddd6fe, 0.7));
  roof.position.set(0, n.d, -hl);
  holoEdges(roof, 0x38bdf8); roof.castShadow=true; g.add(roof);
  g.add(createDimLines(n, 8));
  return g;
}

function buildSleeve(w,l,d) {
  const n=normalize(w,l,d), g=new THREE.Group();
  const hw=n.w/2, hl=n.l/2, t=0.012;
  addP(g, n.w, n.d, t, 0, n.d/2, hl, 0xffffff, 0.85);
  addP(g, n.w, n.d, t, 0, n.d/2, -hl, 0xf0ecff, 0.85);
  addP(g, t, n.d, n.l, -hw, n.d/2, 0, 0xe8e0ff, 0.85);
  addP(g, t, n.d, n.l, hw, n.d/2, 0, 0xe8e0ff, 0.85);
  g.add(createDimLines(n, 9));
  return g;
}

function buildPillow(w,l,d) {
  const n=normalize(w,l,d), g=new THREE.Group();
  const hw=n.w/2, hl=n.l/2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw,-hl); shape.lineTo(hw,-hl); shape.lineTo(hw,hl); shape.lineTo(-hw,hl); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth:n.d*0.7, bevelEnabled:true, bevelThickness:n.d*0.15, bevelSize:n.d*0.12, bevelSegments:12 });
  const mesh = new THREE.Mesh(geo, boxMat(0xffffff, 0.88));
  mesh.rotation.x = Math.PI/2; mesh.position.z = n.d*0.35;
  holoEdges(mesh); mesh.castShadow=true; g.add(mesh);
  g.add(createDimLines(n, 10));
  return g;
}

function buildClosed(w,l,d) {
  const n=normalize(w,l,d), g=new THREE.Group();
  const hw=n.w/2, hl=n.l/2, t=0.012;
  addP(g, n.w, n.d, t, 0, n.d/2, hl, 0xffffff);
  addP(g, n.w, n.d, t, 0, n.d/2, -hl, 0xf0ecff);
  addP(g, t, n.d, n.l, -hw, n.d/2, 0, 0xe8e0ff);
  addP(g, t, n.d, n.l, hw, n.d/2, 0, 0xe8e0ff);
  addP(g, n.w, t, n.l, 0, n.d, 0, 0xede9fe, 0.8);
  addP(g, n.w, t, n.l, 0, 0, 0, 0xf5f0ff, 0.85);
  g.add(createDimLines(n, 11));
  return g;
}

// ============================================================
// ANIMATION
// ============================================================
function animate() {
  _animId = requestAnimationFrame(animate);
  if (!_renderer || !_scene || !_camera) return;
  const t = _clock ? _clock.getElapsedTime() : 0;

  if (_controls) _controls.update();
  if (_box) _box.position.y += Math.sin(t*0.8)*0.0003;

  // Scan beam sweeps up and down
  if (_scanLine) {
    _scanLine.position.y = 0.2 + Math.sin(t * 0.5) * 1.0;
    _scanLine.material.uniforms.opacity.value = 0.3 + Math.sin(t * 2) * 0.15;
    _scanLine.scale.x = 1 + Math.sin(t * 0.3) * 0.2;
  }

  // Animate scene elements
  _scene.children.forEach(c => {
    if (c.children?.[0]?.material?.uniforms?.time) c.children[0].material.uniforms.time.value = t;
    if (c.userData?.isRing) c.rotation.z = t * 0.1;
    // Pulse rings: scale in/out + rotate
    if (c.userData?.isPulseRing) {
      const i = c.userData.ringIdx;
      const pulse = 1 + Math.sin(t*0.8 + i*2) * 0.08;
      c.scale.set(pulse, pulse, 1);
      c.rotation.z = t * (0.05 + i*0.02) * (i%2===0 ? 1 : -1);
      c.material.opacity = 0.08 + Math.sin(t*1.2 + i)*0.06;
    }
  });

  _glowMeshes.forEach(m => { if(m.material) m.material.opacity = 0.15+Math.sin(t*1.5)*0.08; });

  // Animate flute arrow (subtle pulse)
  if (_box) {
    _box.traverse(c => {
      if (c.userData?.isFluteArrow && c.material) {
        c.material.opacity = 0.6 + Math.sin(t * 1.5) * 0.25;
      }
    });
  }

  if (_particles) {
    _particles.rotation.y = t*0.03;
    const pos = _particles.geometry.attributes.position.array;
    for (let i=1; i<pos.length; i+=3) pos[i] += Math.sin(t+i)*0.0002;
    _particles.geometry.attributes.position.needsUpdate = true;
  }

  // Animate dimension label sprites (subtle pulse)
  if (_dimGroup) {
    _dimGroup.children.forEach(c => {
      if (c.isSprite) c.material.opacity = 0.75 + Math.sin(t*2)*0.15;
    });
  }

  _renderer.render(_scene, _camera);
}

// ============================================================
// MAIN RENDER
// ============================================================
function render(container, typeId, sz) {
  const el = typeof container === 'string' ? document.getElementById(container) : container;
  if (!el || typeof THREE === 'undefined') return;

  _rawW = parseFloat(sz?.width)||0;
  _rawL = parseFloat(sz?.length)||0;
  _rawD = parseFloat(sz?.depth)||0;
  _hasSize = _rawW>0 || _rawL>0;
  _typeId = parseInt(typeId)||1;
  _fluteDir = sz?._fluteDir || null;
  _customBoxColor = sz?._boxColor || null;
  _coatingType = sz?._coating || '';
  _artworkTexture = null;

  // Level 3: Load artwork texture if provided
  if (sz?._artwork) {
    try {
      const loader = new THREE.TextureLoader();
      _artworkTexture = loader.load(sz._artwork);
      _artworkTexture.colorSpace = THREE.SRGBColorSpace;
    } catch (e) { _artworkTexture = null; }
  }
  console.log('[Box3D] render called — _fluteDir:', _fluteDir, '| sz:', JSON.stringify(sz));

  const w = _rawW||60, l = _rawL||80, d = _rawD||30;
  const rect = el.getBoundingClientRect();
  const width = Math.max(rect.width||400, 300);
  const height = Math.max(rect.height||336, 280);

  init(el, width, height);

  const tid = parseInt(typeId);
  switch (tid) {
    case 1: case 2: _box = buildType1(w,l,d); break;
    case 3: case 4: _box = buildClosed(w,l,d); break;
    case 5: case 6: case 7: _box = buildTray(w,l,d); break;
    case 8: _box = buildGable(w,l,d); break;
    case 9: _box = buildSleeve(w,l,d); break;
    case 10: _box = buildPillow(w,l,d); break;
    default: _box = buildClosed(w,l,d);
  }

  if (_box) {
    // Apply corrugated flute texture directly onto box walls
    if (_fluteDir) {
      const n = normalize(w, l, d);
      applyFluteToBox(_box, n, _fluteDir);
    }

    _box.scale.set(0.01,0.01,0.01);
    _scene.add(_box);

    // Entry animation — smooth ease-out (no bounce)
    const st = Date.now();
    (function entry() {
      const p = Math.min((Date.now()-st)/1200, 1);
      const e = 1-Math.pow(1-p, 4);
      _box.scale.set(e,e,e);
      _box.rotation.y = (1-e)*Math.PI*0.3;
      if (p<1) requestAnimationFrame(entry);
    })();
  }

  // Add company logo on box
  addLogoToScene(_box, _scene, _container);

  // === Per-F visual cues — actual sizes from spec ===
  if (_box && sz) {
    const n = normalize(w, l, d);
    // Scale: 1 inch in real → how much in 3D units
    const inchToUnit = (n.w / (w / 25.4)) || 0.05;
    const frontZ = n.l / 2 + 0.003;
    let foilY = n.d * 0.25; // start position for stacking

    // Foil stamps — metallic rectangles at actual sizes
    if (sz._foils?.length) {
      sz._foils.forEach((foil, fi) => {
        const foilColor = /ทอง|gold/i.test(foil.color) ? 0xd4a017 : /เงิน|silver/i.test(foil.color) ? 0xc0c0c0 : /ชมพู|pink/i.test(foil.color) ? 0xe91e8c : /แดง|red/i.test(foil.color) ? 0xcc2222 : /น้ำเงิน|blue/i.test(foil.color) ? 0x2255cc : 0xd4a017;
        (foil.sizes || []).forEach((s, si) => {
          const fw = (parseFloat(s.w) || 1) * inchToUnit;
          const fh = (parseFloat(s.l) || 1) * inchToUnit;
          const geo = new THREE.PlaneGeometry(fw, fh);
          const mat = new THREE.MeshPhysicalMaterial({ color: foilColor, metalness: 0.95, roughness: 0.08, clearcoat: 1.0, transparent: true, opacity: 0.88, side: THREE.DoubleSide });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set((fi - 0.5) * n.w * 0.3, foilY, frontZ);
          _box.add(mesh);
          // Glow
          const glow = new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({ color: foilColor, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
          glow.position.copy(mesh.position);
          glow.position.z += 0.001;
          glow.scale.set(1.1, 1.1, 1);
          _box.add(glow);
          foilY -= fh + 0.02;
        });
      });
    }

    // Emboss — raised rectangles with edge highlight at actual sizes
    if (sz._emboss?.sizes?.length) {
      let embY = -n.d * 0.1;
      sz._emboss.sizes.forEach((s, si) => {
        const ew = (parseFloat(s.w) || 1) * inchToUnit;
        const eh = (parseFloat(s.l) || 1) * inchToUnit;
        // Raised surface
        const geo = new THREE.PlaneGeometry(ew, eh);
        const mat = new THREE.MeshPhysicalMaterial({ color: _customBoxColor || 0xffffff, metalness: 0.0, roughness: 0.4, clearcoat: 0.6, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(n.w * 0.15, embY, frontZ + 0.001);
        _box.add(mesh);
        // Edge border (wireframe rectangle)
        const edgeGeo = new THREE.EdgesGeometry(geo);
        const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
        const edges = new THREE.LineSegments(edgeGeo, edgeMat);
        edges.position.copy(mesh.position);
        edges.position.z += 0.001;
        _box.add(edges);
        embY -= eh + 0.02;
      });
    }

    // Deboss — sunken rectangles (darker tint) at actual sizes
    if (sz._deboss?.sizes?.length) {
      let debY = -n.d * 0.25;
      sz._deboss.sizes.forEach((s, si) => {
        const dw = (parseFloat(s.w) || 1) * inchToUnit;
        const dh = (parseFloat(s.l) || 1) * inchToUnit;
        const geo = new THREE.PlaneGeometry(dw, dh);
        const mat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(-n.w * 0.15, debY, frontZ - 0.002);
        _box.add(mesh);
        // Dashed border
        const edgeGeo = new THREE.EdgesGeometry(geo);
        const edgeMat = new THREE.LineDashedMaterial({ color: 0x888888, transparent: true, opacity: 0.5, dashSize: 0.02, gapSize: 0.01 });
        const edges = new THREE.LineSegments(edgeGeo, edgeMat);
        edges.computeLineDistances();
        edges.position.copy(mesh.position);
        _box.add(edges);
        debY -= dh + 0.02;
      });
    }

    // Special ink — PMS dot
    if (sz._hasSpecialInk && sz._specialInkColor) {
      const dotR = Math.min(n.w, n.d) * 0.05;
      const dotGeo = new THREE.CircleGeometry(dotR, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xff4081, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      dotMesh.position.set(-n.w * 0.3, n.d * 0.35, frontZ);
      _box.add(dotMesh);
    }
  }

  // Artwork badge — indicates artwork is loaded
  if (_artworkTexture && _container) {
    const artEl = document.createElement('div');
    artEl.style.cssText = 'position:absolute;bottom:40px;right:8px;pointer-events:none;font-family:sans-serif;font-size:10px;color:#10b981;background:rgba(16,185,129,0.15);padding:3px 8px;border-radius:4px;border:1px solid rgba(16,185,129,0.4);z-index:2';
    artEl.innerHTML = '<i class="fas fa-check-circle"></i> Artwork loaded';
    _container.appendChild(artEl);
  }

  // Coating badge — append to HUD type label (avoid overlap)
  if (_coatingType?.trim()) {
    const hudType = document.getElementById('hud_type');
    if (hudType) {
      hudType.innerHTML += '<br><span style="font-size:9px;color:#60a5fa;background:rgba(96,165,250,0.15);padding:1px 6px;border-radius:3px;border:1px solid rgba(96,165,250,0.3)">' + _coatingType.trim() + '</span>';
    }
  }

  // F-code preview badge — top-right
  if (sz?._fLabel && _container) {
    const fEl = document.createElement('div');
    fEl.style.cssText = 'position:absolute;top:8px;right:8px;pointer-events:none;font-family:sans-serif;font-size:14px;color:#fff;text-shadow:0 0 8px rgba(124,58,237,0.6);background:linear-gradient(135deg,rgba(124,58,237,0.9),rgba(168,85,247,0.9));padding:6px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.3);z-index:2;font-weight:700;letter-spacing:0.5px';
    fEl.textContent = sz._fLabel;
    _container.appendChild(fEl);

    // Legend overlay — bottom-left with actual sizes
    const legends = [];
    if (sz._foils?.length) {
      sz._foils.forEach(f => {
        const szTxt = (f.sizes||[]).map(s => s.w + '"×' + s.l + '"').join(', ');
        legends.push('<span style="color:#d4a017">■</span> Foil: ' + (f.color || 'ทอง') + (szTxt ? ' <span style="opacity:0.7">' + szTxt + '</span>' : ''));
      });
    }
    if (sz._emboss?.sizes?.length) {
      const szTxt = sz._emboss.sizes.map(s => s.w + '"×' + s.l + '"').join(', ');
      legends.push('<span style="color:#fff;opacity:0.6">□</span> Emboss: ' + szTxt);
    }
    if (sz._deboss?.sizes?.length) {
      const szTxt = sz._deboss.sizes.map(s => s.w + '"×' + s.l + '"').join(', ');
      legends.push('<span style="color:#888">▽</span> Deboss: ' + szTxt);
    }
    if (sz._hasSpecialInk) legends.push('<span style="color:#ff4081">●</span> Special: ' + (sz._specialInkColor || ''));
    if (legends.length > 0) {
      const lgEl = document.createElement('div');
      lgEl.style.cssText = 'position:absolute;bottom:40px;left:8px;pointer-events:none;font-family:sans-serif;font-size:11px;color:#ddd;background:rgba(20,10,40,0.8);padding:6px 10px;border-radius:6px;border:1px solid rgba(160,120,255,0.3);z-index:2;line-height:1.6';
      lgEl.innerHTML = legends.join('<br>');
      _container.appendChild(lgEl);
    }
  }

  // Flute direction HUD badge — top-left, compact
  if (_fluteDir && _container) {
    const fluteEl = document.createElement('div');
    fluteEl.style.cssText = 'position:absolute;top:8px;left:8px;pointer-events:none;font-family:monospace;font-size:13px;color:#f0d080;text-shadow:0 0 6px rgba(240,208,128,0.4);background:rgba(40,22,8,0.8);padding:5px 12px;border-radius:6px;border:1px solid rgba(200,160,80,0.4);line-height:1.3;z-index:2;letter-spacing:0.5px';
    const arrow = _fluteDir === 'short' ? '↕' : '↔';
    const sideMm = _fluteDir === 'short' ? Math.min(_rawW, _rawL) : Math.max(_rawW, _rawL);
    const sideLabel = _fluteDir === 'short' ? 'ด้านสั้น' : 'ด้านยาว';
    fluteEl.innerHTML = `<span style="font-size:16px;vertical-align:middle">${arrow}</span> ลอน${sideLabel}${sideMm ? ' ' + sideMm + 'mm' : ''}`;
    _container.appendChild(fluteEl);
  }

  updateHUD(typeId, sz);
  animate();

  // Store instance for per-container cleanup
  _instances.set(_container.id, { animId: _animId, renderer: _renderer, controls: _controls, hudOverlay: _hudOverlay });
}

// === LOGO ON BOX TOP SURFACE (single, correct orientation) ===
function addLogoToScene(boxGroup, scene, container) {
  if (!boxGroup) return;

  new THREE.TextureLoader().load('img/logo.png', (tex) => {
    tex.encoding = THREE.sRGBEncoding;

    // Find highest Y point (top of box)
    let maxY = 0;
    boxGroup.traverse(child => {
      if (child.isMesh && child.position.y > maxY) maxY = child.position.y;
    });

    const aspect = tex.image.width / tex.image.height;
    const size = 0.55;
    const geo = new THREE.PlaneGeometry(size, size / aspect);
    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0.85, side: THREE.DoubleSide,
    });
    const logo = new THREE.Mesh(geo, mat);
    // Lay flat on top: rotate -90° around X, then face correct direction
    logo.rotation.x = -Math.PI / 2;
    logo.rotation.z = 0; // no flip
    logo.position.set(0, maxY + 0.015, 0);
    boxGroup.add(logo);
  }, undefined, () => {});
}

function destroy(container) {
  if (container) {
    const id = typeof container === 'string' ? container : container?.id;
    if (id) cleanupInstance(id);
  } else {
    cleanup();
  }
}
return { render, destroy };
})();
