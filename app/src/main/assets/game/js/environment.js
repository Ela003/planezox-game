import * as THREE from 'three';
import { getRiverCenterZ, getRiverHalfWidth, isOnStoneBridge } from './terrain.js';

export const FORGOTTEN_FOREST_ZONES = Object.freeze({
  ZONE_A: {
    id: 'ZONE_A',
    name: 'Zone A · Forest Entrance',
    subtitle: 'Sunlit Ancient Canopy',
    zMin: -18,
  },
  ZONE_B: {
    id: 'ZONE_B',
    name: 'Zone B · Ancient Guardian Ruins',
    subtitle: 'Whispering River & Hidden Cave',
    zMin: -36,
    zMax: -18,
  },
  ZONE_C: {
    id: 'ZONE_C',
    name: 'Zone C · Cyclops Combat Area',
    subtitle: 'Lost Temple & Alien Crash Site',
    zMax: -36,
  },
});

export function getZoneAt(x, z) {
  if (z >= FORGOTTEN_FOREST_ZONES.ZONE_A.zMin) {
    return FORGOTTEN_FOREST_ZONES.ZONE_A;
  }
  if (z > FORGOTTEN_FOREST_ZONES.ZONE_C.zMax) {
    return FORGOTTEN_FOREST_ZONES.ZONE_B;
  }
  return FORGOTTEN_FOREST_ZONES.ZONE_C;
}

function isNearFeatureExclusion(x, z, riverMargin = 2.0) {
  const inRiver = Math.abs(z - getRiverCenterZ(x)) < getRiverHalfWidth(x) + riverMargin;
  const onBridge = isOnStoneBridge(x, z);
  const inCaveArea =
    Math.hypot(x - 21.5, z + 21.5) < 7.8 ||
    (x > 11.0 && x < 24.5 && Math.abs(z + 21.5) < 4.5);
  const atWaterfall = Math.hypot(x + 26.5, z + 24.0) < 7.5;
  return inRiver || onBridge || inCaveArea || atWaterfall;
}

function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Generates a tileable procedural bark bump map & chiseled stone relief map
 * without external image dependencies so trunks and ancient ruins catch light crisply.
 */
function createForestSurfaceTextures() {
  const size = 96;
  const barkCanvas = document.createElement('canvas');
  barkCanvas.width = size;
  barkCanvas.height = size;
  const bCtx = barkCanvas.getContext('2d');

  const stoneCanvas = document.createElement('canvas');
  stoneCanvas.width = size;
  stoneCanvas.height = size;
  const sCtx = stoneCanvas.getContext('2d');

  if (bCtx && sCtx) {
    const bImg = bCtx.createImageData(size, size);
    const sImg = sCtx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = (x / size) * Math.PI * 2;
        const v = (y / size) * Math.PI * 2;
        const barkFurrow = Math.sin(u * 9 + Math.sin(v * 2) * 1.4) * 0.5 + 0.5;
        const barkGrain = Math.cos(v * 14 + u * 3) * 0.25 + 0.5;
        const bVal = Math.floor(THREE.MathUtils.clamp((barkFurrow * 0.72 + barkGrain * 0.28) * 255, 0, 255));

        const stoneCell = Math.sin(u * 4) * Math.cos(v * 4) * 0.35 + 0.5;
        const stoneChip = Math.sin(u * 13 + v * 11) * 0.2 + 0.5;
        const sVal = Math.floor(THREE.MathUtils.clamp((stoneCell * 0.6 + stoneChip * 0.4) * 255, 0, 255));

        const idx = (y * size + x) * 4;
        bImg.data[idx] = bVal;
        bImg.data[idx + 1] = bVal;
        bImg.data[idx + 2] = bVal;
        bImg.data[idx + 3] = 255;

        sImg.data[idx] = sVal;
        sImg.data[idx + 1] = sVal;
        sImg.data[idx + 2] = sVal;
        sImg.data[idx + 3] = 255;
      }
    }
    bCtx.putImageData(bImg, 0, 0);
    sCtx.putImageData(sImg, 0, 0);
  }

  const barkBump = new THREE.CanvasTexture(barkCanvas);
  barkBump.wrapS = THREE.RepeatWrapping;
  barkBump.wrapT = THREE.RepeatWrapping;
  barkBump.repeat.set(2, 4);

  const stoneBump = new THREE.CanvasTexture(stoneCanvas);
  stoneBump.wrapS = THREE.RepeatWrapping;
  stoneBump.wrapT = THREE.RepeatWrapping;
  stoneBump.repeat.set(2, 2);

  return { barkBump, stoneBump };
}

/**
 * Injects GPU world-space tree sway shader into MeshStandardMaterial
 * so trunks, branches, and leaf crowns sway cohesively without desyncing or breaking apart.
 * Smaller trees flex faster & further; massive ancient trunks sway slowly & softly.
 */
function applyTreeWindShader(material, windUniforms, isCanopy = false) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniforms.uTime;
    shader.uniforms.uWindStrength = windUniforms.uWindStrength;
    shader.vertexShader =
      `uniform float uTime;\nuniform float uWindStrength;\nattribute vec4 aTreeData;\n` +
      shader.vertexShader;

    const flutterBlock = isCanopy
      ? `
      float leafFlutter = sin(uTime * 3.8 + mvPosition.x * 2.1 + mvPosition.z * 1.9 + mvPosition.y) * 0.085;
      float leafFlutterZ = cos(uTime * 3.4 + mvPosition.z * 2.3 + mvPosition.x * 1.6) * 0.075;
      mvPosition.x += leafFlutter * uWindStrength;
      mvPosition.z += leafFlutterZ * uWindStrength;
      `
      : '';

    shader.vertexShader = shader.vertexShader.replace(
      'mvPosition = modelViewMatrix * mvPosition;',
      `
      float hAboveBase = max(0.0, mvPosition.y - aTreeData.y);
      float heightRatio = clamp(hAboveBase / 13.5, 0.0, 1.35);
      float phase = aTreeData.x * 0.37 + aTreeData.z * 0.53 + aTreeData.w * 2.1;
      float swaySpeed = mix(0.82, 1.48, clamp((aTreeData.w - 0.5) / 0.95, 0.0, 1.0));
      float mainSway = sin(uTime * swaySpeed + phase) * 0.28 + cos(uTime * (swaySpeed * 0.52) + phase * 1.6) * 0.12;
      float crossSway = cos(uTime * (swaySpeed * 0.85) + phase * 1.3) * 0.16;
      float gust = sin(uTime * 2.1 + mvPosition.x * 0.24 + mvPosition.z * 0.22) * 0.085;
      mvPosition.x += (mainSway * heightRatio * heightRatio + gust * heightRatio) * aTreeData.w * uWindStrength;
      mvPosition.z += (crossSway * heightRatio * heightRatio + gust * 0.65 * heightRatio) * aTreeData.w * uWindStrength;
      ${flutterBlock}
      mvPosition = modelViewMatrix * mvPosition;
      `
    );
  };
  material.customProgramCacheKey = () => (isCanopy ? 'tree-wind-canopy-v2' : 'tree-wind-wood-v2');
}

/**
 * Builds distant towering mountain peaks circling the horizon.
 */
function createBackgroundMountains(scene) {
  const mountainGroup = new THREE.Group();
  mountainGroup.name = 'DistantMountains';
  const rand = seededRandom(4201);

  const rockMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    metalness: 0.04,
    flatShading: true,
  });

  const peakCount = 34;
  for (let i = 0; i < peakCount; i++) {
    const angle = (i / peakCount) * Math.PI * 2 + (rand() - 0.5) * 0.14;
    const isFarRing = i % 2 === 0;
    const radius = isFarRing ? 126 + rand() * 22 : 102 + rand() * 16;
    const height = isFarRing ? 42 + rand() * 34 : 26 + rand() * 20;
    const baseWidth = isFarRing ? 24 + rand() * 14 : 18 + rand() * 10;

    const coneGeo = new THREE.ConeGeometry(baseWidth, height, 7, 4);
    const pos = coneGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const baseColor = new THREE.Color(0x2a3b34);
    const slateColor = new THREE.Color(0x4b5761);
    const snowColor = new THREE.Color(0xdce7ef);
    const temp = new THREE.Color();

    for (let v = 0; v < pos.count; v++) {
      const vx = pos.getX(v);
      const vy = pos.getY(v);
      const vz = pos.getZ(v);
      const normY = (vy + height * 0.5) / height;

      if (normY > 0.05 && normY < 0.96) {
        const jitter = (rand() - 0.5) * 2.8;
        pos.setX(v, vx + jitter);
        pos.setZ(v, vz + (rand() - 0.5) * 2.8);
      }

      if (normY > 0.72 && isFarRing) {
        temp.copy(slateColor).lerp(snowColor, THREE.MathUtils.smoothstep(normY, 0.72, 0.95));
      } else {
        temp.copy(baseColor).lerp(slateColor, THREE.MathUtils.smoothstep(normY, 0.12, 0.65));
      }

      colors[v * 3] = temp.r;
      colors[v * 3 + 1] = temp.g;
      colors[v * 3 + 2] = temp.b;
    }

    coneGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    coneGeo.computeVertexNormals();

    const peak = new THREE.Mesh(coneGeo, rockMat);
    peak.position.set(
      Math.cos(angle) * radius,
      height * 0.36,
      Math.sin(angle) * radius
    );
    peak.rotation.y = rand() * Math.PI * 2;
    mountainGroup.add(peak);
  }

  scene.add(mountainGroup);
  return mountainGroup;
}

/**
 * Builds instanced ancient fantasy trees (massive draw-call optimization: ~6 draw calls
 * instead of ~816 individual meshes) with organic asynchronous GPU vertex wind sway
 * and solid trunk colliders.
 */
