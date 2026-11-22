/* ==========================================================================
   Usha Event Planner Farrukhabad — Unified Single-Loop WebGL 3D Module
   Exports:
     1. mountMandapPavilion3D   (Home Hero — 3D Architectural Mandap Pavilion)
     2. mountAdminEventSphere3D (Admin Hub — 3D Geodesic Event Activity Sphere)
   Single active WebGL loop coordinator, pixel-ratio cap, context-loss
   recovery, off-screen IntersectionObserver pause, and full GPU disposal.
   ========================================================================== */

let threePromise = null;
let activeLoopOwner = null;
const loopPausers = new Map();

function claimWebGLLoop(ownerId, pauseFn) {
  loopPausers.set(ownerId, pauseFn);
  if (activeLoopOwner && activeLoopOwner !== ownerId) {
    const prevPause = loopPausers.get(activeLoopOwner);
    if (typeof prevPause === 'function') prevPause(true);
  }
  activeLoopOwner = ownerId;
}

function releaseWebGLLoop(ownerId) {
  loopPausers.delete(ownerId);
  if (activeLoopOwner === ownerId) activeLoopOwner = null;
}

function detectTier() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'none';
  }
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return 'none';
  } catch (_) {
    return 'none';
  }
  const w = window.innerWidth || 1024;
  const cores = navigator.hardwareConcurrency || 4;
  if (w < 680 || cores <= 4) return 'lite';
  if (w < 1100) return 'medium';
  return 'high';
}

function loadThree() {
  if (!threePromise) {
    threePromise = import('https://esm.sh/three@0.169.0');
  }
  return threePromise;
}

/* ==========================================================================
   1. HOME HERO — 3D Architectural Mandap Pavilion & Hanging Brass Lanterns
   ========================================================================== */
