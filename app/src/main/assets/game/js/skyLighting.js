import * as THREE from 'three';

export const WEATHER_MODES = Object.freeze({
  SUNNY: 'SUNNY',
  CLOUDY: 'CLOUDY',
  RAIN: 'RAIN',
  THUNDERSTORM: 'THUNDERSTORM',
  FOG: 'FOG',
  WINDSTORM: 'WINDSTORM',
});

const WEATHER_PRESETS = {
  [WEATHER_MODES.SUNNY]: {
    fogDensity: 0.0068,
    sunMult: 1.0,
    hemiMult: 1.0,
    cloudOpacity: 0.52,
    windMult: 1.0,
    rainIntensity: 0,
    skyDarken: 0.0,
    fogColor: new THREE.Color(0x9fd0dd),
  },
  [WEATHER_MODES.CLOUDY]: {
    fogDensity: 0.0088,
    sunMult: 0.65,
    hemiMult: 0.85,
    cloudOpacity: 0.84,
    windMult: 1.25,
    rainIntensity: 0,
    skyDarken: 0.28,
    fogColor: new THREE.Color(0x7e99a8),
  },
  [WEATHER_MODES.RAIN]: {
    fogDensity: 0.0115,
    sunMult: 0.48,
    hemiMult: 0.72,
    cloudOpacity: 0.92,
    windMult: 1.55,
    rainIntensity: 0.75,
    skyDarken: 0.48,
    fogColor: new THREE.Color(0x526e7d),
  },
  [WEATHER_MODES.THUNDERSTORM]: {
    fogDensity: 0.0138,
    sunMult: 0.34,
    hemiMult: 0.58,
    cloudOpacity: 0.98,
    windMult: 2.15,
    rainIntensity: 1.0,
    skyDarken: 0.72,
    fogColor: new THREE.Color(0x2d4152),
  },
  [WEATHER_MODES.FOG]: {
    fogDensity: 0.0215,
    sunMult: 0.58,
    hemiMult: 0.9,
    cloudOpacity: 0.72,
    windMult: 0.82,
    rainIntensity: 0,
    skyDarken: 0.18,
    fogColor: new THREE.Color(0x9ac7ce),
  },
  [WEATHER_MODES.WINDSTORM]: {
    fogDensity: 0.0102,
    sunMult: 0.78,
    hemiMult: 0.88,
    cloudOpacity: 0.78,
    windMult: 2.65,
    rainIntensity: 0.12,
    skyDarken: 0.3,
    fogColor: new THREE.Color(0x7a9a98),
  },
};

/**
 * Sets up realistic blue sky dome, drifting volumetric clouds, 6-mode dynamic weather system,
 * atmospheric exponential fog, directional sunlight with dynamic shadow frustum,
 * forest sunlight shafts, floating pollen motes, and storm rain + lightning.
 */
