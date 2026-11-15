import * as THREE from 'three';

/**
 * Chapter 1: THE FALLING ASTEROID
 * Builds the Space & Planet Warmier intro diorama, Kael's home settlement,
 * 3 rescuable civilians, falling Asteroid & impact crater, enormous Alien Mothership,
 * Lord Zyrox hologram, and falling meteor debris hazards during the escape.
 */
export function createChapter1World(scene, getTerrainHeight) {
  // ── 1. Deep Space & Planet Warmier Diorama (Scene 1 Introduction) ──────────
  const spaceGroup = new THREE.Group();
  spaceGroup.name = 'SpaceWarmierIntro';
  spaceGroup.position.set(0, 320, 0);
  spaceGroup.visible = false;
  scene.add(spaceGroup);

  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(900 * 3);
  for (let i = 0; i < 900; i++) {
    const r = 45 + Math.random() * 85;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.cos(phi);
    starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xdff2ff, size: 0.35, transparent: true, opacity: 0.9 })
  );
  spaceGroup.add(stars);

  // Planet Warmier Sphere with lush forests, mountains, oceans & desert bands
  const planetGeo = new THREE.SphereGeometry(9.5, 36, 28);
  const pPos = planetGeo.attributes.position;
  const pCols = new Float32Array(pPos.count * 3);
  const oceanC = new THREE.Color(0x165a9c);
  const forestC = new THREE.Color(0x2d7a42);
  const desertC = new THREE.Color(0xb88b4a);
  const snowC = new THREE.Color(0xe6f2ff);
  const tmpC = new THREE.Color();

  for (let i = 0; i < pPos.count; i++) {
    const x = pPos.getX(i);
    const y = pPos.getY(i);
    const z = pPos.getZ(i);
    const continent = Math.sin(x * 0.45 + z * 0.35) * Math.cos(y * 0.55 - x * 0.22);
    if (Math.abs(y) > 7.9) {
      tmpC.copy(snowC);
    } else if (continent > 0.28) {
      tmpC.copy(desertC);
    } else if (continent > -0.12) {
      tmpC.copy(forestC);
    } else {
      tmpC.copy(oceanC);
    }
    pCols[i * 3] = tmpC.r;
    pCols[i * 3 + 1] = tmpC.g;
    pCols[i * 3 + 2] = tmpC.b;
  }
  planetGeo.setAttribute('color', new THREE.BufferAttribute(pCols, 3));
  const planetMesh = new THREE.Mesh(
    planetGeo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0.08 })
  );
  spaceGroup.add(planetMesh);

  const atmosphereHalo = new THREE.Mesh(
    new THREE.SphereGeometry(10.15, 28, 20),
    new THREE.MeshBasicMaterial({ color: 0x4cc2ff, transparent: true, opacity: 0.22, side: THREE.BackSide })
  );
  spaceGroup.add(atmosphereHalo);

  // ── 2. Warmier Settlement & 3 Rescuable Civilians near Spawn ─────────────
  const settlementGroup = new THREE.Group();
  settlementGroup.name = 'WarmierSettlement';
  scene.add(settlementGroup);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x5c5346, roughness: 0.9, flatShading: true });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x3b2c22, roughness: 0.88, flatShading: true });
  const lanternMat = new THREE.MeshBasicMaterial({ color: 0xffc864 });

  const huts = [
    { x: -7.5, z: 3.5, rot: 0.4 },
    { x: 7.8, z: 2.0, rot: -0.5 },
    { x: -6.5, z: -6.5, rot: 0.8 },
  ];

  const hutMeshes = huts.map((h) => {
    const g = new THREE.Group();
    const hy = getTerrainHeight(h.x, h.z);
    g.position.set(h.x, hy, h.z);
    g.rotation.y = h.rot;

    const base = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.3, 3.2), wallMat);
    base.position.y = 1.15;
    base.castShadow = true;
    base.receiveShadow = true;
    g.add(base);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.9, 1.7, 4), roofMat);
    roof.position.y = 3.1;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    g.add(roof);

    const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), lanternMat);
    lantern.position.set(1.9, 1.8, 1.4);
    g.add(lantern);

    settlementGroup.add(g);
    return g;
  });

  // 3 Rescuable Civilians near the settlement
  const civMat = new THREE.MeshStandardMaterial({ color: 0x457564, roughness: 0.8 });
  const civSkin = new THREE.MeshStandardMaterial({ color: 0xdab492, roughness: 0.72 });
  const civMarkerMat = new THREE.MeshBasicMaterial({ color: 0x52d6ff, side: THREE.DoubleSide });

  const civilianConfigs = [
    { id: 'civ_1', name: 'Elder Mira', x: -5.2, z: -3.5 },
    { id: 'civ_2', name: 'Scout Toren', x: 5.5, z: -6.0 },
    { id: 'civ_3', name: 'Villager Lyra', x: -2.0, z: -11.5 },
  ];

  const civilians = civilianConfigs.map((c) => {
    const g = new THREE.Group();
    const cy = getTerrainHeight(c.x, c.z);
    g.position.set(c.x, cy, c.z);

    const robe = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.35, 8), civMat);
    robe.position.y = 0.68;
    robe.castShadow = true;
    g.add(robe);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), civSkin);
    head.position.y = 1.52;
    g.add(head);

    const beacon = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.55, 16), civMarkerMat);
    beacon.rotation.x = -Math.PI / 2;
    beacon.position.y = 0.08;
    g.add(beacon);

    settlementGroup.add(g);
    return { ...c, mesh: g, pos: g.position, rescued: false };
  });

  // ── 3. Asteroid, Alien Mothership & Lord Zyrox (Scenes 2 & 3) ────────────
  const invasionGroup = new THREE.Group();
  invasionGroup.name = 'CyclopsInvasion';
  scene.add(invasionGroup);

  const asteroidMat = new THREE.MeshStandardMaterial({
    color: 0x2c2420,
    emissive: 0xff451a,
    emissiveIntensity: 0.85,
    roughness: 0.9,
    flatShading: true,
  });
  const asteroidMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(6.8, 1), asteroidMat);
  asteroidMesh.visible = false;
  asteroidMesh.castShadow = true;
  invasionGroup.add(asteroidMesh);

  const impactX = 0;
  const impactZ = -60;
  const impactY = getTerrainHeight(impactX, impactZ);

  const craterRing = new THREE.Mesh(
    new THREE.TorusGeometry(9.5, 1.3, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0x29211d, roughness: 0.95, flatShading: true })
  );
  craterRing.rotation.x = Math.PI / 2;
  craterRing.position.set(impactX, impactY + 0.15, impactZ);
  craterRing.visible = false;
  invasionGroup.add(craterRing);

  const impactShockwave = new THREE.Mesh(
    new THREE.RingGeometry(1.0, 2.4, 36),
    new THREE.MeshBasicMaterial({ color: 0xff7033, side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
  );
  impactShockwave.rotation.x = -Math.PI / 2;
  impactShockwave.position.set(impactX, impactY + 0.4, impactZ);
  impactShockwave.visible = false;
  invasionGroup.add(impactShockwave);

  // Enormous Alien Cyclops Mothership emerging from the cracked asteroid
  const shipGroup = new THREE.Group();
  shipGroup.position.set(impactX, impactY + 11.5, impactZ);
  shipGroup.visible = false;

  const shipBlackMat = new THREE.MeshStandardMaterial({ color: 0x101319, roughness: 0.35, metalness: 0.85 });
  const shipRedMat = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff1616, emissiveIntensity: 2.0 });
  const shipPurpleMat = new THREE.MeshStandardMaterial({ color: 0x9b2bff, emissive: 0x7a12e8, emissiveIntensity: 1.6 });

  const hull = new THREE.Mesh(new THREE.OctahedronGeometry(11.5, 1), shipBlackMat);
  hull.scale.set(1.5, 0.48, 2.1);
  hull.castShadow = true;
  shipGroup.add(hull);

  const engineRing = new THREE.Mesh(new THREE.TorusGeometry(7.5, 0.42, 8, 24), shipRedMat);
  engineRing.rotation.x = Math.PI / 2;
  engineRing.position.y = -1.2;
  shipGroup.add(engineRing);

  const bridgeEye = new THREE.Mesh(new THREE.SphereGeometry(1.6, 14, 12), shipRedMat);
  bridgeEye.position.set(0, 1.2, 14.5);
  shipGroup.add(bridgeEye);
  invasionGroup.add(shipGroup);

  // Lord Zyrox Hologram Figure (Scene 3 close-up)
  const zyroxGroup = new THREE.Group();
  zyroxGroup.position.set(0, impactY + 6.5, -45);
  zyroxGroup.visible = false;

  const zyroxTorso = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 0.95), shipBlackMat);
  zyroxTorso.position.y = 1.6;
  zyroxGroup.add(zyroxTorso);
  const zyroxCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), shipPurpleMat);
  zyroxCore.position.set(0, 1.7, 0.48);
  zyroxGroup.add(zyroxCore);
  const zyroxHead = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.82, 0.68), shipBlackMat);
  zyroxHead.position.y = 3.05;
  zyroxGroup.add(zyroxHead);
  [-0.25, 0.25].forEach((hx) => {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.75, 5), shipBlackMat);
    horn.position.set(hx * 1.6, 3.65, 0);
    horn.rotation.z = hx < 0 ? 0.35 : -0.35;
    zyroxGroup.add(horn);
  });
  const zyroxEyes = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.1, 0.1), shipRedMat);
  zyroxEyes.position.set(0, 3.08, 0.34);
  zyroxGroup.add(zyroxEyes);
  invasionGroup.add(zyroxGroup);

  // ── 4. Falling Meteor Debris Hazards (Scene 4 Escape) ────────────────────
  const debrisList = [];
  const debrisRockGeo = new THREE.DodecahedronGeometry(0.9, 0);
  const debrisWarnGeo = new THREE.RingGeometry(1.6, 2.1, 20);
  debrisWarnGeo.rotateX(-Math.PI / 2);
  const debrisWarnMat = new THREE.MeshBasicMaterial({ color: 0xff3b24, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });

  let debrisSpawnTimer = 2.0;

  return {
    spaceGroup,
    planetMesh,
    settlementGroup,
    civilians,
    asteroidMesh,
    craterRing,
    impactShockwave,
    shipGroup,
    zyroxGroup,
    impactPos: new THREE.Vector3(impactX, impactY, impactZ),
    safeRoutePos: new THREE.Vector3(0, getTerrainHeight(0, -37), -37),
    resetCampaignObjects() {
      spaceGroup.visible = false;
      asteroidMesh.visible = false;
      craterRing.visible = false;
      impactShockwave.visible = false;
      shipGroup.visible = false;
      zyroxGroup.visible = false;
      hutMeshes.forEach((h) => { h.rotation.z = 0; });
      civilians.forEach((c) => {
        c.rescued = false;
        c.mesh.visible = true;
      });
      debrisList.forEach((d) => {
        scene.remove(d.rock);
        scene.remove(d.warn);
      });
      debrisList.length = 0;
    },
    setDamagedSettlement(damaged) {
      hutMeshes.forEach((h, idx) => {
        h.rotation.z = damaged ? (idx % 2 === 0 ? 0.14 : -0.11) : 0;
      });
    },
    getNearbyCivilian(playerPos) {
      for (const c of civilians) {
        if (!c.rescued && playerPos.distanceTo(c.pos) < 3.6) return c;
      }
      return null;
    },
    rescueCivilian(civ) {
      if (!civ || civ.rescued) return false;
      civ.rescued = true;
      civ.mesh.visible = false;
      return true;
    },
    getRescuedCount() {
      return civilians.filter((c) => c.rescued).length;
    },
    updateSpace(dt) {
      planetMesh.rotation.y += dt * 0.16;
      stars.rotation.y += dt * 0.015;
    },
    updateDebrisHazards(dt, playerPos, enabled, onHitPlayer, onShake) {
      if (!enabled) return;
      debrisSpawnTimer -= dt;
      if (debrisSpawnTimer <= 0 && debrisList.length < 3) {
        debrisSpawnTimer = 2.6;
        const rx = THREE.MathUtils.clamp(playerPos.x + (Math.random() - 0.5) * 14, -22, 22);
        const rz = THREE.MathUtils.clamp(playerPos.z - 4 + (Math.random() - 0.5) * 12, -35, 6);
        const gy = getTerrainHeight(rx, rz);

        const warn = new THREE.Mesh(debrisWarnGeo, debrisWarnMat);
        warn.position.set(rx, gy + 0.12, rz);
        scene.add(warn);

        const rock = new THREE.Mesh(debrisRockGeo, asteroidMat);
        rock.position.set(rx, gy + 24, rz);
        rock.castShadow = true;
        scene.add(rock);

        debrisList.push({ rock, warn, targetY: gy + 0.5, x: rx, z: rz, fallSpeed: 18, impacted: false, life: 1.5 });
      }

      for (let i = debrisList.length - 1; i >= 0; i--) {
        const d = debrisList[i];
        if (!d.impacted) {
          d.rock.position.y -= d.fallSpeed * dt;
          d.rock.rotation.x += dt * 4;
          d.rock.rotation.z += dt * 3;
          if (d.rock.position.y <= d.targetY) {
            d.rock.position.y = d.targetY;
            d.impacted = true;
            d.warn.visible = false;
            onShake(0.25);
            if (Math.hypot(playerPos.x - d.x, playerPos.z - d.z) < 2.35) {
              onHitPlayer(16, d.rock.position);
            }
          }
        } else {
          d.life -= dt;
          if (d.life <= 0) {
            scene.remove(d.rock);
            scene.remove(d.warn);
            debrisList.splice(i, 1);
          }
        }
      }
    },
  };
}
