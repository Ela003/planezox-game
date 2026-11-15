/**
 * Lightweight Web Audio synthesizer for offline mobile game SFX & dramatic sci-fi ambient music.
 */
export class GameAudio {
  constructor() {
    this.ctx = null;
    this.masterVol = 0.8;
    this.musicVol = 0.55;
    this.sfxVol = 0.85;
    this.ambientStarted = false;
    this.ambientGain = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.ambientStarted) {
      this.startAmbient();
    }
    return this.ctx;
  }

  setVolumes(master, music, sfx) {
    this.masterVol = master;
    this.musicVol = music;
    this.sfxVol = sfx;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(
        Math.max(0.0001, master * music * 0.06),
        this.ctx.currentTime,
        0.08
      );
    }
  }

  startAmbient() {
    if (!this.ctx || this.ambientStarted) return;
    this.ambientStarted = true;

    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.value = 98; // Deep cosmic G2
      osc2.type = 'triangle';
      osc2.frequency.value = 146.83; // D3 harmonic

      filter.type = 'lowpass';
      filter.frequency.value = 340;

      gain.gain.value = Math.max(0.0001, this.masterVol * this.musicVol * 0.06);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();
      this.ambientGain = gain;
    } catch (_) {
      // Ignore autoplay blocks before first tap
    }
  }

  playTone(freqStart, freqEnd, duration, type = 'triangle', gainPeak = 0.16) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const vol = this.masterVol * this.sfxVol * gainPeak;
    if (vol <= 0.001) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(25, freqEnd), now + duration);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playSwing(isHeavy = false) {
    this.playTone(isHeavy ? 190 : 310, isHeavy ? 65 : 110, isHeavy ? 0.28 : 0.16, 'sawtooth', isHeavy ? 0.18 : 0.12);
  }

  playSwordSlash(comboStep = 1) {
    const base = 360 + comboStep * 70;
    this.playTone(base, 140, 0.15, 'triangle', 0.14);
  }

  playAxeCleave() {
    this.playTone(170, 58, 0.28, 'sawtooth', 0.19);
  }

  playGauntletPunch(comboStep = 1) {
    this.playTone(210 + comboStep * 45, 72, 0.14, 'square', 0.16);
  }

  playGroundSlam() {
    this.playTone(130, 36, 0.42, 'sawtooth', 0.24);
    setTimeout(() => this.playTone(260, 80, 0.25, 'triangle', 0.14), 50);
  }

  playHit() {
    this.playTone(150, 48, 0.14, 'square', 0.16);
  }

  playBowShot() {
    this.playTone(540, 220, 0.14, 'triangle', 0.14);
  }

  playPlasmaRifle() {
    this.playTone(860, 210, 0.16, 'sawtooth', 0.14);
  }

  playDualBlaster(alt = false) {
    this.playTone(alt ? 980 : 880, 310, 0.11, 'triangle', 0.12);
  }

  playReload() {
    this.playTone(320, 520, 0.12, 'sine', 0.13);
    setTimeout(() => this.playTone(580, 840, 0.16, 'triangle', 0.13), 130);
  }

  playPlasmaShot() {
    this.playTone(680, 140, 0.22, 'sawtooth', 0.15);
  }

  playExplosion() {
    this.playTone(95, 28, 0.75, 'sawtooth', 0.26);
    setTimeout(() => this.playTone(65, 24, 0.65, 'square', 0.18), 80);
  }

  playAwakening() {
    this.playTone(220, 880, 0.65, 'sine', 0.2);
    setTimeout(() => this.playTone(440, 1174, 0.7, 'triangle', 0.18), 140);
  }

  playBlock() {
    this.playTone(620, 440, 0.12, 'sine', 0.18);
  }

  playPerfectBlock() {
    this.playTone(740, 1180, 0.18, 'sine', 0.22);
    setTimeout(() => this.playTone(1046, 1568, 0.26, 'triangle', 0.18), 65);
  }

  playDodge() {
    this.playTone(260, 120, 0.18, 'sine', 0.12);
  }

  playJump() {
    this.playTone(180, 340, 0.15, 'sine', 0.1);
  }

  playSpecial() {
    this.playTone(320, 760, 0.36, 'triangle', 0.18);
  }

  playUltimate() {
    this.playTone(140, 620, 0.55, 'sawtooth', 0.22);
    setTimeout(() => this.playTone(440, 880, 0.45, 'sine', 0.16), 90);
  }

  playHeal() {
    this.playTone(440, 660, 0.22, 'sine', 0.14);
    setTimeout(() => this.playTone(660, 880, 0.24, 'sine', 0.12), 110);
  }

  playObjectiveComplete() {
    this.playTone(523.25, 659.25, 0.18, 'triangle', 0.16);
    setTimeout(() => this.playTone(659.25, 783.99, 0.25, 'triangle', 0.16), 140);
  }

  playCrystalPickup() {
    this.playTone(698.46, 1046.5, 0.18, 'sine', 0.14);
    setTimeout(() => this.playTone(1046.5, 1396.91, 0.22, 'triangle', 0.12), 80);
  }

  playThunder() {
    this.playTone(74, 24, 1.1, 'sawtooth', 0.22);
    setTimeout(() => this.playTone(58, 22, 0.9, 'triangle', 0.16), 160);
  }

  playPowerCast(powerId) {
    switch (powerId) {
      case 'shadow_dash':
        this.playTone(460, 140, 0.24, 'triangle', 0.16);
        break;
      case 'plasma_blast':
        this.playTone(720, 180, 0.34, 'sawtooth', 0.18);
        break;
      case 'titan_shield':
        this.playTone(280, 560, 0.32, 'sine', 0.17);
        break;
      case 'gravity_control':
        this.playTone(150, 70, 0.52, 'sine', 0.2);
        break;
      case 'quantum_blast':
        this.playTone(240, 880, 0.42, 'sawtooth', 0.2);
        setTimeout(() => this.playTone(90, 34, 0.45, 'square', 0.18), 110);
        break;
      case 'guardian_mode':
        this.playAwakening();
        break;
      default:
        this.playSpecial();
        break;
    }
  }
}