function createAncientTrees(scene, getTerrainHeight, colliders, windUniforms, surfaceTextures) {
  const treeGroup = new THREE.Group();
  treeGroup.name = 'AncientTrees';
  const rand = seededRandom(8842);

  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x4b3828,
    bumpMap: surfaceTextures.barkBump,
    bumpScale: 0.18,
    roughness: 0.93,
    metalness: 0.02,
    flatShading: true,
  });
  applyTreeWindShader(barkMat, windUniforms, false);

  const vineMat = new THREE.MeshStandardMaterial({
    color: 0x2f5f2e,
    roughness: 0.88,
    side: THREE.DoubleSide,
  });
  applyTreeWindShader(vineMat, windUniforms, true);

  const canopyDefs = [
    new THREE.MeshStandardMaterial({ color: 0x264e2b, roughness: 0.86, envMapIntensity: 0.55, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x336332, roughness: 0.84, envMapIntensity: 0.6, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x437435, roughness: 0.82, envMapIntensity: 0.65, flatShading: true }),
  ];
  canopyDefs.forEach((m) => applyTreeWindShader(m, windUniforms, true));

  const coniferMat = new THREE.MeshStandardMaterial({
    color: 0x21452d,
    roughness: 0.88,
    envMapIntensity: 0.5,
    flatShading: true,
  });
  applyTreeWindShader(coniferMat, windUniforms, true);

  const trunkBaseGeo = new THREE.CylinderGeometry(0.45, 0.95, 1, 8);
  const rootBaseGeo = new THREE.ConeGeometry(0.42, 1.9, 5);
  const branchBaseGeo = new THREE.CylinderGeometry(0.16, 0.34, 1, 6);
  const vineBaseGeo = new THREE.PlaneGeometry(0.24, 1.0, 1, 3);
  const coniferTierGeo = new THREE.ConeGeometry(1.0, 1.4, 7);
  const canopyBaseGeos = [
    new THREE.IcosahedronGeometry(1, 1),
    new THREE.IcosahedronGeometry(1, 1),
    new THREE.IcosahedronGeometry(1, 1),
  ];

  const treeCount = 74;
  const placedTrees = [];
  const trunkTransforms = [];
  const rootTransforms = [];
  const branchTransforms = [];
  const vineTransforms = [];
  const coniferTransforms = [];
  const canopyTransforms = [[], [], []];

  const treeNode = new THREE.Object3D();
  const childNode = new THREE.Object3D();
  const worldMat = new THREE.Matrix4();

  for (let i = 0; i < treeCount; i++) {
    let x = 0;
    let z = 0;
    let attempts = 0;
    let valid = false;

    while (attempts < 25 && !valid) {
      const angle = rand() * Math.PI * 2;
      const dist = 12.5 + Math.pow(rand(), 0.72) * 68;
      x = Math.cos(angle) * dist;
      z = Math.sin(angle) * dist;

      const onCenterSightline = Math.abs(x) < 6.8 && z < 16 && z > -58;
      const onTempleCourtyard = Math.hypot(x, z + 46) < 13.5;
      const onZoneFeature = isNearFeatureExclusion(x, z, 2.2);
      const onAlienCrashSite = Math.hypot(x + 18, z + 50) < 5.5 || Math.hypot(x - 16, z + 42) < 5.5;
      const tooClose = placedTrees.some((t) => Math.hypot(t.x - x, t.z - z) < 5.6);
      if (!onCenterSightline && !onTempleCourtyard && !onZoneFeature && !onAlienCrashSite && !tooClose) {
        valid = true;
      }
      attempts++;
    }

    if (!valid) continue;
    placedTrees.push({ x, z });

    const y = getTerrainHeight(x, z);
    const scale = 0.82 + rand() * 1.28; // Small young trees (~0.82) to giant ancients (~2.1)
    const trunkHeight = (6.2 + rand() * 5.2) * scale;
    // Small trees flex significantly more than heavy thick trunks
    const windFlex = THREE.MathUtils.clamp(1.68 - scale * 0.54, 0.45, 1.45);
    const treeBaseY = y - 0.35;
    const anchor = [x, treeBaseY, z, windFlex];

    colliders.push({
      type: 'tree',
      x,
      z,
      radius: 0.76 * scale,
      height: trunkHeight,
    });

    treeNode.position.set(x, treeBaseY, z);
    treeNode.rotation.set(0, rand() * Math.PI * 2, 0);
    treeNode.scale.set(1, 1, 1);
    treeNode.updateMatrix();

    // Main trunk
    childNode.position.set(0, trunkHeight * 0.5, 0);
    childNode.rotation.set(0, 0, (rand() - 0.5) * 0.08);
    childNode.scale.set(scale, trunkHeight, scale);
    childNode.updateMatrix();
    worldMat.multiplyMatrices(treeNode.matrix, childNode.matrix);
    trunkTransforms.push({ matrix: worldMat.clone(), anchor });

    // Buttress roots
    for (let r = 0; r < 4; r++) {
      const rootAngle = (r / 4) * Math.PI * 2 + rand() * 0.5;
      childNode.position.set(
        Math.cos(rootAngle) * 0.75 * scale,
        0.55 * scale,
        Math.sin(rootAngle) * 0.75 * scale
      );
      childNode.rotation.set(Math.sin(rootAngle) * 0.65, 0, -Math.cos(rootAngle) * 0.65);
      childNode.scale.set(scale * 0.85, scale * 1.15, scale * 0.85);
      childNode.updateMatrix();
      worldMat.multiplyMatrices(treeNode.matrix, childNode.matrix);
      rootTransforms.push({ matrix: worldMat.clone(), anchor: [x, treeBaseY, z, 0.0] });
    }

    // Natural Tree Archetypes: Ridge Conifers on outer slopes / every 4th tree, Ancient Broadleaf Titans in glades
    const isConifer = dist > 38 && (i % 3 === 0);
    if (isConifer) {
      for (let tier = 0; tier < 3; tier++) {
        const tierR = (3.4 - tier * 0.72) * scale;
        const tierH = (3.8 - tier * 0.55) * scale;
        childNode.position.set(0, trunkHeight * (0.56 + tier * 0.24), 0);
        childNode.rotation.set(0, rand() * Math.PI, 0);
        childNode.scale.set(tierR, tierH, tierR);
        childNode.updateMatrix();
        worldMat.multiplyMatrices(treeNode.matrix, childNode.matrix);
        coniferTransforms.push({ matrix: worldMat.clone(), anchor });
      }
    } else {
      // Upper branches + layered canopies + hanging forest vines
      const branchCount = 3;
      for (let b = 0; b < branchCount; b++) {
        const bAngle = (b / branchCount) * Math.PI * 2 + rand() * 0.8;
        const bLen = (2.6 + rand() * 1.6) * scale;

        childNode.position.set(
          Math.cos(bAngle) * bLen * 0.36,
          trunkHeight * 0.82 + bLen * 0.25,
          Math.sin(bAngle) * bLen * 0.36
        );
        childNode.rotation.set(Math.sin(bAngle) * 0.72, 0, -Math.cos(bAngle) * 0.72);
        childNode.scale.set(scale, bLen, scale);
        childNode.updateMatrix();
        worldMat.multiplyMatrices(treeNode.matrix, childNode.matrix);
        branchTransforms.push({ matrix: worldMat.clone(), anchor });

        const matIdx = (i + b) % 3;
        const crownRadius = (2.5 + rand() * 1.2) * scale;
        childNode.position.set(
          Math.cos(bAngle) * bLen * 0.68,
          trunkHeight * 0.92 + bLen * 0.45,
          Math.sin(bAngle) * bLen * 0.68
        );
        childNode.rotation.set(0, rand() * Math.PI, 0);
        childNode.scale.set(crownRadius * 1.15, crownRadius * 0.78, crownRadius * 1.15);
        childNode.updateMatrix();
        worldMat.multiplyMatrices(treeNode.matrix, childNode.matrix);
        canopyTransforms[matIdx].push({ matrix: worldMat.clone(), anchor });

        // Hanging forest canopy vines (matching reference art depth)
        if (b < 2) {
          const vineLen = (2.1 + rand() * 1.8) * scale;
          childNode.position.set(
            Math.cos(bAngle) * bLen * 0.78,
            trunkHeight * 0.85 + bLen * 0.1 - vineLen * 0.45,
            Math.sin(bAngle) * bLen * 0.78
          );
          childNode.rotation.set(0, rand() * Math.PI, 0);
          childNode.scale.set(scale * 0.9, vineLen, 1);
          childNode.updateMatrix();
          worldMat.multiplyMatrices(treeNode.matrix, childNode.matrix);
          vineTransforms.push({ matrix: worldMat.clone(), anchor });
        }
      }

      // Apex canopy
      const apexIdx = i % 3;
      const apexSize = (3.4 + rand() * 1.3) * scale;
      childNode.position.set(0, trunkHeight + apexSize * 0.42, 0);
      childNode.rotation.set(0, rand() * Math.PI, 0);
      childNode.scale.set(apexSize * 1.2, apexSize * 0.85, apexSize * 1.2);
      childNode.updateMatrix();
      worldMat.multiplyMatrices(treeNode.matrix, childNode.matrix);
      canopyTransforms[apexIdx].push({ matrix: worldMat.clone(), anchor });
    }
  }

  function makeInstancedPart(geo, mat, items, name, castShadow = true) {
    if (items.length === 0) return null;
    const g = geo.clone();
    const attrArr = new Float32Array(items.length * 4);
    const mesh = new THREE.InstancedMesh(g, mat, items.length);
    mesh.name = name;
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;

    items.forEach((item, idx) => {
      mesh.setMatrixAt(idx, item.matrix);
      attrArr[idx * 4] = item.anchor[0];
      attrArr[idx * 4 + 1] = item.anchor[1];
      attrArr[idx * 4 + 2] = item.anchor[2];
      attrArr[idx * 4 + 3] = item.anchor[3];
    });
    g.setAttribute('aTreeData', new THREE.InstancedBufferAttribute(attrArr, 4));
    mesh.instanceMatrix.needsUpdate = true;
    treeGroup.add(mesh);
    return mesh;
  }

  const trunkMesh = makeInstancedPart(trunkBaseGeo, barkMat, trunkTransforms, 'TreeTrunksInstanced', true);
  const rootMesh = makeInstancedPart(rootBaseGeo, barkMat, rootTransforms, 'TreeRootsInstanced', false);
  const branchMesh = makeInstancedPart(branchBaseGeo, barkMat, branchTransforms, 'TreeBranchesInstanced', true);
  const vineMesh = makeInstancedPart(vineBaseGeo, vineMat, vineTransforms, 'TreeVinesInstanced', false);
  const coniferMesh = makeInstancedPart(coniferTierGeo, coniferMat, coniferTransforms, 'TreeConifersInstanced', true);
  const canopyMeshes = canopyTransforms
    .map((items, idx) =>
      makeInstancedPart(canopyBaseGeos[idx], canopyDefs[idx], items, `TreeCanopyInstanced_${idx}`, true)
    )
    .filter(Boolean);

  scene.add(treeGroup);
  return {
    group: treeGroup,
    treeCount: placedTrees.length,
    canopyMeshes,
    trunkMesh,
    rootMesh,
    branchMesh,
    vineMesh,
    coniferMesh,
    setShadows(enabled) {
      if (trunkMesh) trunkMesh.castShadow = enabled;
      if (branchMesh) branchMesh.castShadow = enabled;
      if (coniferMesh) coniferMesh.castShadow = enabled;
      canopyMeshes.forEach((m) => { m.castShadow = enabled; });
    },
  };
}

/**
 * Builds sculpted mossy rocks, boulders, and weathered ancient stone pillars with solid colliders.
 */
function createRocksAndMonoliths(scene, getTerrainHeight, colliders) {
  const rockGroup = new THREE.Group();
  rockGroup.name = 'ForestRocks';
  const rand = seededRandom(5109);

  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x626b63,
    roughness: 0.92,
    metalness: 0.04,
    flatShading: true,
  });

  const mossyRockMat = new THREE.MeshStandardMaterial({
    color: 0x4c614c,
    roughness: 0.95,
    metalness: 0.02,
    flatShading: true,
  });

  const baseGeo = new THREE.DodecahedronGeometry(1, 1);
  const pos = baseGeo.attributes.position;
  for (let v = 0; v < pos.count; v++) {
    const vx = pos.getX(v);
    const vy = pos.getY(v);
    const vz = pos.getZ(v);
    const n = 0.82 + 0.34 * Math.sin(vx * 3.1 + vy * 2.7 + vz * 4.3);
    pos.setXYZ(v, vx * n, vy * n, vz * n);
  }
  baseGeo.computeVertexNormals();

  for (let i = 0; i < 62; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 8.2 + rand() * 68;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    // Keep immediate central trail, river/bridge, hidden cave, & Lost Temple sanctuary navigable
    const onMainTrail = Math.abs(x) < 4.8 && z < 14 && z > -55;
    const onTempleCenter = Math.hypot(x, z + 46) < 9.5;
    const onZoneFeature = isNearFeatureExclusion(x, z, 1.5);
    if (onMainTrail || onTempleCenter || onZoneFeature) continue;

    const y = getTerrainHeight(x, z);
    const sx = 0.55 + rand() * 1.8;
    const sy = 0.4 + rand() * 1.1;
    const sz = 0.55 + rand() * 1.7;

    const rock = new THREE.Mesh(baseGeo, i % 3 === 0 ? mossyRockMat : rockMat);
    rock.position.set(x, y + sy * 0.25, z);
    rock.scale.set(sx, sy, sz);
    rock.rotation.set(rand() * 0.4, rand() * Math.PI * 2, rand() * 0.4);
    rock.castShadow = true;
    rock.receiveShadow = true;
    rockGroup.add(rock);

    const colRadius = Math.max(sx, sz) * 0.78;
    if (colRadius >= 0.65) {
      colliders.push({
        type: 'rock',
        x,
        z,
        radius: colRadius,
        height: sy * 1.45,
      });
    }
  }

  const pillarGeo = new THREE.BoxGeometry(1.1, 4.2, 0.9, 2, 4, 2);
  const pPos = pillarGeo.attributes.position;
  for (let v = 0; v < pPos.count; v++) {
    pPos.setX(v, pPos.getX(v) + (rand() - 0.5) * 0.14);
    pPos.setZ(v, pPos.getZ(v) + (rand() - 0.5) * 0.14);
  }
  pillarGeo.computeVertexNormals();

  const pillarAngles = [0.6, 1.85, 3.35, 4.95];
  pillarAngles.forEach((a, idx) => {
    const dist = 14 + idx * 1.1;
    const x = Math.cos(a) * dist;
    const z = Math.sin(a) * dist;
    const y = getTerrainHeight(x, z);
    const pillar = new THREE.Mesh(pillarGeo, mossyRockMat);
    pillar.position.set(x, y + 1.5, z);
    pillar.rotation.set((rand() - 0.5) * 0.16, a + 0.4, (rand() - 0.5) * 0.18);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    rockGroup.add(pillar);

    colliders.push({
      type: 'pillar',
      x,
      z,
      radius: 0.88,
      height: 3.6,
    });
  });

  scene.add(rockGroup);
  return rockGroup;
}

