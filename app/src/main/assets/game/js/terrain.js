import * as THREE from 'three';

/**
 * Deterministic 2D pseudo-noise helpers for repeatable ancient forest terrain.
 */
function hash2D(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function valueNoise(x, z) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;

  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);

  const a = hash2D(ix, iz);
  const b = hash2D(ix + 1, iz);
  const c = hash2D(ix, iz + 1);
  const d = hash2D(ix + 1, iz + 1);

  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

function fbm(x, z) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < 4; i++) {
    value += amplitude * (valueNoise(x * frequency, z * frequency) * 2 - 1);
    frequency *= 2.04;
    amplitude *= 0.48;
  }
  return value;
}

export function getRiverCenterZ(x) {
  return -24.0 + Math.sin(x * 0.08) * 2.6;
}

export function getRiverHalfWidth(x) {
  return 3.4 + Math.cos(x * 0.11) * 0.65;
}

export function isOnStoneBridge(x, z) {
  return Math.abs(x) <= 3.1 && Math.abs(z - getRiverCenterZ(0)) <= 4.8;
}

/**
 * Returns the exact terrain elevation at world coordinates (x, z).
 * Keeps a calm flat glade near (0, 0) for the player spawn, a level courtyard
 * at the Lost Temple, a carved riverbed in Zone B, and a level stone bridge deck.
 */
export function getTerrainHeight(x, z) {
  const distFromCenter = Math.hypot(x, z);
  const distFromTemple = Math.hypot(x, z + 46);
  const distFromCave = Math.hypot(x - 21.5, z + 21.5);

  // Smooth clearing mask: flat near center (0..10m), temple courtyard, and hidden cave floor
  const centerFlat = THREE.MathUtils.smoothstep(distFromCenter, 7.5, 26);
  const templeFlat = THREE.MathUtils.smoothstep(distFromTemple, 9.0, 20.0);
  const caveFlat = THREE.MathUtils.smoothstep(distFromCave, 5.2, 11.5);
  const clearingBlend = centerFlat * templeFlat * caveFlat;

  // Winding forest footpaths: central sanctuary road + east Hidden Cave spur + west Waterfall spur
  const trailCurve = Math.sin(z * 0.055) * 3.2;
  const distToTrail = Math.abs(x - trailCurve);

  // Outer valley rim gently rises beyond 65m to cradle the forest, with stepped cliff ridges on flanks
  const rimStart = THREE.MathUtils.smoothstep(distFromCenter, 62, 115);
  const cliffRidge = Math.max(0, fbm(x * 0.045 - 2.1, z * 0.045 + 4.3)) * THREE.MathUtils.smoothstep(Math.abs(x), 46, 84) * 7.5;
  const rimHeight = rimStart * 11.5 + cliffRidge;

  let height = (rollingHills + microDetail) * clearingBlend + rimHeight;

  // Keep central, cave, and waterfall paths smoothly traversable
  if (z < 6 && z > -58 && distToTrail < 4.5) {
    const trailSmooth = 1.0 - THREE.MathUtils.smoothstep(distToTrail, 1.5, 4.5);
    height *= 1.0 - trailSmooth * 0.35;
  }

  // Carved Zone B riverbed (passes under the central Stone Bridge at x = 0)
  const riverZ = getRiverCenterZ(x);
  const riverHalfW = getRiverHalfWidth(x);
  const distToRiver = Math.abs(z - riverZ);
  if (distToRiver < riverHalfW + 3.0) {
    const channelMask = 1.0 - THREE.MathUtils.smoothstep(distToRiver, riverHalfW * 0.45, riverHalfW + 2.8);
    height = THREE.MathUtils.lerp(height, -1.35, channelMask);
  }

  // Stone bridge arch walk height along central road across the river
  if (isOnStoneBridge(x, z)) {
    const bridgeT = 1.0 - Math.abs(z - getRiverCenterZ(0)) / 4.8;
    const archY = 0.28 + Math.sin(Math.max(0, bridgeT) * Math.PI * 0.5) * 0.52;
    return Math.max(height, archY);
  }

  return height;
}

