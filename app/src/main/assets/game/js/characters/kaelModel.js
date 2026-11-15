import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Generates compact procedural PBR normal, roughness, and metalness maps
 * on offscreen canvases so Kael's armor and undersuit exhibit realistic specular highlights
 * without shipping large external textures.
 */
function createProceduralPbrTextures() {
  function makeCanvas(size, drawFn) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) drawFn(ctx, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  // Brushed titanium / ceramic armor micro-grain roughness + normal
  const armorRoughnessMap = makeCanvas(128, (ctx, s) => {
    ctx.fillStyle = '#525252';
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 2) {
      const v = 64 + Math.floor(Math.sin(y * 0.45) * 18 + (y % 4 === 0 ? 12 : -8));
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(0, y, s, 1);
    }
    ctx.strokeStyle = 'rgba(130,130,130,0.28)';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 4, s - 8, s - 8);
  });

  const armorNormalMap = makeCanvas(128, (ctx, s) => {
    ctx.fillStyle = 'rgb(128,128,255)';
    ctx.fillRect(0, 0, s, s);
    // Subtle beveled armor panel seam
    ctx.strokeStyle = 'rgb(112,144,255)';
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, s - 12, s - 12);
    for (let y = 0; y < s; y += 3) {
      ctx.fillStyle = y % 6 === 0 ? 'rgb(131,126,255)' : 'rgb(125,130,255)';
      ctx.fillRect(0, y, s, 1);
    }
  });

  const fabricNormalMap = makeCanvas(128, (ctx, s) => {
    ctx.fillStyle = 'rgb(128,128,255)';
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 4) {
      for (let x = 0; x < s; x += 4) {
        const checker = ((x + y) / 4) % 2 === 0;
        ctx.fillStyle = checker ? 'rgb(138,136,245)' : 'rgb(118,120,245)';
        ctx.fillRect(x, y, 3, 3);
      }
    }
  });

  return { armorRoughnessMap, armorNormalMap, fabricNormalMap };
}

/**
 * Builds an original, athletic 19-year-old Hero KAEL humanoid character model
 * with a named THREE.Bone skeleton, sculpted youthful face (expressive cyan eyes,
 * clean-shaven jawline, 20 individual spiky golden-blond hair strands),
 * white/pearl ceramic armor, navy-blue lower armor, gold layered shoulder pauldrons,
 * glowing cyan energy lines, original Ancient Guardian hexagonal star emblem,
 * articulated hands/fingers, combat boots, and 5 weapon mounts.
 */