export async function mountMandapPavilion3D(hostEl, initialPhotoUrl, callbacks = {}) {
  const tier = detectTier();
  if (tier === 'none' || !hostEl) {
    return { supported: false, setPhoto() {}, setPaused() {}, resetCamera() {}, dispose() {} };
  }

  let THREE;
  try {
    THREE = await loadThree();
  } catch (_) {
    return { supported: false, setPhoto() {}, setPaused() {}, resetCamera() {}, dispose() {} };
  }

  const ownerId = 'usha-pavilion-' + Math.random().toString(36).slice(2, 8);
  const disposables = [];
  const track = (obj) => {
    if (obj) disposables.push(obj);
    return obj;
  };

  let width = Math.max(hostEl.clientWidth, 300);
  let height = Math.max(hostEl.clientHeight, 240);

  const renderer = new THREE.WebGLRenderer({
    antialias: tier !== 'lite',
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier === 'high' ? 2 : 1.5));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  hostEl.innerHTML = '';
  hostEl.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 45);
  camera.position.set(0, 0.22, 6.45);

  // Warm courtyard candlelight + emerald bounce fill
  scene.add(new THREE.AmbientLight(0xf8f6f0, 0.65));

  const sunKey = new THREE.DirectionalLight(0xffe6ba, 1.85);
  sunKey.position.set(4.2, 5.0, 5.2);
  scene.add(sunKey);

  const lanternWarm = new THREE.PointLight(0xd4b26a, 3.0, 14);
  lanternWarm.position.set(0, 1.1, 2.2);
  scene.add(lanternWarm);

  const emeraldRim = new THREE.PointLight(0x1b6b4a, 2.8, 15);
  emeraldRim.position.set(-4.0, -1.8, 2.6);
  scene.add(emeraldRim);

  const rig = new THREE.Group();
  scene.add(rig);

  // Shared materials
  const emeraldStoneMat = track(new THREE.MeshStandardMaterial({
    color: 0x0e3324,
    metalness: 0.35,
    roughness: 0.52
  }));
  const brassMat = track(new THREE.MeshStandardMaterial({
    color: 0xd4b26a,
    metalness: 0.88,
    roughness: 0.22
  }));
  const lanternGlowMat = track(new THREE.MeshStandardMaterial({
    color: 0xffe4ad,
    emissive: 0xd4b26a,
    emissiveIntensity: 1.35,
    roughness: 0.3
  }));

  // 1. Stepped Sandstone & Emerald Courtyard Plinth
  const plinthBottom = new THREE.Mesh(track(new THREE.BoxGeometry(3.86, 0.14, 1.55)), emeraldStoneMat);
  plinthBottom.position.y = -1.26;
  rig.add(plinthBottom);

  const plinthTrim = new THREE.Mesh(track(new THREE.BoxGeometry(3.68, 0.045, 1.42)), brassMat);
  plinthTrim.position.y = -1.17;
  rig.add(plinthTrim);

  // 2. Four Carved Architectural Mandap Columns (2 front + 2 rear)
  const pillarGeo = track(new THREE.CylinderGeometry(0.062, 0.078, 2.28, 16));
  const capGeo = track(new THREE.BoxGeometry(0.22, 0.08, 0.22));
  const pillarCoords = [
    [-1.62, 0.42],
    [1.62, 0.42],
    [-1.62, -0.42],
    [1.62, -0.42]
  ];
  for (const [px, pz] of pillarCoords) {
    const col = new THREE.Mesh(pillarGeo, brassMat);
    col.position.set(px, -0.02, pz);
    rig.add(col);

    const baseCap = new THREE.Mesh(capGeo, emeraldStoneMat);
    baseCap.position.set(px, -1.11, pz);
    rig.add(baseCap);

    const topCap = new THREE.Mesh(capGeo, brassMat);
    topCap.position.set(px, 1.12, pz);
    rig.add(topCap);
  }

  // 3. Stepped Pavilion Canopy Cornice + Ornamental Arch Halo
  const corniceMain = new THREE.Mesh(track(new THREE.BoxGeometry(3.78, 0.12, 1.36)), emeraldStoneMat);
  corniceMain.position.y = 1.22;
  rig.add(corniceMain);

  const corniceBrass = new THREE.Mesh(track(new THREE.BoxGeometry(3.88, 0.045, 1.44)), brassMat);
  corniceBrass.position.y = 1.3;
  rig.add(corniceBrass);

  const crownArch = new THREE.Mesh(
    track(new THREE.TorusGeometry(1.02, 0.028, 14, 60, Math.PI)),
    brassMat
  );
  crownArch.position.set(0, 1.32, 0.42);
  rig.add(crownArch);

  // 4. Center Architectural Decor Showcase Panel (displays real Phase 1 decor photo)
  const panelW = 2.74;
  const panelH = 1.76;
  const panelGroup = new THREE.Group();
  panelGroup.position.set(0, 0.02, 0.02);
  rig.add(panelGroup);

  const panelBacking = new THREE.Mesh(
    track(new THREE.BoxGeometry(panelW + 0.14, panelH + 0.14, 0.07)),
    emeraldStoneMat
  );
  panelBacking.position.z = -0.045;
  panelGroup.add(panelBacking);

  const panelTrim = new THREE.Mesh(
    track(new THREE.BoxGeometry(panelW + 0.19, panelH + 0.19, 0.026)),
    brassMat
  );
  panelTrim.position.z = -0.065;
  panelGroup.add(panelTrim);

  const photoMat = track(new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.42,
    metalness: 0.05
  }));
  const photoPlane = new THREE.Mesh(track(new THREE.PlaneGeometry(panelW, panelH)), photoMat);
  photoPlane.position.z = 0.006;
  panelGroup.add(photoPlane);

  // 5. Four Hanging Brass Lantern Pendants (gently swaying)
  const cordGeo = track(new THREE.CylinderGeometry(0.008, 0.008, 0.42, 8));
  const lanternBodyGeo = track(new THREE.OctahedronGeometry(0.095, 0));
  const lanternCoords = [
    { x: -1.16, z: 0.46, len: 0.42, phase: 0.2 },
    { x: -0.58, z: 0.52, len: 0.28, phase: 1.5 },
    { x: 0.58, z: 0.52, len: 0.28, phase: 2.6 },
    { x: 1.16, z: 0.46, len: 0.42, phase: 3.9 }
  ];
  const lanterns = [];
  for (const cfg of lanternCoords) {
    const pivot = new THREE.Group();
    pivot.position.set(cfg.x, 1.16, cfg.z);

    const cord = new THREE.Mesh(cordGeo, brassMat);
    cord.scale.y = cfg.len / 0.42;
    cord.position.y = -cfg.len / 2;
    pivot.add(cord);

    const body = new THREE.Mesh(lanternBodyGeo, lanternGlowMat);
    body.position.y = -cfg.len - 0.06;
    pivot.add(body);

    rig.add(pivot);
    lanterns.push({ pivot, phase: cfg.phase });
  }

  // 6. Custom GLSL Warm Lantern Aura Halo Shader
  const auraMat = track(new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color(0xd4b26a) },
      uTime: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        float d = distance(vUv, vec2(0.5, 0.5));
        float glow = smoothstep(0.5, 0.06, d);
        float pulse = 0.78 + 0.22 * sin(uTime * 1.2);
        gl_FragColor = vec4(uColor, glow * glow * 0.24 * pulse);
      }
    `
  }));
  const auraPlane = new THREE.Mesh(track(new THREE.PlaneGeometry(5.8, 4.4)), auraMat);
  auraPlane.position.z = -0.8;
  rig.add(auraPlane);

  // 7. InstancedMesh Floating Warm Courtyard Light Motes (1 draw call)
  const moteCount = tier === 'lite' ? 24 : 42;
  const motes = new THREE.InstancedMesh(
    track(new THREE.SphereGeometry(0.024, 8, 8)),
    track(new THREE.MeshBasicMaterial({ color: 0xe8c982, transparent: true, opacity: 0.6 })),
    moteCount
  );
  const moteSeeds = [];
  const dummy = new THREE.Object3D();
  for (let i = 0; i < moteCount; i++) {
    moteSeeds.push({
      radius: 2.25 + Math.random() * 1.5,
      angle: (i / moteCount) * Math.PI * 2 + Math.random() * 0.4,
      y: (Math.random() - 0.5) * 2.6,
      speed: 0.1 + Math.random() * 0.16,
      scale: 0.65 + Math.random() * 1.05
    });
  }
  scene.add(motes);

  // Photo Texture Swap
  const texLoader = new THREE.TextureLoader();
  let currentTex = null;
  function setPhoto(url) {
    if (!url) return;
    texLoader.load(url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      if (currentTex) currentTex.dispose();
      currentTex = tex;
      photoMat.map = tex;
      photoMat.needsUpdate = true;
    });
  }
  setPhoto(initialPhotoUrl);

  // Drag & Hover Orbit Controls with Spring Inertia
  let targetRotY = -0.18;
  let targetRotX = 0.07;
  let curRotY = -0.18;
  let curRotX = 0.07;
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  let isPaused = false;
  let isVisible = true;
  let isDocVisible = !document.hidden;
  let isContextLost = false;
  let isDisposed = false;
  let rafId = 0;
  let lastRenderTime = 0;
  const minFrameMs = tier === 'lite' ? 32 : 16;

  function onPointerDown(e) { isDragging = true; lastX = e.clientX; lastY = e.clientY; }
  function onPointerMove(e) {
    if (!isDragging) {
      const rect = hostEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && e.pointerType === 'mouse') {
        const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        targetRotY = Math.max(-0.44, Math.min(0.44, nx * 0.32));
        targetRotX = Math.max(-0.22, Math.min(0.22, ny * 0.16));
      }
      return;
    }
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    targetRotY = Math.max(-0.78, Math.min(0.78, targetRotY + dx * 0.0075));
    targetRotX = Math.max(-0.36, Math.min(0.36, targetRotX + dy * 0.005));
  }
  function onPointerUp() { isDragging = false; }
  function onDoubleClick() { targetRotY = -0.16; targetRotX = 0.07; }
  function onResize() {
    if (isDisposed || !hostEl) return;
    width = Math.max(hostEl.clientWidth, 300);
    height = Math.max(hostEl.clientHeight, 240);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  function onVisibility() { isDocVisible = !document.hidden; schedule(); }
  function onContextLost(e) { e.preventDefault(); isContextLost = true; }
  function onContextRestored() { isContextLost = false; schedule(); }

  hostEl.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  hostEl.addEventListener('dblclick', onDoubleClick);
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

  const observer = new IntersectionObserver((entries) => {
    isVisible = !!(entries[0] && entries[0].isIntersecting);
    schedule();
  }, { threshold: 0.04 });
  observer.observe(hostEl);

  const clock = new THREE.Clock();

  function tick(now) {
    rafId = 0;
    if (isDisposed || isPaused || !isVisible || !isDocVisible || isContextLost) return;
    rafId = requestAnimationFrame(tick);
    if (now - lastRenderTime < minFrameMs) return;
    lastRenderTime = now;

    const t = clock.getElapsedTime();
    auraMat.uniforms.uTime.value = t;

    curRotY += (targetRotY + Math.sin(t * 0.42) * 0.075 - curRotY) * 0.07;
    curRotX += (targetRotX + Math.cos(t * 0.34) * 0.025 - curRotX) * 0.07;
    rig.rotation.y = curRotY;
    rig.rotation.x = curRotX;
    panelGroup.position.y = 0.02 + Math.sin(t * 0.8) * 0.035;

    for (let i = 0; i < lanterns.length; i++) {
      const l = lanterns[i];
      l.pivot.rotation.z = Math.sin(t * 1.15 + l.phase) * 0.075;
      l.pivot.rotation.x = Math.cos(t * 0.9 + l.phase) * 0.04;
    }

    for (let i = 0; i < moteCount; i++) {
      const m = moteSeeds[i];
      const a = m.angle + t * m.speed;
      dummy.position.set(
        Math.cos(a) * m.radius,
        m.y + Math.sin(t * 0.55 + i) * 0.16,
        Math.sin(a) * 0.95 - 0.55
      );
      dummy.scale.setScalar(m.scale);
      dummy.updateMatrix();
      motes.setMatrixAt(i, dummy.matrix);
    }
    motes.instanceMatrix.needsUpdate = true;

    renderer.render(scene, camera);
  }

  function schedule() {
    if (!rafId && !isDisposed && !isPaused && isVisible && isDocVisible && !isContextLost) {
      claimWebGLLoop(ownerId, (p) => { isPaused = p; });
      rafId = requestAnimationFrame(tick);
    }
  }

  renderer.render(scene, camera);
  schedule();
  if (typeof callbacks.onReady === 'function') callbacks.onReady();

  return {
    supported: true,
    setPhoto,
    setPaused(flag) { isPaused = !!flag; if (!isPaused) schedule(); },
    resetCamera() { onDoubleClick(); },
    dispose() {
      isDisposed = true;
      releaseWebGLLoop(ownerId);
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
      hostEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      hostEl.removeEventListener('dblclick', onDoubleClick);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      if (currentTex) currentTex.dispose();
      for (const item of disposables) {
        if (item && typeof item.dispose === 'function') item.dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === hostEl) hostEl.removeChild(renderer.domElement);
    }
  };
}

/* ==========================================================================
   2. ADMIN COMMAND CENTER — Interactive 3D Emerald & Brass Event Sphere
   ========================================================================== */
export async function mountAdminEventSphere3D(hostEl, activityScore = 1) {
  const tier = detectTier();
  if (tier === 'none' || !hostEl) {
    return { supported: false, setActivity() {}, dispose() {} };
  }

  let THREE;
  try {
    THREE = await loadThree();
  } catch (_) {
    return { supported: false, setActivity() {}, dispose() {} };
  }

  const ownerId = 'usha-admin-sphere-' + Math.random().toString(36).slice(2, 8);
  const disposables = [];
  const track = (obj) => {
    if (obj) disposables.push(obj);
    return obj;
  };

  let width = Math.max(hostEl.clientWidth, 180);
  let height = Math.max(hostEl.clientHeight, 180);

  const renderer = new THREE.WebGLRenderer({
    antialias: tier !== 'lite',
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier === 'high' ? 2 : 1.5));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  hostEl.innerHTML = '';
  hostEl.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 30);
  camera.position.set(0, 0, 5.2);

  scene.add(new THREE.AmbientLight(0xf8f6f0, 0.72));
  const key = new THREE.DirectionalLight(0xd4b26a, 2.1);
  key.position.set(3, 4, 4);
  scene.add(key);
  const rim = new THREE.PointLight(0x1b6b4a, 3.6, 12);
  rim.position.set(-3.5, -2.5, 2.5);
  scene.add(rim);

  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  const coreMesh = new THREE.Mesh(
    track(new THREE.IcosahedronGeometry(1.06, 1)),
    track(new THREE.MeshStandardMaterial({
      color: 0x0e3b28,
      metalness: 0.72,
      roughness: 0.26,
      flatShading: true
    }))
  );
  rootGroup.add(coreMesh);

  const wireGeo = track(new THREE.IcosahedronGeometry(1.42, 1));
  rootGroup.add(new THREE.Mesh(
    wireGeo,
    track(new THREE.MeshBasicMaterial({ color: 0xd4b26a, wireframe: true, transparent: true, opacity: 0.36 }))
  ));
  rootGroup.add(new THREE.Points(
    wireGeo,
    track(new THREE.PointsMaterial({ color: 0xf8f6f0, size: 0.075, transparent: true, opacity: 0.9 }))
  ));

  const ring1 = new THREE.Mesh(
    track(new THREE.TorusGeometry(1.78, 0.022, 12, 64)),
    track(new THREE.MeshStandardMaterial({ color: 0xd4b26a, metalness: 0.9, roughness: 0.2 }))
  );
  ring1.rotation.x = 1.15;
  rootGroup.add(ring1);

  const ring2 = new THREE.Mesh(
    track(new THREE.TorusGeometry(1.96, 0.018, 12, 64)),
    track(new THREE.MeshStandardMaterial({ color: 0xf8f6f0, metalness: 0.55, roughness: 0.32 }))
  );
  ring2.rotation.y = 0.95;
  ring2.rotation.x = -0.55;
  rootGroup.add(ring2);

  const satCount = 14;
  const sats = new THREE.InstancedMesh(
    track(new THREE.SphereGeometry(0.045, 10, 10)),
    track(new THREE.MeshBasicMaterial({ color: 0xd4b26a })),
    satCount
  );
  const satSeeds = [];
  const dummy = new THREE.Object3D();
  for (let i = 0; i < satCount; i++) {
    satSeeds.push({
      radius: 1.62 + (i % 3) * 0.24,
      angle: (i / satCount) * Math.PI * 2,
      tilt: ((i % 5) - 2) * 0.38,
      speed: 0.45 + (i % 4) * 0.14
    });
  }
  rootGroup.add(sats);

  let velY = 0.004;
  let velX = 0.0015;
  let speedFactor = Math.max(0.8, Math.min(2.2, 0.8 + activityScore * 0.05));
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  let isPaused = false;
  let isVisible = true;
  let isDocVisible = !document.hidden;
  let isContextLost = false;
  let isDisposed = false;
  let rafId = 0;
  let lastRenderTime = 0;
  const minFrameMs = tier === 'lite' ? 32 : 16;

  function onDown(e) { isDragging = true; lastX = e.clientX; lastY = e.clientY; }
  function onMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    velY = dx * 0.008;
    velX = dy * 0.006;
    rootGroup.rotation.y += velY;
    rootGroup.rotation.x += velX;
  }
  function onUp() { isDragging = false; }
  function onDbl() { velY = 0.065; velX = -0.02; }
  function onResize() {
    if (isDisposed || !hostEl) return;
    width = Math.max(hostEl.clientWidth, 180);
    height = Math.max(hostEl.clientHeight, 180);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  function onVisibility() { isDocVisible = !document.hidden; schedule(); }
  function onContextLost(e) { e.preventDefault(); isContextLost = true; }
  function onContextRestored() { isContextLost = false; schedule(); }

  hostEl.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  hostEl.addEventListener('dblclick', onDbl);
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

  const observer = new IntersectionObserver((entries) => {
    isVisible = !!(entries[0] && entries[0].isIntersecting);
    schedule();
  }, { threshold: 0.05 });
  observer.observe(hostEl);

  const clock = new THREE.Clock();

  function tick(now) {
    rafId = 0;
    if (isDisposed || isPaused || !isVisible || !isDocVisible || isContextLost) return;
    rafId = requestAnimationFrame(tick);
    if (now - lastRenderTime < minFrameMs) return;
    lastRenderTime = now;

    const t = clock.getElapsedTime();
    if (!isDragging) {
      velY = velY * 0.96 + 0.0045 * speedFactor * 0.04;
      velX = velX * 0.95 + 0.0012 * 0.05;
      rootGroup.rotation.y += velY;
      rootGroup.rotation.x += velX;
    }

    coreMesh.scale.setScalar(1 + Math.sin(t * 1.4) * 0.04);
    ring1.rotation.z = t * 0.28 * speedFactor;
    ring2.rotation.z = -t * 0.22 * speedFactor;

    for (let i = 0; i < satCount; i++) {
      const s = satSeeds[i];
      const a = s.angle + t * s.speed * speedFactor;
      dummy.position.set(
        Math.cos(a) * s.radius,
        Math.sin(a) * Math.sin(s.tilt) * s.radius,
        Math.sin(a) * Math.cos(s.tilt) * s.radius
      );
      dummy.scale.setScalar(0.85 + Math.sin(t * 2 + i) * 0.25);
      dummy.updateMatrix();
      sats.setMatrixAt(i, dummy.matrix);
    }
    sats.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
  }

  function schedule() {
    if (!rafId && !isDisposed && !isPaused && isVisible && isDocVisible && !isContextLost) {
      claimWebGLLoop(ownerId, (p) => { isPaused = p; });
      rafId = requestAnimationFrame(tick);
    }
  }

  renderer.render(scene, camera);
  schedule();

  return {
    supported: true,
    setActivity(score) { speedFactor = Math.max(0.8, Math.min(2.4, 0.8 + Number(score || 0) * 0.05)); },
    dispose() {
      isDisposed = true;
      releaseWebGLLoop(ownerId);
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
      hostEl.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      hostEl.removeEventListener('dblclick', onDbl);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      for (const item of disposables) {
        if (item && typeof item.dispose === 'function') item.dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === hostEl) hostEl.removeChild(renderer.domElement);
    }
  };
}