/**
 * Calculates terrain surface normal at (x, z) using finite differences.
 */
export function getTerrainNormal(x, z) {
  const eps = 0.4;
  const hL = getTerrainHeight(x - eps, z);
  const hR = getTerrainHeight(x + eps, z);
  const hD = getTerrainHeight(x, z - eps);
  const hU = getTerrainHeight(x, z + eps);
  return new THREE.Vector3(hL - hR, 2 * eps, hD - hU).normalize();
}

/**
 * Generates lightweight tileable procedural bump and roughness detail textures
 * so moss, soil, pebbles, and rock slopes catch sunlight with tactile PBR relief.
 */
function createTerrainDetailTextures() {
  const size = 128;
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d');

  if (bCtx && rCtx) {
    const bImg = bCtx.createImageData(size, size);
    const rImg = rCtx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Seamless wrapped pseudo-noise
        const nx = (x / size) * Math.PI * 2;
        const ny = (y / size) * Math.PI * 2;
        const n1 = Math.sin(nx * 3 + Math.cos(ny * 2)) * 0.5 + 0.5;
        const n2 = Math.cos(ny * 7 - Math.sin(nx * 5)) * 0.5 + 0.5;
        const grain = hash2D(x * 0.91, y * 1.13);
        const hVal = Math.floor(THREE.MathUtils.clamp((n1 * 0.45 + n2 * 0.3 + grain * 0.25) * 255, 0, 255));
        const rVal = Math.floor(THREE.MathUtils.clamp((0.68 + (1 - n1) * 0.22 + (grain - 0.5) * 0.14) * 255, 110, 255));

        const idx = (y * size + x) * 4;
        bImg.data[idx] = hVal;
        bImg.data[idx + 1] = hVal;
        bImg.data[idx + 2] = hVal;
        bImg.data[idx + 3] = 255;

        rImg.data[idx] = rVal;
        rImg.data[idx + 1] = rVal;
        rImg.data[idx + 2] = rVal;
        rImg.data[idx + 3] = 255;
      }
    }
    bCtx.putImageData(bImg, 0, 0);
    rCtx.putImageData(rImg, 0, 0);
  }

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(34, 34);

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(34, 34);

  return { bumpMap, roughnessMap };
}

/**
 * Helper distance from point (px, pz) to line segment (ax, az) -> (bx, bz).
 */
function distToSegment2D(px, pz, ax, az, bx, bz) {
  const vx = bx - ax;
  const vz = bz - az;
  const wx = px - ax;
  const wz = pz - az;
  const lenSq = vx * vx + vz * vz;
  const t = lenSq > 0 ? THREE.MathUtils.clamp((wx * vx + wz * vz) / lenSq, 0, 1) : 0;
  const cx = ax + t * vx;
  const cz = az + t * vz;
  return Math.hypot(px - cx, pz - cz);
}

/**
 * Builds the large 3D terrain mesh with natural moss, meadow grass, dirt paths,
 * riverbeds, Zone C scorched alien slate, cliff ridges, and procedural PBR relief.
 */