export function buildKaelModel() {
  const root = new THREE.Group();
  root.name = 'KaelHeroRoot';

  const pbr = createProceduralPbrTextures();

  // ── PBR Materials ──────────────────────────────────────────────────────────
  const materials = {
    skin: new THREE.MeshStandardMaterial({
      color: 0xe4b592,
      roughness: 0.62,
      metalness: 0.04,
    }),
    hair: new THREE.MeshStandardMaterial({
      color: 0xf2c54b,
      roughness: 0.52,
      metalness: 0.12,
    }),
    hairHighlight: new THREE.MeshStandardMaterial({
      color: 0xffdf7e,
      roughness: 0.45,
      metalness: 0.16,
    }),
    eyeSclera: new THREE.MeshStandardMaterial({
      color: 0xf4f8ff,
      roughness: 0.25,
    }),
    eyeIrisCyan: new THREE.MeshStandardMaterial({
      color: 0x38d8ff,
      emissive: 0x169dff,
      emissiveIntensity: 1.35,
      roughness: 0.18,
    }),
    eyePupil: new THREE.MeshStandardMaterial({ color: 0x091426, roughness: 0.2 }),
    brow: new THREE.MeshStandardMaterial({ color: 0xc2932f, roughness: 0.65 }),
    lips: new THREE.MeshStandardMaterial({ color: 0xc98a73, roughness: 0.58 }),

    whiteArmor: new THREE.MeshStandardMaterial({
      color: 0xeef3fa,
      roughness: 0.34,
      metalness: 0.36,
      roughnessMap: pbr.armorRoughnessMap,
      normalMap: pbr.armorNormalMap,
      normalScale: new THREE.Vector2(0.32, 0.32),
    }),
    navyLowerArmor: new THREE.MeshStandardMaterial({
      color: 0x172442,
      roughness: 0.54,
      metalness: 0.32,
      normalMap: pbr.fabricNormalMap,
      normalScale: new THREE.Vector2(0.42, 0.42),
    }),
    goldArmor: new THREE.MeshStandardMaterial({
      color: 0xe5b74e,
      roughness: 0.26,
      metalness: 0.84,
      roughnessMap: pbr.armorRoughnessMap,
      normalMap: pbr.armorNormalMap,
      normalScale: new THREE.Vector2(0.28, 0.28),
    }),
    darkUnderArmor: new THREE.MeshStandardMaterial({
      color: 0x181f2c,
      roughness: 0.45,
      metalness: 0.58,
      normalMap: pbr.armorNormalMap,
      normalScale: new THREE.Vector2(0.25, 0.25),
    }),
    cyanEnergy: new THREE.MeshStandardMaterial({
      color: 0x52e8ff,
      emissive: 0x18baff,
      emissiveIntensity: 1.75,
      roughness: 0.14,
      metalness: 0.2,
    }),
    steel: new THREE.MeshStandardMaterial({
      color: 0xd4e1ec,
      roughness: 0.22,
      metalness: 0.88,
    }),
    amberEnergy: new THREE.MeshStandardMaterial({
      color: 0xffb32c,
      emissive: 0xff8400,
      emissiveIntensity: 1.35,
      roughness: 0.18,
    }),
    purpleEnergy: new THREE.MeshStandardMaterial({
      color: 0xb07dff,
      emissive: 0x7b3fff,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    }),
  };

  // ── Humanoid Bone Hierarchy (Y-up, Front = -Z, Right = +X, Left = -X) ────
  function makeBone(name, x = 0, y = 0, z = 0) {
    const bone = new THREE.Bone();
    bone.name = name;
    bone.position.set(x, y, z);
    return bone;
  }

  const rigRoot = makeBone('Root', 0, 0, 0);
  const hips = makeBone('Hips', 0, 0.94, 0);
  const spine = makeBone('Spine', 0, 0.14, 0);
  const chest = makeBone('Chest', 0, 0.24, 0);
  const neck = makeBone('Neck', 0, 0.28, 0);
  const head = makeBone('Head', 0, 0.14, 0);

  const leftShoulder = makeBone('LeftShoulder', -0.14, 0.21, 0);
  const leftUpperArm = makeBone('LeftUpperArm', -0.15, -0.02, 0);
  const leftForearm = makeBone('LeftForearm', 0, -0.28, 0);
  const leftHand = makeBone('LeftHand', 0, -0.26, 0);

  const rightShoulder = makeBone('RightShoulder', 0.14, 0.21, 0);
  const rightUpperArm = makeBone('RightUpperArm', 0.15, -0.02, 0);
  const rightForearm = makeBone('RightForearm', 0, -0.28, 0);
  const rightHand = makeBone('RightHand', 0, -0.26, 0);

  const leftThigh = makeBone('LeftThigh', -0.125, -0.04, 0);
  const leftShin = makeBone('LeftShin', 0, -0.41, 0);
  const leftFoot = makeBone('LeftFoot', 0, -0.41, 0);
  const leftToe = makeBone('LeftToe', 0, -0.04, -0.13);

  const rightThigh = makeBone('RightThigh', 0.125, -0.04, 0);
  const rightShin = makeBone('RightShin', 0, -0.41, 0);
  const rightFoot = makeBone('RightFoot', 0, -0.41, 0);
  const rightToe = makeBone('RightToe', 0, -0.04, -0.13);

  root.add(rigRoot);
  rigRoot.add(hips);
  hips.add(spine);
  spine.add(chest);
  chest.add(neck);
  neck.add(head);

  chest.add(leftShoulder);
  leftShoulder.add(leftUpperArm);
  leftUpperArm.add(leftForearm);
  leftForearm.add(leftHand);

  chest.add(rightShoulder);
  rightShoulder.add(rightUpperArm);
  rightUpperArm.add(rightForearm);
  rightForearm.add(rightHand);

  hips.add(leftThigh);
  leftThigh.add(leftShin);
  leftShin.add(leftFoot);
  leftFoot.add(leftToe);

  hips.add(rightThigh);
  rightThigh.add(rightShin);
  rightShin.add(rightFoot);
  rightFoot.add(rightToe);

  const bones = {
    Root: rigRoot,
    Hips: hips,
    Spine: spine,
    Chest: chest,
    Neck: neck,
    Head: head,
    LeftShoulder: leftShoulder,
    LeftUpperArm: leftUpperArm,
    LeftForearm: leftForearm,
    LeftHand: leftHand,
    RightShoulder: rightShoulder,
    RightUpperArm: rightUpperArm,
    RightForearm: rightForearm,
    RightHand: rightHand,
    LeftThigh: leftThigh,
    LeftShin: leftShin,
    LeftFoot: leftFoot,
    LeftToe: leftToe,
    RightThigh: rightThigh,
    RightShin: rightShin,
    RightFoot: rightFoot,
    RightToe: rightToe,
  };

  // Capture exact rest poses so animation clips interpolate cleanly relative to rest
  const restTransforms = {};
  Object.values(bones).forEach((b) => {
    restTransforms[b.name] = {
      position: b.position.clone(),
      quaternion: b.quaternion.clone(),
    };
  });

  // Formal THREE.Skeleton registry
  const skeleton = new THREE.Skeleton(Object.values(bones));

  // Helper to mark shadows consistently
  function shadowMesh(geo, mat) {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // ── 1. Hips, Belt & Dark Navy Lower Armor Tassets ──────────────────────────
  const pelvis = shadowMesh(new THREE.CylinderGeometry(0.185, 0.165, 0.18, 12), materials.navyLowerArmor);
  pelvis.scale.set(1.22, 1.0, 0.84);
  hips.add(pelvis);

  const belt = shadowMesh(new THREE.BoxGeometry(0.46, 0.08, 0.30), materials.darkUnderArmor);
  belt.position.y = 0.06;
  hips.add(belt);

  const beltTrim = shadowMesh(new THREE.BoxGeometry(0.48, 0.025, 0.31), materials.goldArmor);
  beltTrim.position.y = 0.09;
  hips.add(beltTrim);

  const beltCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.042, 0), materials.cyanEnergy);
  beltCore.position.set(0, 0.06, -0.165);
  hips.add(beltCore);

  // Side hip armor tassets (navy + gold beveled edge)
  [-1, 1].forEach((side) => {
    const tasset = shadowMesh(new THREE.BoxGeometry(0.08, 0.24, 0.24), materials.navyLowerArmor);
    tasset.position.set(side * 0.23, -0.05, 0.01);
    tasset.rotation.z = side * 0.22;
    hips.add(tasset);

    const tassetGold = shadowMesh(new THREE.BoxGeometry(0.09, 0.03, 0.25), materials.goldArmor);
    tassetGold.position.set(side * 0.25, -0.15, 0.01);
    tassetGold.rotation.z = side * 0.22;
    hips.add(tassetGold);
  });

  // ── 2. Athletic Core Spine (Navy Rib Undersuit + Glowing Cyan Abdomen Vents) ──
  const abdomen = shadowMesh(new THREE.CylinderGeometry(0.195, 0.17, 0.26, 12), materials.navyLowerArmor);
  abdomen.scale.set(1.18, 1.0, 0.82);
  spine.add(abdomen);

  // Glowing cyan energy ribs along waist/abs
  for (let r = 0; r < 3; r++) {
    const ribY = -0.06 + r * 0.065;
    [-1, 1].forEach((s) => {
      const ribLine = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.018, 0.04), materials.cyanEnergy);
      ribLine.position.set(s * 0.09, ribY, -0.145);
      ribLine.rotation.z = s * 0.24;
      spine.add(ribLine);
    });
  }

  // ── 3. Futuristic White Chestplate, Gold Collar & Ancient Guardian Emblem ──
  const chestCoreMesh = shadowMesh(new THREE.CylinderGeometry(0.24, 0.195, 0.30, 12), materials.whiteArmor);
  chestCoreMesh.scale.set(1.28, 1.0, 0.86);
  chestCoreMesh.position.y = 0.11;
  chest.add(chestCoreMesh);

  // Sculpted pectoral armor plates (front left & right)
  [-1, 1].forEach((s) => {
    const pec = shadowMesh(new THREE.BoxGeometry(0.20, 0.17, 0.10), materials.whiteArmor);
    pec.position.set(s * 0.12, 0.15, -0.16);
    pec.rotation.y = -s * 0.18;
    pec.rotation.z = -s * 0.08;
    chest.add(pec);

    const pecGold = shadowMesh(new THREE.BoxGeometry(0.21, 0.028, 0.11), materials.goldArmor);
    pecGold.position.set(s * 0.12, 0.23, -0.158);
    pecGold.rotation.y = -s * 0.18;
    chest.add(pecGold);

    const cyanVein = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.016, 0.025), materials.cyanEnergy);
    cyanVein.position.set(s * 0.13, 0.10, -0.205);
    cyanVein.rotation.z = s * 0.32;
    chest.add(cyanVein);
  });

  // Backpack thruster spine & cyan core spine line
  const backSpine = shadowMesh(new THREE.BoxGeometry(0.18, 0.28, 0.09), materials.darkUnderArmor);
  backSpine.position.set(0, 0.13, 0.17);
  chest.add(backSpine);
  const backCyanStrip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.24, 0.03), materials.cyanEnergy);
  backCyanStrip.position.set(0, 0.13, 0.215);
  chest.add(backCyanStrip);

  // High armored gold-rimmed Guardian collar
  const collar = shadowMesh(
    new THREE.CylinderGeometry(0.14, 0.17, 0.09, 12, 1, true),
    materials.whiteArmor
  );
  collar.position.set(0, 0.27, 0.01);
  chest.add(collar);
  const collarGold = shadowMesh(new THREE.TorusGeometry(0.142, 0.014, 6, 16), materials.goldArmor);
  collarGold.rotation.x = Math.PI / 2;
  collarGold.position.set(0, 0.31, 0.01);
  chest.add(collarGold);

  // Original Ancient Guardian Emblem on Chest (Winged Gold Crest + Hexagonal Star Cyan Core)
  const emblemGroup = new THREE.Group();
  emblemGroup.position.set(0, 0.15, -0.215);
  const emblemFrame = shadowMesh(new THREE.OctahedronGeometry(0.068, 0), materials.goldArmor);
  emblemFrame.scale.set(1.15, 1.35, 0.35);
  emblemGroup.add(emblemFrame);

  const emblemCyanCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.044, 0), materials.cyanEnergy);
  emblemCyanCore.scale.set(1.0, 1.25, 0.45);
  emblemCyanCore.position.z = -0.016;
  emblemGroup.add(emblemCyanCore);

  [-1, 1].forEach((s) => {
    const wing = shadowMesh(new THREE.BoxGeometry(0.07, 0.022, 0.02), materials.goldArmor);
    wing.position.set(s * 0.075, 0.025, 0);
    wing.rotation.z = s * 0.45;
    emblemGroup.add(wing);
  });
  chest.add(emblemGroup);

  // ── 4. Neck & Youthful 19-Year-Old Head (Realistic Face + Spiky Blond Hair) ──
  const neckMesh = shadowMesh(new THREE.CylinderGeometry(0.068, 0.082, 0.16, 10), materials.skin);
  neckMesh.position.y = 0.06;
  neck.add(neckMesh);

  // Sculpted cranium & clean-shaven heroic jaw
  const cranium = shadowMesh(new THREE.SphereGeometry(0.135, 16, 14), materials.skin);
  cranium.scale.set(0.92, 1.04, 1.02);
  cranium.position.set(0, 0.10, 0.01);
  head.add(cranium);

  const jaw = shadowMesh(new THREE.CylinderGeometry(0.105, 0.072, 0.11, 10), materials.skin);
  jaw.scale.set(0.92, 1.0, 0.96);
  jaw.position.set(0, 0.02, -0.022);
  head.add(jaw);

  // Ears
  [-1, 1].forEach((s) => {
    const ear = shadowMesh(new THREE.SphereGeometry(0.03, 8, 8), materials.skin);
    ear.scale.set(0.45, 0.9, 0.65);
    ear.position.set(s * 0.125, 0.085, 0.01);
    head.add(ear);
  });

  // Nose bridge + tip
  const nose = shadowMesh(new THREE.BoxGeometry(0.026, 0.052, 0.036), materials.skin);
  nose.position.set(0, 0.078, -0.132);
  nose.rotation.x = 0.22;
  head.add(nose);

  // Mouth (determined youthful expression)
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.012, 0.015), materials.lips);
  mouth.position.set(0, 0.026, -0.122);
  head.add(mouth);

  // Expressive glowing cyan-blue eyes + eyebrows
  const eyeLeftPupilGroup = new THREE.Group();
  const eyeRightPupilGroup = new THREE.Group();
  [-1, 1].forEach((s) => {
    const ex = s * 0.048;
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), materials.eyeSclera);
    sclera.scale.set(1.25, 0.82, 0.65);
    sclera.position.set(ex, 0.105, -0.118);
    head.add(sclera);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 8), materials.eyeIrisCyan);
    iris.scale.set(1.0, 1.0, 0.55);
    iris.position.set(ex, 0.105, -0.131);
    if (s < 0) eyeLeftPupilGroup.add(iris);
    else eyeRightPupilGroup.add(iris);
    head.add(s < 0 ? eyeLeftPupilGroup : eyeRightPupilGroup);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.0065, 8, 8), materials.eyePupil);
    pupil.position.set(ex, 0.105, -0.137);
    head.add(pupil);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.013, 0.018), materials.brow);
    brow.position.set(ex, 0.132, -0.126);
    brow.rotation.z = s * 0.16;
    head.add(brow);
  });

  // Base hair volume + 20 individual spiky golden-blond hair strands
  const hairBase = shadowMesh(
    new THREE.SphereGeometry(0.145, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.62),
    materials.hair
  );
  hairBase.position.set(0, 0.118, 0.02);
  hairBase.rotation.x = 0.25;
  head.add(hairBase);

  const strandDefs = [
    // Swept front-right signature golden bangs
    [0.02, 0.23, -0.09, -0.95, 0.18, -0.25, 0.042, 0.16],
    [0.06, 0.21, -0.10, -1.05, 0.35, -0.45, 0.038, 0.15],
    [-0.04, 0.21, -0.11, -1.02, -0.12, 0.28, 0.036, 0.14],
    [-0.08, 0.19, -0.09, -0.88, -0.35, 0.45, 0.034, 0.13],
    // Crown upward spiky locks
    [0.0, 0.26, -0.02, -0.35, 0.0, -0.12, 0.048, 0.18],
    [0.07, 0.25, -0.01, -0.28, 0.2, -0.42, 0.044, 0.17],
    [-0.07, 0.25, -0.01, -0.28, -0.2, 0.42, 0.044, 0.17],
    [0.11, 0.21, 0.02, -0.15, 0.25, -0.68, 0.04, 0.15],
    [-0.11, 0.21, 0.02, -0.15, -0.25, 0.68, 0.04, 0.15],
    // Sideburns / temple locks
    [0.125, 0.14, -0.05, -0.5, 0.2, -0.85, 0.03, 0.12],
    [-0.125, 0.14, -0.05, -0.5, -0.2, 0.85, 0.03, 0.12],
    [0.13, 0.12, 0.03, 0.25, 0.1, -0.95, 0.032, 0.13],
    [-0.13, 0.12, 0.03, 0.25, -0.1, 0.95, 0.032, 0.13],
    // Back layered spikes
    [0.0, 0.23, 0.08, 0.55, 0.0, 0.0, 0.046, 0.17],
    [0.07, 0.20, 0.09, 0.62, 0.2, -0.38, 0.042, 0.16],
    [-0.07, 0.20, 0.09, 0.62, -0.2, 0.38, 0.042, 0.16],
    [0.0, 0.15, 0.13, 0.95, 0.0, 0.0, 0.044, 0.15],
    [0.07, 0.13, 0.12, 0.92, 0.2, -0.35, 0.038, 0.14],
    [-0.07, 0.13, 0.12, 0.92, -0.2, 0.35, 0.038, 0.14],
    [0.0, 0.08, 0.135, 1.25, 0.0, 0.0, 0.04, 0.14],
  ];

  strandDefs.forEach(([hx, hy, hz, rx, ry, rz, rad, len], idx) => {
    const mat = idx % 3 === 0 ? materials.hairHighlight : materials.hair;
    const strand = shadowMesh(new THREE.ConeGeometry(rad, len, 5), mat);
    strand.position.set(hx, hy, hz);
    strand.rotation.set(rx, ry, rz);
    head.add(strand);
  });

  // ── 5. Layered Golden Pauldrons, Arms, Gauntlets & Fingers ─────────────────
  function buildArmVisuals(sideSign, shoulderBone, upperBone, forearmBone, handBone) {
    // Layered Gold + White Shoulder Pauldron mounted on Shoulder/UpperArm
    const pauldronMain = shadowMesh(
      new THREE.SphereGeometry(0.145, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.58),
      materials.whiteArmor
    );
    pauldronMain.scale.set(1.22, 0.92, 1.16);
    pauldronMain.position.set(sideSign * 0.08, 0.03, 0);
    pauldronMain.rotation.z = -sideSign * 0.42;
    shoulderBone.add(pauldronMain);

    const pauldronGoldArch = shadowMesh(new THREE.TorusGeometry(0.132, 0.022, 6, 14, Math.PI * 1.15), materials.goldArmor);
    pauldronGoldArch.position.set(sideSign * 0.10, 0.05, 0);
    pauldronGoldArch.rotation.y = Math.PI / 2;
    pauldronGoldArch.rotation.z = -sideSign * 0.2;
    shoulderBone.add(pauldronGoldArch);

    const pauldronEmitter = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), materials.cyanEnergy);
    pauldronEmitter.position.set(sideSign * 0.15, 0.01, -0.05);
    shoulderBone.add(pauldronEmitter);

    // Upper Arm (undersuit + white bicep plate)
    const upperMesh = shadowMesh(new THREE.CylinderGeometry(0.072, 0.062, 0.27, 10), materials.darkUnderArmor);
    upperMesh.position.y = -0.14;
    upperBone.add(upperMesh);

    const bicepPlate = shadowMesh(new THREE.BoxGeometry(0.085, 0.18, 0.12), materials.whiteArmor);
    bicepPlate.position.set(sideSign * 0.035, -0.14, 0);
    upperBone.add(bicepPlate);

    // Elbow joint + Armored Forearm Gauntlet with Gold Crest & Cyan Energy Strip
    const elbow = shadowMesh(new THREE.SphereGeometry(0.058, 8, 8), materials.darkUnderArmor);
    forearmBone.add(elbow);

    const forearmMesh = shadowMesh(new THREE.CylinderGeometry(0.068, 0.056, 0.25, 10), materials.whiteArmor);
    forearmMesh.position.y = -0.13;
    forearmBone.add(forearmMesh);

    const gauntletCrest = shadowMesh(new THREE.BoxGeometry(0.06, 0.21, 0.125), materials.goldArmor);
    gauntletCrest.position.set(sideSign * 0.045, -0.13, -0.01);
    forearmBone.add(gauntletCrest);

    const forearmCyan = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.18, 0.022), materials.cyanEnergy);
    forearmCyan.position.set(sideSign * 0.075, -0.13, -0.02);
    forearmBone.add(forearmCyan);

    // Realistic Armored Hand + Articulated Thumb & Finger Cluster
    const palm = shadowMesh(new THREE.BoxGeometry(0.072, 0.085, 0.09), materials.darkUnderArmor);
    palm.position.y = -0.035;
    handBone.add(palm);

    const knucklePlate = shadowMesh(new THREE.BoxGeometry(0.078, 0.035, 0.088), materials.goldArmor);
    knucklePlate.position.set(sideSign * 0.01, -0.04, -0.01);
    handBone.add(knucklePlate);

    // 4 Fingers + Thumb
    for (let f = 0; f < 4; f++) {
      const fz = -0.034 + f * 0.022;
      const finger = shadowMesh(new THREE.CylinderGeometry(0.011, 0.009, 0.058, 6), materials.darkUnderArmor);
      finger.position.set(-sideSign * 0.012, -0.092, fz);
      finger.rotation.z = sideSign * 0.28;
      handBone.add(finger);
    }
    const thumb = shadowMesh(new THREE.CylinderGeometry(0.013, 0.011, 0.048, 6), materials.darkUnderArmor);
    thumb.position.set(-sideSign * 0.028, -0.052, -0.048);
    thumb.rotation.x = 0.45;
    handBone.add(thumb);
  }

  buildArmVisuals(-1, leftShoulder, leftUpperArm, leftForearm, leftHand);
  buildArmVisuals(1, rightShoulder, rightUpperArm, rightForearm, rightHand);

  // Glowing Guardian Emblem on Right Hand
  const guardianHandSymbolMat = new THREE.MeshBasicMaterial({
    color: 0x6ce2ff,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
  });
  const guardianHandSymbol = new THREE.Mesh(new THREE.RingGeometry(0.04, 0.085, 6), guardianHandSymbolMat);
  guardianHandSymbol.position.set(0.055, -0.02, -0.02);
  guardianHandSymbol.rotation.y = Math.PI / 2;
  rightHand.add(guardianHandSymbol);

  // Forearm Energy Shield on Left Forearm (for Block / Perfect Block)
  const shieldGroup = new THREE.Group();
  shieldGroup.position.set(-0.085, -0.14, -0.10);
  const shieldDisc = shadowMesh(new THREE.CylinderGeometry(0.32, 0.32, 0.048, 12), materials.navyLowerArmor);
  shieldDisc.rotation.x = Math.PI / 2;
  shieldGroup.add(shieldDisc);
  const shieldRim = shadowMesh(new THREE.TorusGeometry(0.31, 0.028, 6, 16), materials.goldArmor);
  shieldGroup.add(shieldRim);
  const shieldBoss = new THREE.Mesh(new THREE.OctahedronGeometry(0.085, 0), materials.cyanEnergy);
  shieldBoss.position.z = -0.032;
  shieldGroup.add(shieldBoss);
  leftForearm.add(shieldGroup);

  // ── 6. Lower Legs, Greaves & Futuristic Combat Boots ───────────────────────
  function buildLegVisuals(sideSign, thighBone, shinBone, footBone, toeBone) {
    const thighMesh = shadowMesh(new THREE.CylinderGeometry(0.098, 0.078, 0.38, 10), materials.navyLowerArmor);
    thighMesh.position.y = -0.20;
    thighBone.add(thighMesh);

    const thighPlate = shadowMesh(new THREE.BoxGeometry(0.12, 0.24, 0.14), materials.whiteArmor);
    thighPlate.position.set(sideSign * 0.02, -0.19, -0.025);
    thighBone.add(thighPlate);

    const thighCyan = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.025), materials.cyanEnergy);
    thighCyan.position.set(sideSign * 0.078, -0.19, -0.02);
    thighBone.add(thighCyan);

    // Knee pad + Shin Greave
    const kneePad = shadowMesh(new THREE.BoxGeometry(0.11, 0.095, 0.11), materials.goldArmor);
    kneePad.position.set(0, 0.0, -0.065);
    shinBone.add(kneePad);

    const kneeGlow = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.032, 0.03), materials.cyanEnergy);
    kneeGlow.position.set(0, 0.0, -0.118);
    shinBone.add(kneeGlow);

    const shinMesh = shadowMesh(new THREE.CylinderGeometry(0.078, 0.062, 0.36, 10), materials.navyLowerArmor);
    shinMesh.position.y = -0.20;
    shinBone.add(shinMesh);

    const shinGuard = shadowMesh(new THREE.BoxGeometry(0.11, 0.28, 0.115), materials.whiteArmor);
    shinGuard.position.set(0, -0.20, -0.032);
    shinBone.add(shinGuard);

    // Combat Boot (Ankle + Heel + Armored Sole -> bottom sits cleanly at Y=0.00 in rest)
    const bootAnkle = shadowMesh(new THREE.BoxGeometry(0.115, 0.085, 0.14), materials.darkUnderArmor);
    bootAnkle.position.set(0, -0.02, -0.01);
    footBone.add(bootAnkle);

    const bootHeel = shadowMesh(new THREE.BoxGeometry(0.125, 0.06, 0.14), materials.darkUnderArmor);
    bootHeel.position.set(0, -0.05, 0.02);
    footBone.add(bootHeel);

    const bootGoldTrim = shadowMesh(new THREE.BoxGeometry(0.13, 0.025, 0.13), materials.goldArmor);
    bootGoldTrim.position.set(0, -0.025, -0.02);
    footBone.add(bootGoldTrim);

    const toeCap = shadowMesh(new THREE.BoxGeometry(0.125, 0.065, 0.14), materials.whiteArmor);
    toeCap.position.set(0, -0.008, -0.03);
    toeBone.add(toeCap);

    const toeSole = shadowMesh(new THREE.BoxGeometry(0.13, 0.025, 0.15), materials.darkUnderArmor);
    toeSole.position.set(0, -0.028, -0.03);
    toeBone.add(toeSole);
  }

  buildLegVisuals(-1, leftThigh, leftShin, leftFoot, leftToe);
  buildLegVisuals(1, rightThigh, rightShin, rightFoot, rightToe);

  // ── 7. Weapon Mounts attached to Hand Bones (All 5 Core Weapons) ───────────
  const rightWeaponMount = new THREE.Group();
  rightWeaponMount.position.set(0, -0.05, -0.04);
  rightWeaponMount.rotation.x = -Math.PI * 0.42;
  rightHand.add(rightWeaponMount);

  const leftWeaponMount = new THREE.Group();
  leftWeaponMount.position.set(0, -0.05, -0.04);
  leftWeaponMount.rotation.x = -Math.PI * 0.42;
  leftHand.add(leftWeaponMount);

  // 0: Guardian Sword
  const swordGroup = new THREE.Group();
  const sHilt = shadowMesh(new THREE.CylinderGeometry(0.026, 0.03, 0.28, 8), materials.darkUnderArmor);
  sHilt.position.y = 0.05;
  swordGroup.add(sHilt);
  const sGuard = shadowMesh(new THREE.BoxGeometry(0.30, 0.05, 0.075), materials.goldArmor);
  sGuard.position.y = 0.20;
  swordGroup.add(sGuard);
  const sBlade = shadowMesh(new THREE.BoxGeometry(0.09, 1.1, 0.028), materials.steel);
  sBlade.position.y = 0.76;
  swordGroup.add(sBlade);
  const sEdge = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.96, 0.036), materials.cyanEnergy);
  sEdge.position.y = 0.74;
  swordGroup.add(sEdge);
  rightWeaponMount.add(swordGroup);

  // 1: Quantum Axe
  const axeGroup = new THREE.Group();
  const aHandle = shadowMesh(new THREE.CylinderGeometry(0.032, 0.036, 1.42, 8), materials.darkUnderArmor);
  aHandle.position.y = 0.48;
  axeGroup.add(aHandle);
  const aBlade = shadowMesh(new THREE.BoxGeometry(0.52, 0.38, 0.065), materials.steel);
  aBlade.position.y = 1.02;
  axeGroup.add(aBlade);
  const aTrim = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.085), materials.amberEnergy);
  aTrim.position.y = 1.02;
  axeGroup.add(aTrim);
  rightWeaponMount.add(axeGroup);

  // 2: Plasma Rifle
  const rifleGroup = new THREE.Group();
  const rBody = shadowMesh(new THREE.BoxGeometry(0.11, 0.78, 0.16), materials.navyLowerArmor);
  rBody.position.set(0, 0.34, -0.03);
  rifleGroup.add(rBody);
  const rBarrel = shadowMesh(new THREE.CylinderGeometry(0.034, 0.04, 0.55, 8), materials.steel);
  rBarrel.position.set(0, 0.85, -0.03);
  rifleGroup.add(rBarrel);
  const rCoil = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.36, 0.06), materials.cyanEnergy);
  rCoil.position.set(0, 0.48, -0.03);
  rifleGroup.add(rCoil);
  const rScope = shadowMesh(new THREE.CylinderGeometry(0.028, 0.028, 0.18, 8), materials.goldArmor);
  rScope.position.set(0, 0.38, -0.14);
  rifleGroup.add(rScope);
  rightWeaponMount.add(rifleGroup);

  // 3: Dual Energy Blasters
  function buildBlasterMesh() {
    const g = new THREE.Group();
    const frame = shadowMesh(new THREE.BoxGeometry(0.085, 0.42, 0.14), materials.darkUnderArmor);
    frame.position.set(0, 0.2, -0.03);
    g.add(frame);
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.26, 0.055), materials.purpleEnergy);
    core.position.set(0, 0.24, -0.04);
    g.add(core);
    const muzzle = shadowMesh(new THREE.CylinderGeometry(0.032, 0.036, 0.16, 8), materials.goldArmor);
    muzzle.position.set(0, 0.45, -0.03);
    g.add(muzzle);
    return g;
  }
  const rightBlasterGroup = buildBlasterMesh();
  const leftBlasterGroup = buildBlasterMesh();
  rightWeaponMount.add(rightBlasterGroup);
  leftWeaponMount.add(leftBlasterGroup);

  // 4: Guardian Gauntlets (both hands)
  function buildGauntletMesh() {
    const g = new THREE.Group();
    const fist = shadowMesh(new THREE.BoxGeometry(0.22, 0.25, 0.22), materials.goldArmor);
    fist.position.set(0, 0.03, 0);
    g.add(fist);
    const knuckles = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.09, 0.23), materials.cyanEnergy);
    knuckles.position.set(0, 0.10, -0.02);
    g.add(knuckles);
    return g;
  }
  const rightGauntletGroup = buildGauntletMesh();
  const leftGauntletGroup = buildGauntletMesh();
  rightWeaponMount.add(rightGauntletGroup);
  leftWeaponMount.add(leftGauntletGroup);

  // Guardian Ward Aura Sphere
  const wardAura = new THREE.Mesh(
    new THREE.SphereGeometry(1.18, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x38d4ff, transparent: true, opacity: 0.24, wireframe: true })
  );
  wardAura.position.y = 1.15;
  wardAura.visible = false;
  root.add(wardAura);

  return {
    root,
    skeleton,
    bones,
    restTransforms,
    materials,
    weaponMounts: {
      swordGroup,
      axeGroup,
      rifleGroup,
      rightBlasterGroup,
      leftBlasterGroup,
      rightGauntletGroup,
      leftGauntletGroup,
      shieldGroup,
    },
    fxNodes: {
      emblemCyanCore,
      guardianHandSymbol,
      guardianHandSymbolMat,
      wardAura,
      eyeLeftPupilGroup,
      eyeRightPupilGroup,
    },
  };
}

