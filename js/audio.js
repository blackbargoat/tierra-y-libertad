'use strict';
// Sound: synthesized music + effects, and the Spanish voice files
const Sound = {
  ctx: null, muted: Save.get('mute', false), vol: Object.assign({ music: .8, voice: 1, sfx: .8 }, Save.get('vol', {})),
  mv(k) { return this.muted ? 0 : Math.min(1, .5 * this.vol.music * k); },
  applyVol() { Save.set('vol', this.vol); if (this.track) this.track.volume = this.mv(1); if (this.mus) this.mus.gain.value = .32 * this.vol.music; if (this.fx) this.fx.gain.value = .5 * this.vol.sfx; if (this.vo) this.vo.volume = this.vol.voice; }, song: null, step: 0, next: 0, timer: null, vo: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.out = this.ctx.createGain(); this.out.gain.value = this.muted ? 0 : 1; this.out.connect(this.ctx.destination);
      this.mus = this.ctx.createGain(); this.mus.gain.value = .32 * this.vol.music; this.mus.connect(this.out);
      this.fx = this.ctx.createGain(); this.fx.gain.value = .5 * this.vol.sfx; this.fx.connect(this.out);
      this.timer = setInterval(() => this.tick(), 25);
    } catch (e) { this.ctx = null; }
    if (this.want && !this.trackName) { const w = this.want; this.want = null; this.play(w); }
  },
  toggle() { this.muted = !this.muted; Save.set('mute', this.muted); if (this.out) this.out.gain.value = this.muted ? 0 : 1; if (this.vo) this.vo.muted = this.muted; if (this.track) this.track.volume = this.mv(1); },
  stopTrack() { if (this.track) { this.track.pause(); this.track = null; } this.trackName = null; },
  f: n => 440 * Math.pow(2, (n - 69) / 12),
  note(n, t, dur, type, vol, dest) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = this.f(n);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
    o.connect(g); g.connect(dest || this.mus); o.start(t); o.stop(t + dur + .05);
  },
  noise(t, dur, vol, hp, dest) {
    const c = this.ctx, len = Math.max(1, dur * c.sampleRate | 0), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = b; f.type = 'highpass'; f.frequency.value = hp; g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(dest || this.mus); s.start(t);
  },
  // ---- music ----
  // music files (CC0, OpenGameArt) with the synth songs as a backup
  play(name) {
    this.want = name;
    if (TRACKS[name]) {
      this.song = null; if (this.trackName === name && this.track) return;
      this.stopTrack(); const a = new Audio('assets/music/' + TRACKS[name]); a.loop = true; a.volume = this.mv(1); a.playbackRate = name === 'boss' ? 1.08 : 1;
      this.track = a; this.trackName = name; a.play().catch(() => { if (this.track === a) this.trackName = null; });
      return;
    }
    this.stopTrack(); if (!this.ctx) return; if (this.song && this.song.name === name) return;
    this.song = SONGS[name] ? { name, ...SONGS[name] } : null; this.step = 0; this.next = this.ctx.currentTime + .1;
  },
  tick() {
    if (!this.ctx || !this.song) return;
    const s = this.song, dt = 60 / s.bpm / s.spb;
    while (this.next < this.ctx.currentTime + .15) {
      const i = this.step % s.len, bar = Math.floor(this.step / s.barLen) % s.chords.length, ch = s.chords[bar], t = this.next;
      s.play(this, i % s.barLen, ch, t, dt, i);
      this.step++; this.next += dt;
    }
  },
  // ---- effects ----
  sfx(n) {
    if (!this.ctx) return; const t = this.ctx.currentTime, F = this.fx;
    const N = (m, d, ty, v, dt = 0) => this.note(m, t + dt, d, ty, v, F);
    if (n === 'jump') { N(72, .08, 'square', .08); N(79, .08, 'square', .06, .04); }
    else if (n === 'shoot') this.noise(t, .08, .15, 1800, F);
    else if (n === 'hit') { this.noise(t, .12, .25, 400, F); N(45, .12, 'square', .1); }
    else if (n === 'boom') { this.noise(t, .4, .45, 80, F); N(33, .35, 'sawtooth', .12); }
    else if (n === 'right') [72, 76, 79, 84].forEach((m, i) => N(m, .14, 'triangle', .14, i * .07));
    else if (n === 'wrong') { N(52, .18, 'square', .1); N(47, .3, 'square', .1, .14); }
    else if (n === 'coin') { N(83, .06, 'square', .07); N(88, .12, 'square', .07, .05); }
    else if (n === 'pad') { N(60, .1, 'triangle', .15); N(72, .2, 'triangle', .12, .05); }
    else if (n === 'talk') N(67, .04, 'square', .03);
    else if (n === 'type') N(84 + (Math.random() * 4 | 0), .02, 'square', .015);
    else if (n === 'open') [67, 71, 74, 79].forEach((m, i) => N(m, .1, 'square', .07, i * .05));
    else if (n === 'step') this.noise(t, .03, .04, 2500, F);
    else if (n === 'select') N(76, .05, 'square', .06);
    else if (n === 'ko') [60, 55, 50, 45].forEach((m, i) => N(m, .12, 'square', .1, i * .08));
  },
  // ---- voice ----
  voice(id, onend) {
    this.stopVoice();
    const a = new Audio('assets/vo/' + id + '.mp3'); a.muted = this.muted; a.volume = this.vol.voice; this.vo = a;
    if (this.mus) this.mus.gain.setTargetAtTime(.1, this.ctx.currentTime, .1); if (this.track) this.track.volume = this.mv(.27);
    let done = false; const fin = () => { if (done) return; done = true; if (this.mus && this.ctx) this.mus.gain.setTargetAtTime(.32 * this.vol.music, this.ctx.currentTime, .3); if (this.track) this.track.volume = this.mv(1); onend && onend(); };
    a.onended = fin; a.onerror = fin; a.play().catch(fin);
    return a;
  },
  stopVoice() { if (this.vo) { this.vo.onended = null; this.vo.onerror = null; this.vo.pause(); this.vo = null; if (this.mus && this.ctx) this.mus.gain.setTargetAtTime(.32 * this.vol.music, this.ctx.currentTime, .3); if (this.track) this.track.volume = this.mv(1); } },
};