/**
 * Builds instanced 3D grass blades with GPU wind gusts + player proximity bending.
 */
function createInstancedGrass(scene, getTerrainHeight, sharedUniforms) {
  const maxGrassCount = 6500;
  const rand = seededRandom(9921);

  const bladeGeo = new THREE.PlaneGeometry(0.14, 0.72, 1, 3);
  bladeGeo.translate(0, 0.36, 0);
  const pos = bladeGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = y / 0.72;
    pos.setX(i, pos.getX(i) * (1.0 - t * 0.85));
    pos.setZ(i, t * t * 0.14);
  }
  bladeGeo.computeVertexNormals();

  const grassMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.85,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  grassMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = sharedUniforms.uTime;
    shader.uniforms.uWindStrength = sharedUniforms.uWindStrength;
    shader.uniforms.uPlayerPos = sharedUniforms.uPlayerPos;
    shader.vertexShader =
      `uniform float uTime;\nuniform float uWindStrength;\nuniform vec3 uPlayerPos;\n` +
      shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      'mvPosition = modelViewMatrix * mvPosition;',
      `
      float swayFactor = clamp(transformed.y / 0.72, 0.0, 1.0);
      float swaySq = swayFactor * swayFactor;
      vec3 instCenter = instanceMatrix[3].xyz;
      float wave = sin(uTime * 2.15 + instCenter.x * 0.38 + instCenter.z * 0.31) * 0.15;
      float gust = cos(uTime * 1.15 + instCenter.z * 0.18 - instCenter.x * 0.14) * 0.085;
      mvPosition.x += (wave + gust) * swaySq * uWindStrength;
      mvPosition.z += (wave * 0.55 - gust * 0.35) * swaySq * uWindStrength;

      vec2 toBlade = instCenter.xz - uPlayerPos.xz;
      float distP = length(toBlade);
      float push = smoothstep(1.55, 0.25, distP);
      vec2 pushDir = distP > 0.005 ? toBlade / distP : vec2(0.0, 1.0);
      mvPosition.xz += pushDir * push * 0.44 * swayFactor;
      mvPosition.y -= push * 0.14 * swaySq;

      mvPosition = modelViewMatrix * mvPosition;
      `
    );
  };
  grassMat.customProgramCacheKey = () => 'grass-wind-player-v2';

  const grassMesh = new THREE.InstancedMesh(bladeGeo, grassMat, maxGrassCount);
  grassMesh.receiveShadow = true;
  grassMesh.name = 'AncientGrass';

  const dummy = new THREE.Object3D();
  const c1 = new THREE.Color(0x477734);
  const c2 = new THREE.Color(0x6e9844);
  const c3 = new THREE.Color(0x3a612d);
  const bladeColor = new THREE.Color();

  for (let i = 0; i < maxGrassCount; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = Math.sqrt(rand()) * 62;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    // Skip grass blades under stone bridge, deep river channel, and inside Hidden Cave
    if (
      isOnStoneBridge(x, z) ||
      Math.abs(z - getRiverCenterZ(x)) < getRiverHalfWidth(x) * 0.72 ||
      Math.hypot(x - 21.5, z + 21.5) < 5.6
    ) {
      dummy.position.set(0, -40, 0);
      dummy.scale.set(0.01, 0.01, 0.01);
      dummy.updateMatrix();
      grassMesh.setMatrixAt(i, dummy.matrix);
      grassMesh.setColorAt(i, c1);
      continue;
    }
    const y = getTerrainHeight(x, z);

    const scaleH = 0.65 + rand() * 0.95;
    const scaleW = 0.8 + rand() * 0.6;

    dummy.position.set(x, y - 0.04, z);
    dummy.rotation.set((rand() - 0.5) * 0.15, rand() * Math.PI * 2, (rand() - 0.5) * 0.15);
    dummy.scale.set(scaleW, scaleH, 1);
    dummy.updateMatrix();
    grassMesh.setMatrixAt(i, dummy.matrix);

    const mixVal = rand();
    if (mixVal < 0.5) {
      bladeColor.copy(c1).lerp(c2, mixVal * 2);
    } else {
      bladeColor.copy(c2).lerp(c3, (mixVal - 0.5) * 2);
    }
    grassMesh.setColorAt(i, bladeColor);
  }

  grassMesh.instanceMatrix.needsUpdate = true;
  if (grassMesh.instanceColor) grassMesh.instanceColor.needsUpdate = true;
  scene.add(grassMesh);

  return {
    grassMesh,
    maxGrassCount,
    setDensity(ratio) {
      grassMesh.count = Math.floor(maxGrassCount * THREE.MathUtils.clamp(ratio, 0.25, 1.0));
    },
  };
}

/**
 * Builds wind-animated undergrowth bushes + splayed 3D fern fronds that rustle & bend when Kael passes.
 */
function createForestBushes(scene, getTerrainHeight, sharedUniforms) {
  const bushGeo = new THREE.DodecahedronGeometry(0.65, 1);
  const bushMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    flatShading: true,
  });

  const applyFoliageShader = (mat, key) => {
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = sharedUniforms.uTime;
      shader.uniforms.uWindStrength = sharedUniforms.uWindStrength;
      shader.uniforms.uPlayerPos = sharedUniforms.uPlayerPos;
      shader.vertexShader =
        `uniform float uTime;\nuniform float uWindStrength;\nuniform vec3 uPlayerPos;\n` +
        shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        'mvPosition = modelViewMatrix * mvPosition;',
        `
        float bend = clamp((transformed.y + 0.55) / 1.15, 0.0, 1.0);
        vec3 instCenter = instanceMatrix[3].xyz;
        float sway = sin(uTime * 1.65 + instCenter.x * 0.45 + instCenter.z * 0.35) * 0.095;
        mvPosition.x += sway * bend * uWindStrength;
        mvPosition.z += cos(uTime * 1.35 + instCenter.z * 0.4) * 0.065 * bend * uWindStrength;

        vec2 toBush = instCenter.xz - uPlayerPos.xz;
        float d = length(toBush);
        float push = smoothstep(1.65, 0.35, d);
        vec2 pushDir = d > 0.005 ? toBush / d : vec2(0.0, 1.0);
        mvPosition.xz += pushDir * push * 0.36 * bend;

        mvPosition = modelViewMatrix * mvPosition;
        `
      );
    };
    mat.customProgramCacheKey = () => key;
  };

  applyFoliageShader(bushMat, 'forest-bush-sway-v2');

  const maxBushCount = 140;
  const bushMesh = new THREE.InstancedMesh(bushGeo, bushMat, maxBushCount);
  bushMesh.castShadow = true;
  bushMesh.receiveShadow = true;
  bushMesh.name = 'ForestBushes';

  const rand = seededRandom(7321);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  for (let i = 0; i < maxBushCount; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 9.5 + rand() * 60;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    if (isNearFeatureExclusion(x, z, 1.0)) {
      dummy.position.set(0, -40, 0);
      dummy.scale.set(0.01, 0.01, 0.01);
      dummy.updateMatrix();
      bushMesh.setMatrixAt(i, dummy.matrix);
      bushMesh.setColorAt(i, color.setHex(0x2d582e));
      continue;
    }
    const y = getTerrainHeight(x, z);

    const s = 0.7 + rand() * 1.1;
    dummy.position.set(x, y + s * 0.28, z);
    dummy.rotation.set(0, rand() * Math.PI * 2, 0);
    dummy.scale.set(s * 1.25, s * 0.72, s * 1.25);
    dummy.updateMatrix();
    bushMesh.setMatrixAt(i, dummy.matrix);

    color.setHSL(0.28 + rand() * 0.06, 0.38 + rand() * 0.14, 0.22 + rand() * 0.12);
    bushMesh.setColorAt(i, color);
  }

  bushMesh.instanceMatrix.needsUpdate = true;
  if (bushMesh.instanceColor) bushMesh.instanceColor.needsUpdate = true;
  scene.add(bushMesh);

  // Splayed 3D Forest Ferns (crossed arched frond blades around trees & riverbanks)
  const fernGeo = new THREE.ConeGeometry(0.48, 0.92, 5, 2, true);
  fernGeo.translate(0, 0.46, 0);
  const fPos = fernGeo.attributes.position;
  for (let i = 0; i < fPos.count; i++) {
    const fy = fPos.getY(i);
    const flare = 1.0 + fy * 0.85;
    fPos.setX(i, fPos.getX(i) * flare);
    fPos.setZ(i, fPos.getZ(i) * flare);
  }
  fernGeo.computeVertexNormals();

  const fernMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.82,
    side: THREE.DoubleSide,
    flatShading: true,
  });
  applyFoliageShader(fernMat, 'forest-fern-sway-v1');

  const maxFernCount = 340;
  const fernMesh = new THREE.InstancedMesh(fernGeo, fernMat, maxFernCount);
  fernMesh.name = 'ForestFernsInstanced';
  fernMesh.receiveShadow = true;

  for (let i = 0; i < maxFernCount; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 5.5 + Math.sqrt(rand()) * 58;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    if (isOnStoneBridge(x, z) || Math.abs(z - getRiverCenterZ(x)) < getRiverHalfWidth(x) * 0.8) {
      dummy.position.set(0, -40, 0);
      dummy.scale.set(0.01, 0.01, 0.01);
      dummy.updateMatrix();
      fernMesh.setMatrixAt(i, dummy.matrix);
      fernMesh.setColorAt(i, color.setHex(0x366d32));
      continue;
    }
    const y = getTerrainHeight(x, z);
    const fs = 0.65 + rand() * 0.85;
    dummy.position.set(x, y - 0.05, z);
    dummy.rotation.set(Math.PI + (rand() - 0.5) * 0.25, rand() * Math.PI * 2, (rand() - 0.5) * 0.25);
    dummy.scale.set(fs * 1.15, fs, fs * 1.15);
    dummy.updateMatrix();
    fernMesh.setMatrixAt(i, dummy.matrix);
    color.setHSL(0.27 + rand() * 0.07, 0.45 + rand() * 0.16, 0.24 + rand() * 0.11);
    fernMesh.setColorAt(i, color);
  }
  fernMesh.instanceMatrix.needsUpdate = true;
  if (fernMesh.instanceColor) fernMesh.instanceColor.needsUpdate = true;
  scene.add(fernMesh);

  return {
    bushMesh,
    fernMesh,
    maxBushCount,
    maxFernCount,
    setDensity(ratio, castShadows = true) {
      bushMesh.count = Math.floor(maxBushCount * THREE.MathUtils.clamp(ratio, 0.4, 1.0));
      bushMesh.castShadow = castShadows;
      fernMesh.count = Math.floor(maxFernCount * THREE.MathUtils.clamp(ratio, 0.35, 1.0));
    },
  };
}

/**
 * Builds instanced colorful forest wildflowers swaying with wind & parting for Kael.
 */