export function createSkyAndLighting(scene) {
  const sunDirection = new THREE.Vector3(0.56, 0.58, -0.59).normalize();

  const clearTop = new THREE.Color(0x1b5ca8);
  const clearMid = new THREE.Color(0x5da4e0);
  const clearHorizon = new THREE.Color(0xaed7e2);

  const doomTop = new THREE.Color(0x0b0a12);
  const doomMid = new THREE.Color(0x28161a);
  const doomHorizon = new THREE.Color(0x5c261c);

  const stormTop = new THREE.Color(0x162436);
  const stormMid = new THREE.Color(0x365066);

  const skyGeometry = new THREE.SphereGeometry(210, 32, 20);
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTopColor: { value: clearTop.clone() },
      uMidColor: { value: clearMid.clone() },
      uHorizonColor: { value: clearHorizon.clone() },
      uSunDirection: { value: sunDirection },
      uSunColor: { value: new THREE.Color(0xfff2cf) },
    },
    vertexShader: `
      varying vec3 vWorldDirection;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldDirection = normalize(position);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uTopColor;
      uniform vec3 uMidColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uSunDirection;
      uniform vec3 uSunColor;
      varying vec3 vWorldDirection;

      void main() {
        vec3 dir = normalize(vWorldDirection);
        float h = clamp(dir.y, 0.0, 1.0);

        vec3 sky = mix(uHorizonColor, uMidColor, pow(h, 0.42));
        sky = mix(sky, uTopColor, smoothstep(0.25, 0.92, h));

        float sunAmount = max(dot(dir, normalize(uSunDirection)), 0.0);
        sky += uSunColor * pow(sunAmount, 12.0) * 0.34;
        sky += uSunColor * pow(sunAmount, 220.0) * 0.95;

        gl_FragColor = vec4(sky, 1.0);
      }
    `,
  });

  const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
  skyDome.name = 'SkyDome';
  scene.add(skyDome);

  const fog = new THREE.FogExp2(0xaecad8, 0.0074);
  scene.fog = fog;
  scene.background = new THREE.Color(0xaecad8);

  const hemiLight = new THREE.HemisphereLight(0x98cef5, 0x2c3f26, 0.78);
  hemiLight.position.set(0, 60, 0);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfff0cf, 2.35);
  sunLight.position.copy(sunDirection).multiplyScalar(75);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1024, 1024);
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 170;
  const shadowExtent = 38;
  sunLight.shadow.camera.left = -shadowExtent;
  sunLight.shadow.camera.right = shadowExtent;
  sunLight.shadow.camera.top = shadowExtent;
  sunLight.shadow.camera.bottom = -shadowExtent;
  sunLight.shadow.bias = -0.0005;
  sunLight.shadow.normalBias = 0.022;
  scene.add(sunLight);
  scene.add(sunLight.target);

  const fillLight = new THREE.DirectionalLight(0x7fb3d5, 0.45);
  fillLight.position.set(-45, 28, 40);
  scene.add(fillLight);

  // Drifting volumetric cloud clusters floating smoothly across Warmier's sky
  const cloudGroup = new THREE.Group();
  cloudGroup.name = 'SkyClouds';
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xeef6fc,
    roughness: 0.96,
    metalness: 0.0,
    transparent: true,
    opacity: 0.56,
    depthWrite: false,
  });
  const cloudPuffGeo = new THREE.SphereGeometry(1, 9, 7);
  const cloudItems = [];
  for (let i = 0; i < 18; i++) {
    const cluster = new THREE.Group();
    const angle = (i / 18) * Math.PI * 2;
    const dist = 58 + (i % 4) * 24;
    const baseX = Math.cos(angle) * dist;
    const baseZ = Math.sin(angle) * dist;
    const baseY = 56 + (i % 3) * 8;
    const puffCount = 3 + (i % 3);
    for (let p = 0; p < puffCount; p++) {
      const puff = new THREE.Mesh(cloudPuffGeo, cloudMat);
      puff.position.set((p - 1) * 5.2, (p % 2) * 1.4, ((p * 7) % 3 - 1) * 2.4);
      const s = 5.4 + ((i + p) % 4) * 1.8;
      puff.scale.set(s * 1.6, s * 0.55, s * 1.15);
      cluster.add(puff);
    }
    cluster.position.set(baseX, baseY, baseZ);
    cloudGroup.add(cluster);
    cloudItems.push({ cluster, speed: 1.6 + (i % 5) * 0.55 });
  }
  scene.add(cloudGroup);

  // Soft forest sunlight shafts filtering through tree canopies
  function createSunbeamTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, 128);
      grad.addColorStop(0.0, 'rgba(255, 240, 195, 0.0)');
      grad.addColorStop(0.22, 'rgba(255, 238, 190, 0.30)');
      grad.addColorStop(0.68, 'rgba(255, 232, 175, 0.14)');
      grad.addColorStop(1.0, 'rgba(255, 230, 165, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 128);
    }
    return new THREE.CanvasTexture(canvas);
  }

  const sunbeamGroup = new THREE.Group();
  sunbeamGroup.name = 'ForestSunlightShafts';
  const beamGeo = new THREE.CylinderGeometry(1.1, 3.8, 28, 10, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    map: createSunbeamTexture(),
    color: 0xffefc2,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  const shaftOffsets = [
    [-9, -6, 1.0],
    [10, -14, 1.15],
    [-16, -24, 1.2],
    [7, -30, 0.95],
    [-8, -40, 1.25],
    [15, 4, 1.05],
    [-14, 12, 0.9],
  ];
  const shaftQuat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    sunDirection.clone().normalize()
  );
  const shafts = shaftOffsets.map(([sx, sz, sScale]) => {
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(sx, 11.5, sz);
    beam.quaternion.copy(shaftQuat);
    beam.scale.set(sScale, 1.0, sScale);
    sunbeamGroup.add(beam);
    return { beam, baseX: sx, baseZ: sz };
  });
  scene.add(sunbeamGroup);

  // Floating dust / pollen motes
  const maxParticleCount = 260;
  const particlePositions = new Float32Array(maxParticleCount * 3);
  const particleSpeeds = new Float32Array(maxParticleCount);
  for (let i = 0; i < maxParticleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 60;
    particlePositions[i * 3 + 1] = 0.8 + Math.random() * 11;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    particleSpeeds[i] = 0.3 + Math.random() * 0.7;
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0xffeeb8,
    size: 0.16,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pollenParticles = new THREE.Points(particleGeo, particleMat);
  pollenParticles.name = 'ForestPollenParticles';
  scene.add(pollenParticles);

  // Pooled Falling Rain Streak Particles for RAIN & THUNDERSTORM modes
  const maxRainCount = 480;
  const rainPositions = new Float32Array(maxRainCount * 3);
  const rainSpeeds = new Float32Array(maxRainCount);
  for (let i = 0; i < maxRainCount; i++) {
    rainPositions[i * 3] = (Math.random() - 0.5) * 44;
    rainPositions[i * 3 + 1] = 1 + Math.random() * 22;
    rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 44;
    rainSpeeds[i] = 18 + Math.random() * 10;
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  const rainMat = new THREE.PointsMaterial({
    color: 0xaad9f5,
    size: 0.19,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const rainParticles = new THREE.Points(rainGeo, rainMat);
  rainParticles.name = 'WeatherRainParticles';
  rainParticles.visible = false;
  scene.add(rainParticles);

  // Wind-swept gust dust/leaf streak particles for WINDSTORM & THUNDERSTORM
  const maxWindStreakCount = 120;
  const windPositions = new Float32Array(maxWindStreakCount * 3);
  const windSpeeds = new Float32Array(maxWindStreakCount);
  for (let i = 0; i < maxWindStreakCount; i++) {
    windPositions[i * 3] = (Math.random() - 0.5) * 46;
    windPositions[i * 3 + 1] = 0.6 + Math.random() * 8.5;
    windPositions[i * 3 + 2] = (Math.random() - 0.5) * 46;
    windSpeeds[i] = 10 + Math.random() * 8;
  }
  const windGeo = new THREE.BufferGeometry();
  windGeo.setAttribute('position', new THREE.BufferAttribute(windPositions, 3));
  const windMat = new THREE.PointsMaterial({
    color: 0xd6efe5,
    size: 0.17,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const windStreaks = new THREE.Points(windGeo, windMat);
  windStreaks.name = 'WeatherWindStreaks';
  windStreaks.visible = false;
  scene.add(windStreaks);

  let activeParticleCount = maxParticleCount;
  let activeRainCount = maxRainCount;
  let activeWindCount = maxWindStreakCount;
  let targetDoom = 0;
  let currentDoom = 0;
  let flashTimer = 0;
  let currentWeather = WEATHER_MODES.SUNNY;
  let weatherWindMult = 1.0;
  let currentWetness = 0.0;
  let envRenderTarget = null;
  let lightningTimer = 6.5;
  let thunderCallback = null;

  const flashLight = new THREE.PointLight(0xffffff, 0, 55);
  scene.add(flashLight);

  const blendedTop = new THREE.Color();
  const blendedMid = new THREE.Color();
  const blendedHoriz = new THREE.Color();
  const cloudLightTint = new THREE.Color(0xeef6fc);
  const cloudStormTint = new THREE.Color(0x526475);

  return {
    skyDome,
    fog,
    sunLight,
    sunDirection,
    sunbeamGroup,
    pollenParticles,
    cloudGroup,
    rainParticles,
    windStreaks,
    WEATHER_MODES,
    getWeather: () => currentWeather,
    getWindMultiplier: () => weatherWindMult,
    getWetness: () => currentWetness,
    initEnvironmentMap(renderer) {
      if (!renderer) return;
      try {
        const pmrem = new THREE.PMREMGenerator(renderer);
        pmrem.compileEquirectangularShader();
        const envScene = new THREE.Scene();
        const envSky = new THREE.Mesh(
          new THREE.SphereGeometry(40, 24, 16),
          new THREE.MeshBasicMaterial({
            color: 0x6ba8d6,
            side: THREE.BackSide,
          })
        );
        const envSun = new THREE.Mesh(
          new THREE.SphereGeometry(5, 12, 10),
          new THREE.MeshBasicMaterial({ color: 0xfff3d1 })
        );
        envSun.position.copy(sunDirection).multiplyScalar(28);
        const envForestBounce = new THREE.Mesh(
          new THREE.SphereGeometry(42, 16, 8, 0, Math.PI * 2, Math.PI * 0.52, Math.PI * 0.48),
          new THREE.MeshBasicMaterial({ color: 0x26442c, side: THREE.BackSide })
        );
        envScene.add(envSky);
        envScene.add(envSun);
        envScene.add(envForestBounce);
        if (envRenderTarget) envRenderTarget.dispose();
        envRenderTarget = pmrem.fromScene(envScene, 0.04);
        scene.environment = envRenderTarget.texture;
        pmrem.dispose();
      } catch (_) {
        // Headless/non-WebGL context safe fallback
      }
    },
    onThunder(cb) {
      thunderCallback = cb;
    },
    setWeather(mode) {
      const normalized = WEATHER_MODES[String(mode || '').toUpperCase()] || WEATHER_MODES.SUNNY;
      currentWeather = normalized;
    },
    setDoomAmount(amount) {
      targetDoom = THREE.MathUtils.clamp(amount, 0, 1);
    },
    triggerFlash(colorHex, pos, intensity = 16) {
      flashLight.color.setHex(colorHex);
      flashLight.position.copy(pos).add(new THREE.Vector3(0, 3, 0));
      flashLight.intensity = intensity;
      flashTimer = 0.75;
    },
    setQuality(level) {
      if (level === 'low') {
        activeParticleCount = 110;
        activeRainCount = 180;
        activeWindCount = 50;
        sunbeamGroup.visible = false;
        cloudGroup.visible = false;
      } else if (level === 'medium') {
        activeParticleCount = 200;
        activeRainCount = 320;
        activeWindCount = 85;
        sunbeamGroup.visible = true;
        cloudGroup.visible = true;
      } else {
        activeParticleCount = maxParticleCount;
        activeRainCount = maxRainCount;
        activeWindCount = maxWindStreakCount;
        sunbeamGroup.visible = true;
        cloudGroup.visible = true;
      }
      particleGeo.setDrawRange(0, activeParticleCount);
      rainGeo.setDrawRange(0, activeRainCount);
      windGeo.setDrawRange(0, activeWindCount);
    },
    update(time, playerPos, dt = 0.016) {
      const preset = WEATHER_PRESETS[currentWeather] || WEATHER_PRESETS[WEATHER_MODES.SUNNY];
      currentDoom = THREE.MathUtils.lerp(currentDoom, targetDoom, Math.min(1, dt * 1.8));
      weatherWindMult = THREE.MathUtils.lerp(weatherWindMult, preset.windMult, Math.min(1, dt * 1.4));

      blendedTop.copy(clearTop).lerp(stormTop, preset.skyDarken).lerp(doomTop, currentDoom);
      blendedMid.copy(clearMid).lerp(stormMid, preset.skyDarken).lerp(doomMid, currentDoom);
      blendedHoriz.copy(clearHorizon).lerp(preset.fogColor, Math.max(preset.skyDarken, 0.35)).lerp(doomHorizon, currentDoom);

      skyMaterial.uniforms.uTopColor.value.copy(blendedTop);
      skyMaterial.uniforms.uMidColor.value.copy(blendedMid);
      skyMaterial.uniforms.uHorizonColor.value.copy(blendedHoriz);
      fog.color.copy(blendedHoriz);

      const targetFogDensity = THREE.MathUtils.lerp(preset.fogDensity, 0.0128, currentDoom);
      fog.density = THREE.MathUtils.lerp(fog.density, targetFogDensity, Math.min(1, dt * 1.6));

      const targetSun = 2.38 * preset.sunMult * (1 - currentDoom * 0.5);
      const targetHemi = 0.82 * preset.hemiMult * (1 - currentDoom * 0.42);
      sunLight.intensity = THREE.MathUtils.lerp(sunLight.intensity, targetSun, Math.min(1, dt * 2.0));
      hemiLight.intensity = THREE.MathUtils.lerp(hemiLight.intensity, targetHemi, Math.min(1, dt * 2.0));

      cloudMat.opacity = THREE.MathUtils.lerp(cloudMat.opacity, preset.cloudOpacity, Math.min(1, dt * 1.5));
      cloudMat.color.copy(cloudLightTint).lerp(cloudStormTint, Math.max(preset.skyDarken, currentDoom * 0.85));

      const shaftVisibleMult = currentWeather === WEATHER_MODES.SUNNY ? 1.0 : currentWeather === WEATHER_MODES.WINDSTORM ? 0.55 : 0.16;
      beamMat.opacity = THREE.MathUtils.lerp(0.14 * shaftVisibleMult, 0.02, currentDoom) * (0.9 + Math.sin(time * 0.7) * 0.1);

      // Drift sky clouds dynamically with wind multiplier
      if (cloudGroup.visible) {
        for (let i = 0; i < cloudItems.length; i++) {
          const c = cloudItems[i];
          c.cluster.position.x += c.speed * weatherWindMult * dt;
          if (c.cluster.position.x > 135) {
            c.cluster.position.x = -135;
          }
        }
      }

      // Thunderstorm random lightning flashes + thunder callback
      if (currentWeather === WEATHER_MODES.THUNDERSTORM) {
        lightningTimer -= dt;
        if (lightningTimer <= 0) {
          lightningTimer = 4.2 + Math.random() * 5.0;
          const boltPos = new THREE.Vector3(
            playerPos.x + (Math.random() - 0.5) * 28,
            playerPos.y + 12,
            playerPos.z - 12 + (Math.random() - 0.5) * 24
          );
          this.triggerFlash(0xbbe8ff, boltPos, 34);
          sunLight.intensity = 4.8;
          if (thunderCallback) thunderCallback();
        }
      }

      if (flashTimer > 0) {
        flashTimer = Math.max(0, flashTimer - dt);
        flashLight.intensity *= 0.92;
      } else {
        flashLight.intensity = 0;
      }

      sunLight.target.position.set(playerPos.x, playerPos.y, playerPos.z);
      sunLight.position.copy(playerPos).addScaledVector(sunDirection, 75);
      sunLight.target.updateMatrixWorld();

      if (sunbeamGroup.visible) {
        for (let i = 0; i < shafts.length; i++) {
          const s = shafts[i];
          s.beam.position.x = s.baseX + Math.sin(time * 0.25 + i) * 0.8;
          s.beam.position.z = s.baseZ + Math.cos(time * 0.2 + i) * 0.6;
        }
      }

      // Floating forest pollen motes
      const posArr = pollenParticles.geometry.attributes.position.array;
      for (let i = 0; i < activeParticleCount; i++) {
        const idx = i * 3;
        posArr[idx] += (Math.sin(time * 0.5 + i) * 0.004 + (weatherWindMult - 1.0) * 0.018) * particleSpeeds[i];
        posArr[idx + 1] += Math.cos(time * 0.4 + i * 0.7) * 0.003;
        posArr[idx + 2] += Math.cos(time * 0.45 + i * 1.3) * 0.004 * particleSpeeds[i];

        if (posArr[idx] - playerPos.x > 30) posArr[idx] -= 60;
        if (posArr[idx] - playerPos.x < -30) posArr[idx] += 60;
        if (posArr[idx + 2] - playerPos.z > 30) posArr[idx + 2] -= 60;
        if (posArr[idx + 2] - playerPos.z < -30) posArr[idx + 2] += 60;
      }
      pollenParticles.geometry.attributes.position.needsUpdate = true;

      // Rain / Storm Streaks around player
      const targetRainOpacity = preset.rainIntensity * 0.72;
      rainMat.opacity = THREE.MathUtils.lerp(rainMat.opacity, targetRainOpacity, Math.min(1, dt * 3.0));
      rainParticles.visible = rainMat.opacity > 0.03;
      if (rainParticles.visible) {
        const rainArr = rainGeo.attributes.position.array;
        const slantX = (weatherWindMult - 0.8) * 3.2;
        for (let i = 0; i < activeRainCount; i++) {
          const idx = i * 3;
          rainArr[idx] += slantX * dt;
          rainArr[idx + 1] -= rainSpeeds[i] * dt;
          if (rainArr[idx + 1] < playerPos.y - 1.0) {
            rainArr[idx + 1] = playerPos.y + 18 + (i % 7);
            rainArr[idx] = playerPos.x + (Math.random() - 0.5) * 44;
            rainArr[idx + 2] = playerPos.z + (Math.random() - 0.5) * 44;
          }
          if (rainArr[idx] - playerPos.x > 22) rainArr[idx] -= 44;
          if (rainArr[idx] - playerPos.x < -22) rainArr[idx] += 44;
          if (rainArr[idx + 2] - playerPos.z > 22) rainArr[idx + 2] -= 44;
          if (rainArr[idx + 2] - playerPos.z < -22) rainArr[idx + 2] += 44;
        }
        rainGeo.attributes.position.needsUpdate = true;
      }

      // Surface wetness sheen (rises during Rain/Thunderstorm, dries cleanly in Sunny/Windstorm)
      currentWetness = THREE.MathUtils.lerp(currentWetness, preset.rainIntensity, Math.min(1, dt * 1.1));

      // Horizontal swirling wind gusts (strongest in WINDSTORM & THUNDERSTORM)
      const targetWindOpacity = weatherWindMult > 1.4 ? Math.min(0.62, (weatherWindMult - 1.35) * 0.45) : 0.0;
      windMat.opacity = THREE.MathUtils.lerp(windMat.opacity, targetWindOpacity, Math.min(1, dt * 2.5));
      windStreaks.visible = windMat.opacity > 0.03;
      if (windStreaks.visible) {
        const wArr = windGeo.attributes.position.array;
        for (let i = 0; i < activeWindCount; i++) {
          const idx = i * 3;
          wArr[idx] += windSpeeds[i] * weatherWindMult * 0.65 * dt;
          wArr[idx + 1] += Math.sin(time * 3.1 + i) * 0.6 * dt;
          wArr[idx + 2] += Math.cos(time * 2.3 + i) * 1.4 * dt;
          if (wArr[idx] - playerPos.x > 23) wArr[idx] -= 46;
          if (wArr[idx] - playerPos.x < -23) wArr[idx] += 46;
          if (wArr[idx + 2] - playerPos.z > 23) wArr[idx + 2] -= 46;
          if (wArr[idx + 2] - playerPos.z < -23) wArr[idx + 2] += 46;
        }
        windGeo.attributes.position.needsUpdate = true;
      }
    },
    setFogEnabled(enabled) {
      scene.fog = enabled ? fog : null;
    },
    setShadowMapSize(size) {
      if (size <= 0) {
        sunLight.castShadow = false;
        return;
      }
      sunLight.castShadow = true;
      if (sunLight.shadow.mapSize.width !== size) {
        sunLight.shadow.mapSize.set(size, size);
        if (sunLight.shadow.map) {
          sunLight.shadow.map.dispose();
          sunLight.shadow.map = null;
        }
      }
    },
  };
}