const missingExternalAssetsState = {
  checked: false,
  kaelGlbPath: './models/kael_hero.glb',
  kaelGlbAvailable: false,
  animationAssetPaths: [
    'walk.glb (procedural fallback active: WALK)',
    'run.glb (procedural fallback active: RUN, SPRINT)',
    'strafe_backward.glb (procedural fallback active: WALK_BACKWARD, STRAFE_LEFT, STRAFE_RIGHT)',
    'sword_combo.glb (procedural fallback active: COMBO_1, COMBO_2, COMBO_3, SWORD_HEAVY)',
    'axe_combat.glb (procedural fallback active: AXE_LIGHT_1, AXE_LIGHT_2, AXE_OVERHEAD, AXE_HEAVY_SLAM, AXE_RUNNING_ATTACK, AXE_RECOVERY)',
    'hand_to_hand.glb (procedural fallback active: PUNCH_LEFT, PUNCH_RIGHT, PUNCH_DOUBLE, PUNCH_UPPERCUT, KICK, SPINNING_KICK, ENERGY_PUNCH)',
    'dodge_block.glb (procedural fallback active: DODGE_FORWARD, DODGE_BACKWARD, DODGE_LEFT, DODGE_RIGHT, BLOCK, BLOCK_SIDE, PERFECT_BLOCK, KNOCKBACK, RECOVERY)',
    'ranged_combat.glb (procedural fallback active: AIM_RIFLE, SHOOT, DUAL_BLASTER_SHOOT, RELOAD, WEAPON_SWITCH)',
  ],
};