// Songs: each one is a small pattern player. chords are root notes; play() schedules one step.
const TRACKS = { title: 'overworld.mp3', story: 'negev_calm.m4a', calm: 'calm_town.mp3', battle: 'negev_fight.m4a', boss: 'negev_fight.m4a' };
const MAJ = [0, 4, 7], MIN = [0, 3, 7];
const SONGS = {
  // calm 3/4 waltz with a guitar-like pluck (explore parts)
  calm: { bpm: 96, spb: 2, barLen: 6, len: 6 * 8, chords: [[48, MAJ], [53, MAJ], [55, MAJ], [48, MAJ], [57, MIN], [53, MAJ], [55, MAJ], [48, MAJ]],
    mel: [76, 0, 79, 0, 76, 74, 72, 0, 74, 76, 77, 0, 79, 0, 77, 76, 74, 0, 72, 0, 0, 0, 74, 76, 72, 0, 76, 0, 79, 81, 77, 0, 76, 74, 72, 0, 74, 0, 79, 0, 77, 74, 72, 0, 0, 0, 0, 0],
    play(S, i, [r, q], t, dt, k) {
      if (i === 0) S.note(r - 12, t, dt * 3, 'triangle', .22);
      if (i === 2 || i === 4) q.forEach(x => S.note(r + x + 12, t, dt * 1.5, 'triangle', .05));
      const m = this.mel[k % this.mel.length]; if (m) S.note(m, t, dt * 1.8, 'square', .035);
    } },
  // sad slow version (Chinameca)
  sad: { bpm: 70, spb: 2, barLen: 6, len: 6 * 4, chords: [[45, MIN], [41, MAJ], [43, MAJ], [40, MIN]],
    play(S, i, [r, q], t, dt) {
      if (i === 0) S.note(r, t, dt * 5, 'triangle', .2);
      if (i % 2 === 0) S.note(r + q[(i / 2) % 3] + 24, t, dt * 3, 'sine', .07);
    } },
  // tense driving battle loop
  battle: { bpm: 138, spb: 4, barLen: 16, len: 16 * 4, chords: [[45, MIN], [41, MAJ], [48, MAJ], [43, MAJ]],
    play(S, i, [r, q], t, dt) {
      if (i % 2 === 0) S.note(r - 12 + (i % 8 === 6 ? 12 : 0), t, dt * 1.6, 'sawtooth', .07);
      if (i % 4 === 0) S.noise(t, .09, i % 8 === 4 ? .22 : .0, 150);
      if (i % 8 === 4) S.noise(t, .12, .16, 1200);
      if (i % 2 === 1) S.noise(t, .03, .05, 6000);
      if (i % 4 === 0 || i === 6 || i === 14) S.note(r + 12 + q[(i / 2 | 0) % 3], t, dt * 1.2, 'square', .04);
    } },
  // heavier boss loop
  boss: { bpm: 150, spb: 4, barLen: 16, len: 16 * 4, chords: [[40, MIN], [40, MIN], [41, MAJ], [39, MAJ]],
    play(S, i, [r, q], t, dt) {
      S.note(r - 12 + (i % 4 === 3 ? 7 : 0), t, dt * .9, 'sawtooth', .07);
      if (i % 4 === 0) S.noise(t, .1, .26, 120);
      if (i % 8 === 4) S.noise(t, .14, .18, 1000);
      if (i % 8 === 0) S.note(r + 24 + q[(i / 8 | 0) % 3], t, dt * 6, 'square', .045);
    } },
  // soft pad under the story
  story: { bpm: 60, spb: 1, barLen: 4, len: 16, chords: [[45, MIN], [41, MAJ], [48, MAJ], [43, MAJ]],
    play(S, i, [r, q], t, dt) { if (i === 0) q.forEach(x => S.note(r + x + 12, t, dt * 4.2, 'sine', .05)); if (i === 0) S.note(r - 12, t, dt * 4, 'triangle', .12); } },
  // title / menus: bright and simple
  title: { bpm: 112, spb: 2, barLen: 8, len: 8 * 4, chords: [[50, MAJ], [55, MAJ], [57, MAJ], [50, MAJ]],
    play(S, i, [r, q], t, dt) {
      if (i % 4 === 0) S.note(r - 12, t, dt * 2, 'triangle', .2);
      if (i % 2 === 1) q.forEach(x => S.note(r + x + 12, t, dt, 'triangle', .04));
      if (i === 0 || i === 3 || i === 6) S.note(r + 24 + q[i % 3], t, dt * 1.5, 'square', .035);
    } },
};