export function createTerrain() {
  const size = 240;
  const segments = 128;
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const posAttr = geometry.attributes.position;
  const vertexCount = posAttr.count;
  const colors = new Float32Array(vertexCount * 3);

  const lushMoss = new THREE.Color(0x2a5837);
  const meadowGreen = new THREE.Color(0x477b42);
  const sunlitGrass = new THREE.Color(0x638f48);
  const earthTrail = new THREE.Color(0x695642);
  const stoneTrail = new THREE.Color(0x5b645c);
  const riverBedColor = new THREE.Color(0x1f3c46);
  const alienZoneColor = new THREE.Color(0x3a3742);
  const highlandStone = new THREE.Color(0x4f5a55);
  const tempColor = new THREE.Color();

  for (let i = 0; i < vertexCount; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);
    const y = getTerrainHeight(x, z);
    posAttr.setY(i, y);
  }

  geometry.computeVertexNormals();
  const normAttr = geometry.attributes.normal;

  for (let i = 0; i < vertexCount; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);
    const slope = 1.0 - normAttr.getY(i);

    const patchNoise = valueNoise(x * 0.06 + 11.2, z * 0.06 - 4.7);
    const microNoise = valueNoise(x * 0.19 - 3.1, z * 0.19 + 7.4);
    const trailCurve = Math.sin(z * 0.055) * 3.2;
    const distToTrail = Math.abs(x - trailCurve);
    const distFromCenter = Math.hypot(x, z);

    tempColor.copy(lushMoss).lerp(meadowGreen, THREE.MathUtils.clamp(patchNoise * 1.15, 0, 1));
    if (distFromCenter < 16) {
      const gladeGlow = 1.0 - THREE.MathUtils.smoothstep(distFromCenter, 3, 16);
      tempColor.lerp(sunlitGrass, gladeGlow * 0.55);
    }

    // Winding central footpath leading north from Zone A through Zone B & Stone Bridge
    if (z < 6 && z > -64 && distToTrail < 3.4) {
      const pathFactor = (1.0 - distToTrail / 3.4) * 0.65;
      tempColor.lerp(z < -34 ? stoneTrail : earthTrail, pathFactor);
    }

    // East exploration trail toward Hidden Cave (21.5, -21.5)
    const eastPathDist = distToSegment2D(x, z, 2.5, -17.5, 16.5, -21.5);
    if (eastPathDist < 2.6) {
      tempColor.lerp(earthTrail, (1.0 - eastPathDist / 2.6) * 0.56);
    }

    // West exploration trail toward Waterfall Overlook & Cliffside Rune Seal (-22, -21)
    const westPathDist = distToSegment2D(x, z, -2.5, -18.5, -22.5, -20.5);
    if (westPathDist < 2.6) {
      tempColor.lerp(earthTrail, (1.0 - westPathDist / 2.6) * 0.54);
    }

    // Riverbank pebbles & cool slate tint near Zone B stream
    const distToRiver = Math.abs(z - getRiverCenterZ(x));
    const riverW = getRiverHalfWidth(x);
    if (distToRiver < riverW + 2.2) {
      const riverMask = 1.0 - THREE.MathUtils.smoothstep(distToRiver, riverW * 0.5, riverW + 2.2);
      tempColor.lerp(riverBedColor, riverMask * 0.85);
    }

    // Subtle alien wasteland tint in Zone C (northern Cyclops combat sector)
    if (z < -35) {
      const zoneCBlend = THREE.MathUtils.smoothstep(-z, 35, 52) * 0.36;
      tempColor.lerp(alienZoneColor, zoneCBlend);
    }

    const rockFactor = THREE.MathUtils.clamp((slope - 0.08) * 4.2 + THREE.MathUtils.smoothstep(y, 6.5, 13.5) * 0.65, 0, 1);
    tempColor.lerp(highlandStone, rockFactor);

    // Subtle micro ambient-occlusion crevice variation
    const aoFactor = 0.88 + microNoise * 0.16;
    tempColor.multiplyScalar(aoFactor);

    colors[i * 3] = tempColor.r;
    colors[i * 3 + 1] = tempColor.g;
    colors[i * 3 + 2] = tempColor.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const { bumpMap, roughnessMap } = createTerrainDetailTextures();
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    bumpMap,
    bumpScale: 0.22,
    roughnessMap,
    roughness: 0.9,
    metalness: 0.03,
    envMapIntensity: 0.65,
    flatShading: false,
  });

  const terrainMesh = new THREE.Mesh(geometry, material);
  terrainMesh.receiveShadow = true;
  terrainMesh.name = 'AncientForestTerrain';
  terrainMesh.userData.setWetness = (wetness = 0) => {
    const w = THREE.MathUtils.clamp(wetness, 0, 1);
    material.roughness = THREE.MathUtils.lerp(0.9, 0.44, w);
    material.envMapIntensity = THREE.MathUtils.lerp(0.65, 1.3, w);
  };

  return terrainMesh;
}