export function getMissingExternalAssets() {
  return {
    checked: missingExternalAssetsState.checked,
    missingModels: missingExternalAssetsState.kaelGlbAvailable
      ? []
      : [missingExternalAssetsState.kaelGlbPath],
    missingExternalAnimations: missingExternalAssetsState.kaelGlbAvailable
      ? []
      : [...missingExternalAssetsState.animationAssetPaths],
    usingProceduralRigFallback: !missingExternalAssetsState.kaelGlbAvailable,
  };
}

/**
 * Optional external .glb/.gltf model loader via Three.js GLTFLoader.
 * Resolves to null cleanly when no external kael_hero.glb asset exists yet,
 * records missing-asset status for Milestone 2 reporting, and allows seamless drop-in upgrades.
 */
export async function tryLoadExternalKaelGlb(url = './models/kael_hero.glb') {
  missingExternalAssetsState.kaelGlbPath = url;
  try {
    const probe = await fetch(url, { method: 'HEAD' });
    missingExternalAssetsState.checked = true;
    if (!probe.ok) {
      missingExternalAssetsState.kaelGlbAvailable = false;
      console.warn(`[KaelAssets] Optional external model missing (${url}); using articulated procedural Bone/Skeleton rig.`);
      return null;
    }
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(url);
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    missingExternalAssetsState.kaelGlbAvailable = true;
    return {
      scene: gltf.scene,
      animations: gltf.animations || [],
    };
  } catch (_) {
    missingExternalAssetsState.checked = true;
    missingExternalAssetsState.kaelGlbAvailable = false;
    console.warn(`[KaelAssets] Optional external model unavailable (${url}); using articulated procedural Bone/Skeleton rig.`);
    return null;
  }
}