function createForestFlowers(scene, getTerrainHeight, sharedUniforms) {
  const maxFlowerCount = 420;
  const rand = seededRandom(6417);

  // Simple stylized 3D blossom + stem silhouette
  const flowerGeo = new THREE.ConeGeometry(0.14, 0.42, 5);
  flowerGeo.translate(0, 0.21, 0);
  const flowerMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.75,
    metalness: 0.05,
    flatShading: true,
  });

  flowerMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = sharedUniforms.uTime;
    shader.uniforms.uWindStrength = sharedUniforms.uWindStrength;
    shader.uniforms.uPlayerPos = sharedUniforms.uPlayerPos;
    shader.vertexShader =
      `uniform float uTime;\nuniform float uWindStrength;\nuniform vec3 uPlayerPos;\n` +
      shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      'mvPosition = modelViewMatrix * mvPosition;',
      `
      float bend = clamp(transformed.y / 0.42, 0.0, 1.0);
      vec3 instCenter = instanceMatrix[3].xyz;
      float wave = sin(uTime * 2.4 + instCenter.x * 0.55 + instCenter.z * 0.45) * 0.12;
      mvPosition.x += wave * bend * uWindStrength;
      mvPosition.z += cos(uTime * 2.0 + instCenter.z * 0.5) * 0.08 * bend * uWindStrength;

      vec2 toFl = instCenter.xz - uPlayerPos.xz;
      float d = length(toFl);
      float push = smoothstep(1.35, 0.22, d);
      vec2 pushDir = d > 0.005 ? toFl / d : vec2(0.0, 1.0);
      mvPosition.xz += pushDir * push * 0.34 * bend;

      mvPosition = modelViewMatrix * mvPosition;
      `
    );
  };
  flowerMat.customProgramCacheKey = () => 'forest-flowers-v1';

  const flowerMesh = new THREE.InstancedMesh(flowerGeo, flowerMat, maxFlowerCount);
  flowerMesh.name = 'ForestFlowers';
  flowerMesh.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const palette = [
    new THREE.Color(0xf6cf55), // Warmier golden bloom
    new THREE.Color(0x6ad7ff), // Ether cyan wildflower
    new THREE.Color(0xd58eff), // Twilight lavender blossom
    new THREE.Color(0xff7f66), // Forest coral poppy
    new THREE.Color(0xf4f6f0), // Woodland white blossom
  ];

  for (let i = 0; i < maxFlowerCount; i++) {
    const angle = rand() * Math.PI * 2;
    const dist = 4.5 + Math.sqrt(rand()) * 54;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const y = getTerrainHeight(x, z);

    const s = 0.75 + rand() * 0.65;
    dummy.position.set(x, y - 0.02, z);
    dummy.rotation.set(Math.PI + (rand() - 0.5) * 0.25, rand() * Math.PI * 2, (rand() - 0.5) * 0.25);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    flowerMesh.setMatrixAt(i, dummy.matrix);
    flowerMesh.setColorAt(i, palette[i % palette.length]);
  }

  flowerMesh.instanceMatrix.needsUpdate = true;
  if (flowerMesh.instanceColor) flowerMesh.instanceColor.needsUpdate = true;
  scene.add(flowerMesh);

  return {
    flowerMesh,
    maxFlowerCount,
    setDensity(ratio) {
      flowerMesh.count = Math.floor(maxFlowerCount * THREE.MathUtils.clamp(ratio, 0.3, 1.0));
    },
  };
}

/**
 * Builds lightweight, pooled forest atmosphere & wildlife:
 * - Falling drifting leaves
 * - Small glowing forest insects / fireflies
 * - High-soaring distant flying birds
 * - Slow moving low ground mist wisps
 */
function createForestAtmosphere(scene, getTerrainHeight) {
  const rand = seededRandom(3197);

  // 1. Falling Leaves (InstancedMesh)
  const maxLeaves = 110;
  const leafGeo = new THREE.PlaneGeometry(0.18, 0.11);
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.78,
    side: THREE.DoubleSide,
  });
  const leafMesh = new THREE.InstancedMesh(leafGeo, leafMat, maxLeaves);
  leafMesh.name = 'FallingLeaves';
  const leafColors = [
    new THREE.Color(0x528238),
    new THREE.Color(0x7ca042),
    new THREE.Color(0xc2933b),
    new THREE.Color(0x9b642c),
  ];
  const leavesData = [];
  const dummy = new THREE.Object3D();

  for (let i = 0; i < maxLeaves; i++) {
    const lx = (rand() - 0.5) * 44;
    const lz = (rand() - 0.5) * 44;
    const ly = getTerrainHeight(lx, lz) + 1.5 + rand() * 12;
    leavesData.push({
      x: lx,
      y: ly,
      z: lz,
      fallSpeed: 0.65 + rand() * 0.75,
      swayAmp: 0.5 + rand() * 0.9,
      phase: rand() * Math.PI * 2,
      spinX: (rand() - 0.5) * 2.4,
      spinY: (rand() - 0.5) * 3.1,
    });
    leafMesh.setColorAt(i, leafColors[i % leafColors.length]);
  }
  if (leafMesh.instanceColor) leafMesh.instanceColor.needsUpdate = true;
  scene.add(leafMesh);

  // 2. Small Glowing Forest Insects / Fireflies (Points)
  const maxInsects = 64;
  const insectPositions = new Float32Array(maxInsects * 3);
  const insectBase = [];
  for (let i = 0; i < maxInsects; i++) {
    const ix = (rand() - 0.5) * 42;
    const iz = (rand() - 0.5) * 42;
    const iy = getTerrainHeight(ix, iz) + 0.6 + rand() * 2.4;
    insectBase.push({ x: ix, y: iy, z: iz, speed: 0.8 + rand() * 1.4, phase: rand() * Math.PI * 2 });
    insectPositions[i * 3] = ix;
    insectPositions[i * 3 + 1] = iy;
    insectPositions[i * 3 + 2] = iz;
  }
  const insectGeo = new THREE.BufferGeometry();
  insectGeo.setAttribute('position', new THREE.BufferAttribute(insectPositions, 3));
  const insectMat = new THREE.PointsMaterial({
    color: 0xd9ff7a,
    size: 0.14,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const insectPoints = new THREE.Points(insectGeo, insectMat);
  insectPoints.name = 'ForestInsects';
  scene.add(insectPoints);

  // 3. Flying Birds in the Distant Sky (Instanced wing V silhouettes with GPU wing-flap)
  const maxBirds = 14;
  const birdGeo = new THREE.BufferGeometry();
  // Two swept wings sharing a central body spine (6 vertices = 2 triangles)
  const birdVerts = new Float32Array([
    0.0, 0.0, 0.28,   -0.95, 0.12, -0.18,   0.0, 0.0, -0.22,
    0.0, 0.0, 0.28,    0.0, 0.0, -0.22,     0.95, 0.12, -0.18,
  ]);
  birdGeo.setAttribute('position', new THREE.BufferAttribute(birdVerts, 3));
  birdGeo.computeVertexNormals();

  const birdUniforms = { uTime: { value: 0 } };
  const birdMat = new THREE.MeshBasicMaterial({
    color: 0x1e2630,
    side: THREE.DoubleSide,
  });
  birdMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = birdUniforms.uTime;
    shader.vertexShader =
      `uniform float uTime;\nattribute float aBirdPhase;\n` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      float wingDist = abs(position.x);
      transformed.y += sin(uTime * 7.2 + aBirdPhase) * wingDist * 0.48;
      `
    );
  };
  birdMat.customProgramCacheKey = () => 'flying-birds-v1';

  const birdPhaseArr = new Float32Array(maxBirds);
  const birdsData = [];
  for (let i = 0; i < maxBirds; i++) {
    const flockOrbit = 38 + (i % 3) * 18 + rand() * 14;
    const angle = (i / maxBirds) * Math.PI * 2 + rand() * 0.35;
    birdPhaseArr[i] = rand() * Math.PI * 2;
    birdsData.push({
      radius: flockOrbit,
      angle,
      speed: 0.12 + rand() * 0.08,
      altitude: 25 + (i % 4) * 4.5 + rand() * 5,
      scale: 0.75 + rand() * 0.55,
    });
  }
  birdGeo.setAttribute('aBirdPhase', new THREE.InstancedBufferAttribute(birdPhaseArr, 1));
  const birdMesh = new THREE.InstancedMesh(birdGeo, birdMat, maxBirds);
  birdMesh.name = 'FlyingBirds';
  birdMesh.frustumCulled = false;
  scene.add(birdMesh);

  // 4. Moving Low Ground Mist Wisps
  function makeMistTexture() {
    const c = document.createElement('canvas');
    c.width = 96;
    c.height = 96;
    const ctx = c.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(48, 48, 6, 48, 48, 46);
      grad.addColorStop(0.0, 'rgba(220, 236, 245, 0.24)');
      grad.addColorStop(0.55, 'rgba(210, 230, 240, 0.09)');
      grad.addColorStop(1.0, 'rgba(210, 230, 240, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 96, 96);
    }
    return new THREE.CanvasTexture(c);
  }

  const mistGroup = new THREE.Group();
  mistGroup.name = 'ForestGroundMist';
  const mistGeo = new THREE.PlaneGeometry(14, 14);
  mistGeo.rotateX(-Math.PI / 2);
  const mistMat = new THREE.MeshBasicMaterial({
    map: makeMistTexture(),
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });

  const mistPatches = [];
  for (let i = 0; i < 14; i++) {
    const mx = (rand() - 0.5) * 86;
    const mz = (rand() - 0.5) * 86;
    const my = getTerrainHeight(mx, mz) + 0.55;
    const patch = new THREE.Mesh(mistGeo, mistMat);
    patch.position.set(mx, my, mz);
    patch.rotation.y = rand() * Math.PI * 2;
    mistGroup.add(patch);
    mistPatches.push({ mesh: patch, baseX: mx, baseZ: mz, phase: rand() * Math.PI * 2 });
  }
  scene.add(mistGroup);

  let activeLeaves = maxLeaves;
  let activeInsects = maxInsects;
  let activeBirds = maxBirds;

  return {
    leafMesh,
    insectPoints,
    birdMesh,
    mistGroup,
    setQuality(level) {
      if (level === 'low') {
        activeLeaves = 42;
        activeInsects = 24;
        activeBirds = 6;
        mistGroup.visible = false;
      } else if (level === 'medium') {
        activeLeaves = 78;
        activeInsects = 48;
        activeBirds = 10;
        mistGroup.visible = true;
      } else {
        activeLeaves = maxLeaves;
        activeInsects = maxInsects;
        activeBirds = maxBirds;
        mistGroup.visible = true;
      }
      leafMesh.count = activeLeaves;
      insectGeo.setDrawRange(0, activeInsects);
      birdMesh.count = activeBirds;
    },
    update(dt, time, playerPos) {
      birdUniforms.uTime.value = time;
      const px = playerPos ? playerPos.x : 0;
      const pz = playerPos ? playerPos.z : 0;

      // Update Falling Leaves around player
      for (let i = 0; i < activeLeaves; i++) {
        const l = leavesData[i];
        l.y -= l.fallSpeed * dt;
        const driftX = Math.sin(time * 1.15 + l.phase) * l.swayAmp * dt;
        const driftZ = Math.cos(time * 0.95 + l.phase * 1.3) * l.swayAmp * 0.7 * dt;
        l.x += driftX + 0.35 * dt;
        l.z += driftZ;

        if (l.x - px > 22) l.x -= 44;
        if (l.x - px < -22) l.x += 44;
        if (l.z - pz > 22) l.z -= 44;
        if (l.z - pz < -22) l.z += 44;

        const floorY = getTerrainHeight(l.x, l.z) + 0.15;
        if (l.y < floorY) {
          l.y = floorY + 8.5 + (i % 6) * 1.1;
        }

        dummy.position.set(l.x, l.y, l.z);
        dummy.rotation.set(time * l.spinX + l.phase, time * l.spinY, Math.sin(time * 2 + l.phase) * 0.7);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        leafMesh.setMatrixAt(i, dummy.matrix);
      }
      leafMesh.instanceMatrix.needsUpdate = true;

      // Update Glowing Insects
      const insArr = insectGeo.attributes.position.array;
      for (let i = 0; i < activeInsects; i++) {
        const ins = insectBase[i];
        const ix = ins.x + Math.sin(time * ins.speed + ins.phase) * 1.65;
        const iz = ins.z + Math.cos(time * (ins.speed * 0.85) + ins.phase * 1.4) * 1.65;
        const iy = ins.y + Math.sin(time * 2.1 + ins.phase) * 0.38;
        insArr[i * 3] = ix;
        insArr[i * 3 + 1] = iy;
        insArr[i * 3 + 2] = iz;
      }
      insectGeo.attributes.position.needsUpdate = true;
      insectMat.opacity = 0.62 + Math.sin(time * 3.4) * 0.25;

      // Update Distant Flying Birds
      for (let i = 0; i < activeBirds; i++) {
        const b = birdsData[i];
        b.angle += b.speed * dt;
        const bx = Math.cos(b.angle) * b.radius;
        const bz = Math.sin(b.angle) * b.radius;
        const by = b.altitude + Math.sin(time * 0.7 + i) * 1.6;
        dummy.position.set(bx, by, bz);
        dummy.rotation.set(0, -b.angle + Math.PI * 0.5, Math.sin(time * 0.8 + i) * 0.15);
        dummy.scale.setScalar(b.scale);
        dummy.updateMatrix();
        birdMesh.setMatrixAt(i, dummy.matrix);
      }
      birdMesh.instanceMatrix.needsUpdate = true;

      // Drift Ground Mist gently across forest hollows
      if (mistGroup.visible) {
        for (let i = 0; i < mistPatches.length; i++) {
          const m = mistPatches[i];
          m.mesh.position.x = m.baseX + Math.sin(time * 0.18 + m.phase) * 5.2;
          m.mesh.position.z = m.baseZ + Math.cos(time * 0.14 + m.phase) * 4.4;
        }
      }
    },
  };
}

/**
 * Builds The Lost Temple archway, opening gate doors, switch pedestal,
 * Ancient Artifact, Elder Spirit NPC, collectible potion herbs, and temple colliders.
 */
function createLostTempleAndInteractables(scene, getTerrainHeight, colliders, surfaceTextures) {
  const templeGroup = new THREE.Group();
  templeGroup.name = 'LostTemple';

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x5c665f,
    bumpMap: surfaceTextures.stoneBump,
    bumpScale: 0.16,
    roughness: 0.88,
    envMapIntensity: 0.8,
    flatShading: true,
  });
  const darkStoneMat = new THREE.MeshStandardMaterial({
    color: 0x3b443e,
    bumpMap: surfaceTextures.stoneBump,
    bumpScale: 0.14,
    roughness: 0.9,
    envMapIntensity: 0.75,
    flatShading: true,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xe5b95c,
    emissive: 0x6e4f12,
    emissiveIntensity: 0.65,
    metalness: 0.78,
    roughness: 0.22,
    envMapIntensity: 1.35,
  });
  const runeGlowMat = new THREE.MeshStandardMaterial({
    color: 0x5beaff,
    emissive: 0x16b8ff,
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });

  const tx = 0;
  const tz = -46;
  const ty = getTerrainHeight(tx, tz);

  // Broad Stepped Ancient Stone Stairs leading up to the Temple Courtyard (z = -35.8..-39.8)
  const stairsGroup = new THREE.Group();
  stairsGroup.name = 'TempleStairs';
  for (let s = 0; s < 5; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(10.8 - s * 0.35, 0.22, 0.95), darkStoneMat);
    step.position.set(0, ty + s * 0.08 + 0.02, -35.8 - s * 0.85);
    step.receiveShadow = true;
    step.castShadow = true;
    stairsGroup.add(step);
  }
  templeGroup.add(stairsGroup);

  const platform = new THREE.Mesh(new THREE.BoxGeometry(17.5, 0.7, 15.5), darkStoneMat);
  platform.position.set(tx, ty + 0.15, tz - 1);
  platform.receiveShadow = true;
  platform.castShadow = true;
  templeGroup.add(platform);

  // Flanking Ancient Fluted Colonnade & Broken Stone Walls (inspired by enchanted ruin stairs)
  const colonnadeGroup = new THREE.Group();
  colonnadeGroup.name = 'TempleColonnade';
  [-8.2, 8.2].forEach((sideX) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.3, 11.5), darkStoneMat);
    wall.position.set(sideX, ty + 1.15, tz + 1.8);
    wall.castShadow = true;
    wall.receiveShadow = true;
    colonnadeGroup.add(wall);

    // Broken wall cap stones & intact colonnade columns
    [-3.2, 0.4, 4.0].forEach((offZ, idx) => {
      const colH = idx === 1 ? 3.8 : 6.4;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, colH, 10), stoneMat);
      col.position.set(sideX, ty + colH * 0.5 + 0.4, tz + offZ);
      col.castShadow = true;
      col.receiveShadow = true;
      colonnadeGroup.add(col);
      colliders.push({ type: 'pillar', x: sideX, z: tz + offZ, radius: 0.95, height: colH });
    });

    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 4.6), stoneMat);
    archBeam.position.set(sideX, ty + 7.1, tz + 2.2);
    archBeam.castShadow = true;
    colonnadeGroup.add(archBeam);
  });
  templeGroup.add(colonnadeGroup);

  // Twin Forgotten Guardian Sentinel Statues flanking the Sanctuary approach
  const statueGroup = new THREE.Group();
  statueGroup.name = 'ForgottenStatues';
  [-6.8, 6.8].forEach((sx, idx) => {
    const sz = -37.2;
    const sy = getTerrainHeight(sx, sz);
    const sentinel = new THREE.Group();
    sentinel.position.set(sx, sy, sz);
    sentinel.rotation.y = idx === 0 ? 0.35 : -0.35;

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.3, 2.1), darkStoneMat);
    plinth.position.y = 0.65;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    sentinel.add(plinth);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.78, 2.5, 7), stoneMat);
    torso.position.y = 2.55;
    torso.castShadow = true;
    sentinel.add(torso);

    const shoulderPad = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.55, 0.85), stoneMat);
    shoulderPad.position.y = 3.45;
    shoulderPad.castShadow = true;
    sentinel.add(shoulderPad);

    const helm = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.95, 6), stoneMat);
    helm.position.y = 4.25;
    helm.castShadow = true;
    sentinel.add(helm);

    const chestSigil = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), runeGlowMat);
    chestSigil.position.set(0, 2.75, 0.56);
    sentinel.add(chestSigil);

    statueGroup.add(sentinel);
    colliders.push({ type: 'pillar', x: sx, z: sz, radius: 1.25, height: 5.0 });
  });
  templeGroup.add(statueGroup);

  const pillarGeo = new THREE.BoxGeometry(1.8, 7.6, 1.8);
  const leftPillar = new THREE.Mesh(pillarGeo, stoneMat);
  leftPillar.position.set(-4.2, ty + 3.9, tz + 3.2);
  leftPillar.castShadow = true;
  leftPillar.receiveShadow = true;
  templeGroup.add(leftPillar);

  const rightPillar = new THREE.Mesh(pillarGeo, stoneMat);
  rightPillar.position.set(4.2, ty + 3.9, tz + 3.2);
  rightPillar.castShadow = true;
  rightPillar.receiveShadow = true;
  templeGroup.add(rightPillar);

  colliders.push({ type: 'pillar', x: -4.2, z: tz + 3.2, radius: 1.15, height: 7.5 });
  colliders.push({ type: 'pillar', x: 4.2, z: tz + 3.2, radius: 1.15, height: 7.5 });

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(11.4, 1.6, 2.2), stoneMat);
  lintel.position.set(0, ty + 8.1, tz + 3.2);
  lintel.castShadow = true;
  templeGroup.add(lintel);

  const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), goldMat);
  crest.position.set(0, ty + 9.4, tz + 3.2);
  templeGroup.add(crest);

  const doorGeo = new THREE.BoxGeometry(3.2, 6.2, 0.55);
  const leftDoor = new THREE.Mesh(doorGeo, darkStoneMat);
  leftDoor.position.set(-1.65, ty + 3.4, tz + 3.2);
  leftDoor.castShadow = true;
  templeGroup.add(leftDoor);

  const rightDoor = new THREE.Mesh(doorGeo, darkStoneMat);
  rightDoor.position.set(1.65, ty + 3.4, tz + 3.2);
  rightDoor.castShadow = true;
  templeGroup.add(rightDoor);

  const gateDoorCollider = {
    type: 'aabb',
    minX: -3.25,
    maxX: 3.25,
    minZ: tz + 2.85,
    maxZ: tz + 3.55,
    maxY: ty + 6.6,
    active: true,
  };
  colliders.push(gateDoorCollider);

  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffb347 });
  const templeFlames = [];
  [-4.2, 4.2].forEach((px) => {
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.85, 6), flameMat);
    flame.position.set(px, ty + 5.1, tz + 4.4);
    templeGroup.add(flame);
    templeFlames.push(flame);
  });
  // Warm amber brazier bowls along temple stairs
  [-5.2, 5.2].forEach((bx) => {
    const brazierBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.26, 0.65, 7), darkStoneMat);
    brazierBowl.position.set(bx, ty + 0.45, -36.2);
    templeGroup.add(brazierBowl);
    const ember = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.72, 6), flameMat);
    ember.position.set(bx, ty + 1.05, -36.2);
    templeGroup.add(ember);
    templeFlames.push(ember);
  });

  const switchPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.62, 1.25, 8), stoneMat);
  const switchPos = new THREE.Vector3(0, getTerrainHeight(0, -39.5), -39.5);
  switchPedestal.position.set(switchPos.x, switchPos.y + 0.62, switchPos.z);
  switchPedestal.castShadow = true;
  templeGroup.add(switchPedestal);
  colliders.push({ type: 'pillar', x: switchPos.x, z: switchPos.z, radius: 0.65, height: 1.5 });

  const switchOrb = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0x52c4ff, emissive: 0x2288dd, emissiveIntensity: 1.2 })
  );
  switchOrb.position.set(switchPos.x, switchPos.y + 1.45, switchPos.z);
  templeGroup.add(switchOrb);

  const altar = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.1, 1.1, 8), stoneMat);
  const artifactPos = new THREE.Vector3(0, ty + 0.5, tz - 3.6);
  altar.position.set(artifactPos.x, artifactPos.y + 0.55, artifactPos.z);
  altar.castShadow = true;
  templeGroup.add(altar);
  colliders.push({ type: 'pillar', x: artifactPos.x, z: artifactPos.z, radius: 1.05, height: 2.0 });

  const artifactMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.58, 0), goldMat);
  artifactMesh.position.set(artifactPos.x, artifactPos.y + 1.85, artifactPos.z);
  artifactMesh.castShadow = true;
  templeGroup.add(artifactMesh);

  const npcPos = new THREE.Vector3(5.2, getTerrainHeight(5.2, -9.5), -9.5);
  const npcGroup = new THREE.Group();
  npcGroup.position.copy(npcPos);
  const npcRobe = new THREE.Mesh(
    new THREE.ConeGeometry(0.48, 1.65, 8),
    new THREE.MeshStandardMaterial({ color: 0x355e58, roughness: 0.7 })
  );
  npcRobe.position.y = 0.85;
  npcRobe.castShadow = true;
  npcGroup.add(npcRobe);
  const npcHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x9be2d8, emissive: 0x2a887d, emissiveIntensity: 0.7 })
  );
  npcHead.position.y = 1.88;
  npcGroup.add(npcHead);
  templeGroup.add(npcGroup);

  const herbMat = new THREE.MeshStandardMaterial({
    color: 0xff5e57,
    emissive: 0xaa2020,
    emissiveIntensity: 0.8,
  });
  const herbSpawns = [
    { id: 'herb_1', x: -9.5, z: -14.5 },
    { id: 'herb_2', x: 10.5, z: -21.0 },
  ];
  const collectibles = herbSpawns.map((h) => {
    const hy = getTerrainHeight(h.x, h.z);
    const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), herbMat);
    mesh.position.set(h.x, hy + 0.65, h.z);
    templeGroup.add(mesh);
    return { id: h.id, mesh, pos: new THREE.Vector3(h.x, hy, h.z), collected: false };
  });

  scene.add(templeGroup);

  let gateOpen = false;
  let gateAnim = 0;
  let artifactCollected = false;
  let npcSpoken = false;

  return {
    templeCenter: new THREE.Vector3(tx, ty, tz),
    switchPos,
    artifactPos,
    npcPos,
    isGateOpen: () => gateOpen,
    isArtifactCollected: () => artifactCollected,
    reset() {
      gateOpen = false;
      gateDoorCollider.active = true;
      gateAnim = 0;
      artifactCollected = false;
      artifactMesh.visible = true;
      leftDoor.position.x = -1.65;
      rightDoor.position.x = 1.65;
      switchOrb.material.color.setHex(0x52c4ff);
      switchOrb.material.emissive.setHex(0x2288dd);
      collectibles.forEach((c) => {
        c.collected = false;
        c.mesh.visible = true;
      });
    },
    getNearbyInteractable(playerPos) {
      if (playerPos.distanceTo(switchPos) < 3.6 && !gateOpen) {
        return { type: 'switch', label: 'Activate Temple Gate' };
      }
      if (playerPos.distanceTo(artifactPos) < 3.8 && gateOpen && !artifactCollected) {
        return { type: 'artifact', label: 'Collect Ancient Artifact' };
      }
      if (playerPos.distanceTo(npcPos) < 3.6) {
        return { type: 'npc', label: 'Speak to Forest Elder' };
      }
      for (const c of collectibles) {
        if (!c.collected && playerPos.distanceTo(c.pos) < 3.2) {
          return { type: 'herb', item: c, label: 'Collect Healing Vial' };
        }
      }
      return null;
    },
    interact(playerPos) {
      const target = this.getNearbyInteractable(playerPos);
      if (!target) return null;

      if (target.type === 'switch') {
        gateOpen = true;
        gateDoorCollider.active = false;
        switchOrb.material.color.setHex(0xe5b95c);
        switchOrb.material.emissive.setHex(0xe5b95c);
        return { event: 'gate_opened', message: 'The Lost Temple gate unlocks!' };
      }
      if (target.type === 'artifact') {
        artifactCollected = true;
        artifactMesh.visible = false;
        return { event: 'artifact_collected', message: 'Ancient Artifact Claimed!' };
      }
      if (target.type === 'npc') {
        const firstTime = !npcSpoken;
        npcSpoken = true;
        return {
          event: 'npc_talk',
          bonusPotion: firstTime,
          message: firstTime
            ? 'Elder Spirit: "Defeat the 3 stone guards and claim the Artifact!" (+1 Potion)'
            : 'Elder Spirit: "The Lost Temple lies straight north along the path."',
        };
      }
      if (target.type === 'herb') {
        target.item.collected = true;
        target.item.mesh.visible = false;
        return { event: 'herb_collected', message: 'Collected +1 Health Potion!' };
      }
      return null;
    },
    update(dt, time) {
      crest.rotation.y = time * 0.9;
      switchOrb.position.y = switchPos.y + 1.45 + Math.sin(time * 2.4) * 0.08;
      if (!artifactCollected) {
        artifactMesh.rotation.y = time * 1.4;
        artifactMesh.position.y = artifactPos.y + 1.85 + Math.sin(time * 2.2) * 0.14;
      }
      npcGroup.rotation.y = Math.sin(time * 0.7) * 0.18;
      templeFlames.forEach((fl, idx) => {
        fl.scale.y = 0.88 + Math.sin(time * 9.0 + idx * 1.7) * 0.18;
      });
      collectibles.forEach((c, idx) => {
        if (!c.collected) {
          c.mesh.rotation.y = time * 1.8 + idx;
          c.mesh.position.y = c.pos.y + 0.65 + Math.sin(time * 2.5 + idx) * 0.1;
        }
      });

      const targetGate = gateOpen ? 1 : 0;
      gateAnim = THREE.MathUtils.lerp(gateAnim, targetGate, Math.min(1, dt * 3.5));
      leftDoor.position.x = -1.65 - gateAnim * 2.35;
      rightDoor.position.x = 1.65 + gateAnim * 2.35;
    },
    setWetness(wetness) {
      const w = THREE.MathUtils.clamp(wetness, 0, 1);
      stoneMat.roughness = THREE.MathUtils.lerp(0.88, 0.45, w);
      darkStoneMat.roughness = THREE.MathUtils.lerp(0.9, 0.48, w);
    },
  };
}

/**
 * Builds Zone B flowing turquoise-cyan river, towering cliff waterfall with mist puffs,
 * and walkable mossy Ancient Stone Bridge crossing cleanly over the river.
 */
function createWaterAndBridge(scene, getTerrainHeight, colliders) {
  const waterGroup = new THREE.Group();
  waterGroup.name = 'RiverAndBridge';

  // 1. Flowing Winding River ribbon following getRiverCenterZ(x)
  const riverSegmentsX = 72;
  const riverSegmentsZ = 8;
  const riverLength = 156;
  const riverGeo = new THREE.PlaneGeometry(riverLength, 8.6, riverSegmentsX, riverSegmentsZ);
  riverGeo.rotateX(-Math.PI / 2);
  const rPos = riverGeo.attributes.position;
  for (let i = 0; i < rPos.count; i++) {
    const wx = rPos.getX(i);
    const localZ = rPos.getZ(i);
    const widthScale = getRiverHalfWidth(wx) / 3.4;
    const wz = getRiverCenterZ(wx) + localZ * widthScale;
    rPos.setZ(i, wz);
    rPos.setY(i, -0.32);
  }
  riverGeo.computeVertexNormals();

  const riverUniforms = { uTime: { value: 0 } };
  const riverMat = new THREE.MeshStandardMaterial({
    color: 0x1a8ea6,
    emissive: 0x0a495c,
    emissiveIntensity: 0.42,
    roughness: 0.08,
    metalness: 0.48,
    envMapIntensity: 1.45,
    transparent: true,
    opacity: 0.86,
  });
  riverMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = riverUniforms.uTime;
    shader.vertexShader = `uniform float uTime;\nvarying vec3 vWaterWorld;\n` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      float ripple = sin(position.x * 1.4 - uTime * 3.1 + position.z * 0.9) * 0.045
                   + cos(position.x * 0.7 - uTime * 2.1 - position.z * 1.3) * 0.03;
      transformed.y += ripple;
      vWaterWorld = transformed;
      `
    );
    shader.fragmentShader = `uniform float uTime;\nvarying vec3 vWaterWorld;\n` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `
      #include <emissivemap_fragment>
      float streak = sin(vWaterWorld.x * 0.85 - uTime * 3.8 + sin(vWaterWorld.z * 1.9) * 1.4);
      float foam = smoothstep(0.62, 0.96, streak);
      totalEmissiveRadiance += vec3(0.16, 0.55, 0.68) * foam * 0.65;
      `
    );
  };
  riverMat.customProgramCacheKey = () => 'warmier-river-flow-v1';

  const riverMesh = new THREE.Mesh(riverGeo, riverMat);
  riverMesh.name = 'RiverWater';
  riverMesh.receiveShadow = true;
  waterGroup.add(riverMesh);

  // 2. Towering West Twin Waterfall, Cliff Basin & Carved Cliffside Rune Seal Portal
  const wfX = -27.5;
  const wfZ = getRiverCenterZ(wfX);
  const cliffMat = new THREE.MeshStandardMaterial({ color: 0x3b4844, roughness: 0.9, envMapIntensity: 0.7, flatShading: true });
  const cliffBase = new THREE.Mesh(new THREE.DodecahedronGeometry(6.8, 1), cliffMat);
  cliffBase.position.set(wfX - 2.6, 5.2, wfZ);
  cliffBase.scale.set(1.15, 1.85, 1.35);
  cliffBase.castShadow = true;
  cliffBase.receiveShadow = true;
  waterGroup.add(cliffBase);

  const upperCliff = new THREE.Mesh(new THREE.DodecahedronGeometry(5.2, 1), cliffMat);
  upperCliff.position.set(wfX - 4.2, 11.4, wfZ + 1.2);
  upperCliff.scale.set(1.1, 1.2, 1.2);
  upperCliff.castShadow = true;
  waterGroup.add(upperCliff);

  // Carved Cliffside Guardian Rune Seal Door with glowing blue crystals beside waterfall
  const runeSealGroup = new THREE.Group();
  runeSealGroup.name = 'CliffsideRuneSeal';
  const sealBacking = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.75, 18), cliffMat);
  sealBacking.rotation.z = Math.PI * 0.5;
  runeSealGroup.add(sealBacking);
  const sealRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.65, 0.24, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0x4c5853, roughness: 0.85, flatShading: true })
  );
  sealRing.rotation.y = Math.PI * 0.5;
  sealRing.position.x = 0.35;
  runeSealGroup.add(sealRing);
  const sealCrystalMat = new THREE.MeshStandardMaterial({
    color: 0x5beaff,
    emissive: 0x16b8ff,
    emissiveIntensity: 1.6,
    roughness: 0.15,
  });
  [
    [0.45, 2.35, 0],
    [0.45, 0.0, 2.25],
    [0.45, 0.0, -2.25],
  ].forEach(([cx, cy, cz]) => {
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), sealCrystalMat);
    gem.position.set(cx, cy, cz);
    runeSealGroup.add(gem);
  });
  runeSealGroup.position.set(wfX + 2.4, 2.8, wfZ + 5.2);
  runeSealGroup.rotation.y = 0.28;
  waterGroup.add(runeSealGroup);
  colliders.push({ type: 'rock', x: wfX + 2.0, z: wfZ + 5.2, radius: 2.2, height: 6.5 });

  colliders.push({ type: 'rock', x: wfX - 2.6, z: wfZ, radius: 5.4, height: 14 });

  const waterfallGeo = new THREE.PlaneGeometry(4.6, 13.5, 4, 14);
  const wfUniforms = { uTime: { value: 0 } };
  const waterfallMat = new THREE.MeshBasicMaterial({
    color: 0x8ef2ff,
    transparent: true,
    opacity: 0.78,
    side: THREE.DoubleSide,
  });
  waterfallMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = wfUniforms.uTime;
    shader.vertexShader = `varying vec2 vWfUv;\n` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>\nvWfUv = uv;`
    );
    shader.fragmentShader = `uniform float uTime;\nvarying vec2 vWfUv;\n` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      `
      float scroll = fract(vWfUv.y * 2.2 + uTime * 1.9);
      float streaks = 0.72 + 0.28 * sin(vWfUv.x * 26.0 + scroll * 6.2831);
      float mistFade = smoothstep(0.0, 0.14, vWfUv.y);
      vec4 diffuseColor = vec4(diffuse * streaks, opacity * (0.65 + 0.35 * mistFade));
      `
    );
  };
  waterfallMat.customProgramCacheKey = () => 'warmier-waterfall-v1';

  const waterfallStream = new THREE.Mesh(waterfallGeo, waterfallMat);
  waterfallStream.name = 'WaterfallStream';
  waterfallStream.position.set(wfX + 1.8, 6.1, wfZ);
  waterfallStream.rotation.y = Math.PI * 0.5;
  waterGroup.add(waterfallStream);

  // Secondary twin cascade stream tumbling beside the primary waterfall
  const twinCascade = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 10.2, 3, 10), waterfallMat);
  twinCascade.name = 'TwinWaterfallCascade';
  twinCascade.position.set(wfX + 2.2, 4.6, wfZ - 3.6);
  twinCascade.rotation.y = Math.PI * 0.45;
  waterGroup.add(twinCascade);

  // Waterfall splash mist spheres at the basin
  const splashMistMat = new THREE.MeshBasicMaterial({
    color: 0xc9f8ff,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const splashPuffs = [];
  for (let i = 0; i < 8; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.95 + (i % 3) * 0.35, 8, 6), splashMistMat);
    const angle = (i / 8) * Math.PI * 2;
    puff.position.set(wfX + 2.6 + Math.cos(angle) * 1.4, 0.35, wfZ + Math.sin(angle) * 1.9);
    waterGroup.add(puff);
    splashPuffs.push({ mesh: puff, baseX: puff.position.x, baseZ: puff.position.z, phase: i * 0.85 });
  }

  // 3. Arching Mossy Ancient Stone Bridge (x in [-3.4, 3.4], z around getRiverCenterZ(0))
  const bridgeCenterZ = getRiverCenterZ(0);
  const bridgeGroup = new THREE.Group();
  bridgeGroup.name = 'StoneBridge';
  const bridgeStoneMat = new THREE.MeshStandardMaterial({ color: 0x626b64, roughness: 0.88, flatShading: true });
  const bridgeTrimMat = new THREE.MeshStandardMaterial({ color: 0x455848, roughness: 0.92, flatShading: true });

  // Segmented arched walkway slabs aligned with getTerrainHeight arch
  const plankCount = 9;
  for (let i = 0; i < plankCount; i++) {
    const t = i / (plankCount - 1);
    const pz = bridgeCenterZ - 4.4 + t * 8.8;
    const py = getTerrainHeight(0, pz);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(6.3, 0.55, 1.15), bridgeStoneMat);
    slab.position.set(0, py - 0.25, pz);
    slab.receiveShadow = true;
    slab.castShadow = true;
    bridgeGroup.add(slab);
  }

  // Low stone parapets & glowing guardian lanterns on left & right sides (keeping road open)
  [-3.25, 3.25].forEach((sideX) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.05, 9.4), bridgeTrimMat);
    rail.position.set(sideX, 0.88, bridgeCenterZ);
    rail.castShadow = true;
    rail.receiveShadow = true;
    bridgeGroup.add(rail);

    [-4.3, 4.3].forEach((endOffsetZ) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.75, 0.85), bridgeStoneMat);
      post.position.set(sideX, 1.05, bridgeCenterZ + endOffsetZ);
      post.castShadow = true;
      bridgeGroup.add(post);

      const lantern = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.24, 0),
        new THREE.MeshBasicMaterial({ color: 0x62f2ff })
      );
      lantern.position.set(sideX, 2.08, bridgeCenterZ + endOffsetZ);
      bridgeGroup.add(lantern);
    });
  });

  // Side railing colliders so player stays cleanly on the bridge when crossing
  colliders.push({
    type: 'aabb',
    minX: -3.65,
    maxX: -2.95,
    minZ: bridgeCenterZ - 4.7,
    maxZ: bridgeCenterZ + 4.7,
    maxY: 2.2,
    active: true,
  });
  colliders.push({
    type: 'aabb',
    minX: 2.95,
    maxX: 3.65,
    minZ: bridgeCenterZ - 4.7,
    maxZ: bridgeCenterZ + 4.7,
    maxY: 2.2,
    active: true,
  });

  waterGroup.add(bridgeGroup);
  scene.add(waterGroup);

  return {
    group: waterGroup,
    bridgeGroup,
    update(time) {
      riverUniforms.uTime.value = time;
      wfUniforms.uTime.value = time;
      splashPuffs.forEach((p, idx) => {
        const lift = ((time * 0.9 + p.phase) % 1.0);
        p.mesh.position.y = 0.25 + lift * 1.45;
        p.mesh.position.x = p.baseX + Math.sin(time * 2.2 + idx) * 0.35;
        p.mesh.scale.setScalar(0.85 + lift * 0.75);
      });
    },
  };
}

/**
 * Builds Zone B's Enterable Hidden Cave near (21.5, -21.5) with a west-facing open archway,
 * glowing cave moss/crystals, solid outer shell colliders, and an Ancient Relic Pedestal.
 */
function createHiddenCave(scene, getTerrainHeight, colliders) {
  const caveGroup = new THREE.Group();
  caveGroup.name = 'HiddenCave';

  const cx = 21.5;
  const cz = -21.5;
  const cy = getTerrainHeight(cx, cz);

  const caveRockMat = new THREE.MeshStandardMaterial({ color: 0x35403d, roughness: 0.95, flatShading: true });
  const caveFloorMat = new THREE.MeshStandardMaterial({ color: 0x263130, roughness: 0.94 });

  // Cave stone floor slab
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.5, 0.35, 12), caveFloorMat);
  floor.position.set(cx, cy + 0.08, cz);
  floor.receiveShadow = true;
  caveGroup.add(floor);

  // Curved cave wall boulders leaving West entrance (x ≈ 15.5) wide open for Kael to enter!
  const wallAngles = [
    -Math.PI * 0.62,
    -Math.PI * 0.35,
    -Math.PI * 0.05,
    Math.PI * 0.25,
    Math.PI * 0.52,
    Math.PI * 0.78,
  ];
  wallAngles.forEach((ang, idx) => {
    const wx = cx + Math.cos(ang) * 5.6;
    const wz = cz + Math.sin(ang) * 5.4;
    const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(2.35 + (idx % 2) * 0.45, 1), caveRockMat);
    boulder.position.set(wx, cy + 2.1, wz);
    boulder.scale.set(1.1, 1.45, 1.1);
    boulder.castShadow = true;
    boulder.receiveShadow = true;
    caveGroup.add(boulder);

    colliders.push({ type: 'rock', x: wx, z: wz, radius: 2.0, height: 5.5 });
  });

  // Cave roof dome spanning overhead
  const roof = new THREE.Mesh(new THREE.DodecahedronGeometry(6.4, 1), caveRockMat);
  roof.position.set(cx + 0.4, cy + 5.2, cz);
  roof.scale.set(1.15, 0.52, 1.15);
  roof.castShadow = true;
  caveGroup.add(roof);

  // Cave entrance stone arch pillars (west-facing opening)
  [-3.0, 3.0].forEach((zOff) => {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(1.5, 4.4, 1.5), caveRockMat);
    jamb.position.set(cx - 5.4, cy + 2.2, cz + zOff);
    jamb.castShadow = true;
    caveGroup.add(jamb);
    colliders.push({ type: 'pillar', x: cx - 5.4, z: cz + zOff, radius: 0.95, height: 4.5 });
  });
  const archTop = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.35, 7.6), caveRockMat);
  archTop.position.set(cx - 5.3, cy + 4.7, cz);
  archTop.castShadow = true;
  caveGroup.add(archTop);

  // Interior glowing crystal lanterns & Ancient Guardian Relic Pedestal
  const caveCrystalMat = new THREE.MeshStandardMaterial({
    color: 0x5cf2ff,
    emissive: 0x16a8d9,
    emissiveIntensity: 1.25,
    roughness: 0.18,
  });
  [
    [cx + 3.6, cy + 0.8, cz - 2.2],
    [cx + 3.6, cy + 0.8, cz + 2.2],
    [cx - 1.5, cy + 0.7, cz - 3.6],
  ].forEach(([lx, ly, lz]) => {
    const shard = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.1, 5), caveCrystalMat);
    shard.position.set(lx, ly, lz);
    caveGroup.add(shard);
  });

  const relicPos = new THREE.Vector3(cx + 1.8, cy + 0.25, cz);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 1.0, 8), caveRockMat);
  pedestal.position.set(relicPos.x, relicPos.y + 0.5, relicPos.z);
  caveGroup.add(pedestal);

  const relicMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.42, 0),
    new THREE.MeshStandardMaterial({
      color: 0x8ef9ff,
      emissive: 0x2fd0ff,
      emissiveIntensity: 1.5,
      metalness: 0.45,
      roughness: 0.12,
    })
  );
  relicMesh.position.set(relicPos.x, relicPos.y + 1.45, relicPos.z);
  caveGroup.add(relicMesh);

  let relicCollected = false;
  scene.add(caveGroup);

  return {
    group: caveGroup,
    center: new THREE.Vector3(cx, cy, cz),
    relicPos,
    isRelicCollected: () => relicCollected,
    tryClaimRelic() {
      if (relicCollected) return false;
      relicCollected = true;
      relicMesh.visible = false;
      return true;
    },
    reset() {
      relicCollected = false;
      relicMesh.visible = true;
    },
    update(time) {
      if (!relicCollected) {
        relicMesh.rotation.y = time * 1.8;
        relicMesh.position.y = relicPos.y + 1.45 + Math.sin(time * 2.4) * 0.12;
      }
    },
  };
}

/**
 * Builds Zone B's 3 Ancient Guardian Puzzle Pillars, 6 Collectible Glowing Blue Energy Crystals,
 * Zone C Abandoned Cyclops Alien Tech, and bioluminescent forest flora highlights.
 */
function createZoneAlienTechAndCrystals(scene, getTerrainHeight, colliders) {
  const worldFeatures = new THREE.Group();
  worldFeatures.name = 'ZoneFeaturesAndCrystals';

  // 1. 6 Collectible Glowing Blue Energy Crystals across Zones A/B/C & Hidden Cave
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x4ae8ff,
    emissive: 0x1bb8ff,
    emissiveIntensity: 1.45,
    metalness: 0.25,
    roughness: 0.12,
  });
  const crystalSpawns = [
    { id: 'crystal_zone_a_west', x: -8.5, z: -6.5 },
    { id: 'crystal_zone_b_bridge', x: 5.5, z: -20.5 },
    { id: 'crystal_zone_b_waterfall', x: -18.5, z: -25.0 },
    { id: 'crystal_hidden_cave', x: 19.5, z: -21.5 },
    { id: 'crystal_zone_b_ruins', x: -9.5, z: -32.0 },
    { id: 'crystal_zone_c_tech', x: 11.5, z: -40.5 },
  ];
  const crystals = crystalSpawns.map((c) => {
    const cy = getTerrainHeight(c.x, c.z);
    const group = new THREE.Group();
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), crystalMat);
    core.scale.set(0.75, 1.45, 0.75);
    core.position.y = 0.85;
    group.add(core);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.04, 6, 18),
      new THREE.MeshBasicMaterial({ color: 0x74f5ff, transparent: true, opacity: 0.65 })
    );
    ring.rotation.x = Math.PI * 0.5;
    ring.position.y = 0.22;
    group.add(ring);
    group.position.set(c.x, cy, c.z);
    worldFeatures.add(group);
    return {
      id: c.id,
      mesh: group,
      pos: new THREE.Vector3(c.x, cy, c.z),
      collected: false,
    };
  });

  // 2. 3 Ancient Guardian Puzzle Pillars in Zone B (Ruins zone)
  const puzzleGroup = new THREE.Group();
  puzzleGroup.name = 'AncientPuzzlePillars';
  const ruinStoneMat = new THREE.MeshStandardMaterial({ color: 0x4b5752, roughness: 0.9, flatShading: true });
  const puzzleSpawns = [
    { id: 'pillar_1', label: 'Activate West Guardian Rune', x: -8.2, z: -28.5 },
    { id: 'pillar_2', label: 'Activate East Guardian Rune', x: 8.6, z: -29.2 },
    { id: 'pillar_3', label: 'Activate North Bridge Rune', x: -5.2, z: -34.2 },
  ];
  const puzzlePillars = puzzleSpawns.map((p) => {
    const py = getTerrainHeight(p.x, p.z);
    const column = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.6, 1.15), ruinStoneMat);
    column.position.set(p.x, py + 1.3, p.z);
    column.castShadow = true;
    column.receiveShadow = true;
    puzzleGroup.add(column);

    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x3b6880,
      emissive: 0x16384d,
      emissiveIntensity: 0.8,
    });
    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 0), orbMat);
    orb.position.set(p.x, py + 2.95, p.z);
    puzzleGroup.add(orb);

    colliders.push({ type: 'pillar', x: p.x, z: p.z, radius: 0.85, height: 3.2 });
    return {
      id: p.id,
      label: p.label,
      orb,
      orbMat,
      pos: new THREE.Vector3(p.x, py, p.z),
      activated: false,
    };
  });
  worldFeatures.add(puzzleGroup);

  // 3. Abandoned Cyclops Alien Tech Structures in Zone C
  const alienGroup = new THREE.Group();
  alienGroup.name = 'AbandonedAlienTech';
  const alienArmorMat = new THREE.MeshStandardMaterial({
    color: 0x262930,
    metalness: 0.72,
    roughness: 0.34,
    flatShading: true,
  });
  const alienGlowMat = new THREE.MeshStandardMaterial({
    color: 0xff3b2f,
    emissive: 0xd81b1b,
    emissiveIntensity: 1.5,
  });

  const alienSites = [
    { x: -17.5, z: -48.5, rot: 0.45 },
    { x: 16.0, z: -42.5, rot: -0.6 },
    { x: -13.5, z: -38.8, rot: 1.1 },
  ];
  const alienCores = [];
  alienSites.forEach((site, idx) => {
    const sy = getTerrainHeight(site.x, site.z);
    const pod = new THREE.Group();
    pod.position.set(site.x, sy, site.z);
    pod.rotation.y = site.rot;

    // Crashed Cyclops metal hull
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.55, 4.2, 6), alienArmorMat);
    hull.rotation.z = 0.72;
    hull.position.set(0, 1.15, 0);
    hull.castShadow = true;
    hull.receiveShadow = true;
    pod.add(hull);

    // Tall jagged energy conduit pylon
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.65, 3.6, 0.65), alienArmorMat);
    pylon.position.set(1.6, 1.75, 0.4);
    pylon.rotation.z = -0.18;
    pylon.castShadow = true;
    pod.add(pylon);

    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), alienGlowMat);
    core.position.set(1.85, 3.7, 0.4);
    pod.add(core);
    alienCores.push({ mesh: core, phase: idx * 1.4, baseY: 3.7 });

    alienGroup.add(pod);
    colliders.push({ type: 'rock', x: site.x, z: site.z, radius: 2.1, height: 3.6 });
  });
  worldFeatures.add(alienGroup);

  // 4. Bioluminescent Pink/Violet & Cyan Forest Blooms matching Forgotten Forest art
  const bloomGroup = new THREE.Group();
  bloomGroup.name = 'BioluminescentFlora';
  const bloomPinkMat = new THREE.MeshStandardMaterial({
    color: 0xf062a8,
    emissive: 0x8f1e5a,
    emissiveIntensity: 0.85,
    flatShading: true,
  });
  const bloomCyanMat = new THREE.MeshStandardMaterial({
    color: 0x4be3ff,
    emissive: 0x147b96,
    emissiveIntensity: 0.8,
    flatShading: true,
  });
  const bloomCoords = [
    [-6.2, -3.5], [7.8, -5.0], [-11.0, -13.0], [9.2, -16.5],
    [-4.8, -19.2], [6.5, -26.8], [-14.0, -23.0], [12.5, -27.5],
  ];
  bloomCoords.forEach(([bx, bz], idx) => {
    const by = getTerrainHeight(bx, bz);
    const stalk = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.95, 6),
      idx % 2 === 0 ? bloomPinkMat : bloomCyanMat
    );
    stalk.position.set(bx, by + 0.45, bz);
    bloomGroup.add(stalk);
  });
  worldFeatures.add(bloomGroup);

  // 5. Interactive Guardian Energy Obelisk Device (between Zone A clearing & Zone B river)
  const deviceGroup = new THREE.Group();
  deviceGroup.name = 'GuardianEnergyDevice';
  const devX = -6.8;
  const devZ = -16.8;
  const devY = getTerrainHeight(devX, devZ);
  const devPos = new THREE.Vector3(devX, devY, devZ);
  deviceGroup.position.copy(devPos);

  const devBase = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.12, 0.7, 8), ruinStoneMat);
  devBase.position.y = 0.35;
  devBase.castShadow = true;
  devBase.receiveShadow = true;
  deviceGroup.add(devBase);

  const devSpire = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.2, 6), ruinStoneMat);
  devSpire.position.y = 1.65;
  devSpire.castShadow = true;
  deviceGroup.add(devSpire);

  const devCoreMat = new THREE.MeshStandardMaterial({
    color: 0x4ae8ff,
    emissive: 0x18a8ff,
    emissiveIntensity: 1.35,
    metalness: 0.35,
    roughness: 0.18,
  });
  const devCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.44, 0), devCoreMat);
  devCore.position.y = 3.15;
  deviceGroup.add(devCore);

  const devRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.055, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0x62f2ff, transparent: true, opacity: 0.85 })
  );
  devRing.position.y = 3.15;
  deviceGroup.add(devRing);

  worldFeatures.add(deviceGroup);
  colliders.push({ type: 'pillar', x: devX, z: devZ, radius: 0.95, height: 3.5 });

  let deviceActivated = false;
  scene.add(worldFeatures);

  return {
    group: worldFeatures,
    crystalGroup: worldFeatures,
    puzzleGroup,
    alienGroup,
    bloomGroup,
    deviceGroup,
    crystals,
    puzzlePillars,
    getTotalCrystals: () => crystals.length,
    getCollectedCrystalCount: () => crystals.filter((c) => c.collected).length,
    getActivatedPuzzleCount: () => puzzlePillars.filter((p) => p.activated).length,
    isPuzzleSolved: () => puzzlePillars.every((p) => p.activated),
    isEnergyDeviceActivated: () => deviceActivated,
    tryAutoCollectCrystal(playerPos) {
      for (const c of crystals) {
        if (!c.collected && playerPos.distanceTo(c.pos) < 1.95) {
          c.collected = true;
          c.mesh.visible = false;
          return c;
        }
      }
      return null;
    },
    getNearbyInteractable(playerPos) {
      if (!deviceActivated && playerPos.distanceTo(devPos) < 3.5) {
        return { type: 'energy_device', label: 'Activate Guardian Energy Obelisk' };
      }
      for (const p of puzzlePillars) {
        if (!p.activated && playerPos.distanceTo(p.pos) < 3.4) {
          return { type: 'puzzle_pillar', pillar: p, label: p.label };
        }
      }
      for (const c of crystals) {
        if (!c.collected && playerPos.distanceTo(c.pos) < 3.1) {
          return { type: 'crystal', crystal: c, label: 'Collect Energy Crystal' };
        }
      }
      return null;
    },
    interact(playerPos) {
      const target = this.getNearbyInteractable(playerPos);
      if (!target) return null;
      if (target.type === 'energy_device') {
        deviceActivated = true;
        devCoreMat.color.setHex(0xffe17a);
        devCoreMat.emissive.setHex(0xffb347);
        devCoreMat.emissiveIntensity = 2.1;
        return {
          event: 'energy_device',
          pos: devPos.clone(),
          message: 'Guardian Energy Obelisk Surging! (+35 Energy, +35 Stamina)',
        };
      }
      if (target.type === 'puzzle_pillar') {
        target.pillar.activated = true;
        target.pillar.orbMat.color.setHex(0x62f2ff);
        target.pillar.orbMat.emissive.setHex(0x2cd2ff);
        target.pillar.orbMat.emissiveIntensity = 1.8;
        const count = this.getActivatedPuzzleCount();
        const solved = count === puzzlePillars.length;
        return {
          event: solved ? 'puzzle_solved' : 'puzzle_pillar',
          solved,
          message: solved
            ? 'All 3 Guardian Runes aligned! (+120 Gold, +15 Shards, Full Energy!)'
            : `Guardian Rune activated (${count}/3)`,
        };
      }
      if (target.type === 'crystal') {
        target.crystal.collected = true;
        target.crystal.mesh.visible = false;
        const count = this.getCollectedCrystalCount();
        return {
          event: 'crystal_collected',
          count,
          total: crystals.length,
          message: `Energy Crystal collected (${count}/${crystals.length}) · +30 Energy`,
        };
      }
      return null;
    },
    reset() {
      deviceActivated = false;
      devCoreMat.color.setHex(0x4ae8ff);
      devCoreMat.emissive.setHex(0x18a8ff);
      devCoreMat.emissiveIntensity = 1.35;
      crystals.forEach((c) => {
        c.collected = false;
        c.mesh.visible = true;
      });
      puzzlePillars.forEach((p) => {
        p.activated = false;
        p.orbMat.color.setHex(0x3b6880);
        p.orbMat.emissive.setHex(0x16384d);
        p.orbMat.emissiveIntensity = 0.8;
      });
    },
    update(time) {
      devCore.rotation.y = time * (deviceActivated ? 3.2 : 1.3);
      devRing.rotation.x = time * (deviceActivated ? 2.4 : 0.9);
      devRing.rotation.y = time * 1.1;
      crystals.forEach((c, idx) => {
        if (!c.collected) {
          c.mesh.rotation.y = time * 1.9 + idx;
          c.mesh.children[0].position.y = 0.85 + Math.sin(time * 2.5 + idx) * 0.14;
        }
      });
      puzzlePillars.forEach((p, idx) => {
        p.orb.rotation.y = time * (p.activated ? 2.4 : 0.8) + idx;
        p.orb.position.y = p.pos.y + 2.95 + Math.sin(time * 2.0 + idx) * 0.08;
      });
      alienCores.forEach((ac) => {
        ac.mesh.rotation.y = time * 1.5 + ac.phase;
        ac.mesh.position.y = ac.baseY + Math.sin(time * 3.1 + ac.phase) * 0.1;
      });
    },
  };
}

/**
 * Reports optional external high-poly GLB environment/foliage/ruins assets that can be
 * dropped into app/src/main/assets/game/models/env/ to replace procedural PBR geometry.
 */
export function getMissingEnvironmentAssets() {
  return {
    missingEnvironmentModels: [
      './models/env/ancient_guardian_tree.glb',
      './models/env/conifer_pine_pack.glb',
      './models/env/guardian_temple_ruins_kit.glb',
      './models/env/fern_and_flora_clusters.glb',
      './models/env/cyclops_tech_wreckage.glb',
    ],
    missingExternalTextures: [
      './textures/env/forest_moss_soil_albedo_normal.ktx2',
      './textures/env/ancient_bark_pbr.ktx2',
      './textures/env/temple_stone_moss_pbr.ktx2',
    ],
    usingProceduralPbrEnvironment: true,
  };
}

/**
 * Creates the full living 3D ancient fantasy forest environment with 3 Forgotten Forest zones,
 * flowing river + waterfall + stone bridge, enterable Hidden Cave, Guardian puzzle pillars,
 * collectible Energy Crystals, Zone C Cyclops alien tech, animated instanced trees/grass/plants,
 * wildlife, weather wind coupling, and Android LOD culling.
 */
export function createForestEnvironment(scene, getTerrainHeight) {
  const colliders = [];
  const sharedUniforms = {
    uTime: { value: 0 },
    uWindStrength: { value: 1.0 },
    uPlayerPos: { value: new THREE.Vector3(0, 0, 0) },
  };
  let weatherWindMultiplier = 1.0;

  const surfaceTextures = createForestSurfaceTextures();
  const mountains = createBackgroundMountains(scene);
  const trees = createAncientTrees(scene, getTerrainHeight, colliders, sharedUniforms, surfaceTextures);
  const rocks = createRocksAndMonoliths(scene, getTerrainHeight, colliders);
  const bushes = createForestBushes(scene, getTerrainHeight, sharedUniforms);
  const flowers = createForestFlowers(scene, getTerrainHeight, sharedUniforms);
  const grass = createInstancedGrass(scene, getTerrainHeight, sharedUniforms);
  const atmosphere = createForestAtmosphere(scene, getTerrainHeight);
  const waterAndBridge = createWaterAndBridge(scene, getTerrainHeight, colliders);
  const hiddenCave = createHiddenCave(scene, getTerrainHeight, colliders);
  const zoneFeatures = createZoneAlienTechAndCrystals(scene, getTerrainHeight, colliders);
  const temple = createLostTempleAndInteractables(scene, getTerrainHeight, colliders, surfaceTextures);

  return {
    FORGOTTEN_FOREST_ZONES,
    getZoneAt,
    getMissingEnvironmentAssets,
    mountains,
    trees,
    rocks,
    bushes,
    flowers,
    grass,
    atmosphere,
    waterAndBridge,
    hiddenCave,
    zoneFeatures,
    temple,
    getColliders: () => colliders,
    setWeatherWindMultiplier(mult) {
      weatherWindMultiplier = Math.max(0.4, Number(mult) || 1.0);
    },
    setWetness(wetness) {
      temple.setWetness(wetness);
    },
    updateLod(cameraPos, quality = 'medium') {
      if (!cameraPos) return;
      const distFactor = quality === 'low' ? 0.65 : quality === 'medium' ? 0.88 : 1.15;
      // Distance-culled decorative sub-groups on Android for smooth frame pacing
      zoneFeatures.bloomGroup.visible = Math.hypot(cameraPos.x, cameraPos.z + 14) < 68 * distFactor;
      hiddenCave.group.visible = cameraPos.distanceTo(hiddenCave.center) < 76 * distFactor;
      zoneFeatures.alienGroup.visible = Math.hypot(cameraPos.x, cameraPos.z + 44) < 78 * distFactor;
      flowers.flowerMesh.visible = quality !== 'low' || Math.hypot(cameraPos.x, cameraPos.z) < 55;
      if (trees.vineMesh) {
        trees.vineMesh.visible = quality !== 'low' || Math.hypot(cameraPos.x, cameraPos.z) < 50;
      }
    },
    update(dt, time, playerPos = null) {
      sharedUniforms.uTime.value = time;
      // Combine natural forest breeze with live dynamic Weather wind multiplier
      const baseBreeze = 0.92 + Math.sin(time * 0.35) * 0.24 + Math.cos(time * 0.17) * 0.12;
      sharedUniforms.uWindStrength.value = baseBreeze * weatherWindMultiplier;
      if (playerPos) {
        sharedUniforms.uPlayerPos.value.copy(playerPos);
      }
      atmosphere.update(dt, time, playerPos);
      waterAndBridge.update(time);
      hiddenCave.update(time);
      zoneFeatures.update(time);
      temple.update(dt, time);
    },
    setQuality(level) {
      if (level === 'low') {
        grass.setDensity(0.35);
        bushes.setDensity(0.5, false);
        flowers.setDensity(0.35);
        trees.setShadows(false);
        atmosphere.setQuality('low');
      } else if (level === 'medium') {
        grass.setDensity(0.7);
        bushes.setDensity(0.8, true);
        flowers.setDensity(0.75);
        trees.setShadows(true);
        atmosphere.setQuality('medium');
      } else {
        grass.setDensity(1.0);
        bushes.setDensity(1.0, true);
        flowers.setDensity(1.0);
        trees.setShadows(true);
        atmosphere.setQuality('high');
      }
    },
  };
}
