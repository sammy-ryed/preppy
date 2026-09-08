const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function setup() {
  const players = new Map();
  let appState;
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(require.resolve('../services/soundEffects.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require(name) {
    if (name.endsWith('.mp3')) return name;
    if (name === 'react-native') return { AppState: { currentState: 'active', addEventListener(_, listener) { appState = listener; return { remove() {} }; } } };
    if (name === 'expo-audio') return {
      setAudioModeAsync: async () => {},
      createAudioPlayer(source) {
        const player = { isLoaded: true, currentTime: 0.5, playing: false, ended: false, plays: 0, pauses: 0, seeks: [], removed: false,
          get currentStatus() { return { isLoaded: this.isLoaded || this.ended }; },
          play() { this.plays++; this.playing = true; }, pause() { this.pauses++; this.playing = false; },
          async seekTo(time) { this.seeks.push(time); this.currentTime = time; this.ended = false; this.isLoaded = true; }, remove() { this.removed = true; },
          addListener(_, listener) { this.loaded = listener; return { remove() {} }; },
        };
        players.set(source, player); return player;
      },
    };
    throw new Error(`Unexpected import ${name}`);
  } });
  const stop = exports.startSoundEffects();
  const player = file => players.get(`../assets/${file}.mp3`);
  return { ...exports, stop, player, background: () => appState('background'), foreground: () => appState('active') };
}
const flush = () => new Promise(resolve => setImmediate(resolve));

test('feedback, movement and badge sounds play once per semantic event and restart from the beginning', async () => {
  const audio = setup();
  for (const [sound, file] of [['correct', 'correct-sound'], ['wrong', 'wrong-answer-sound-effect'], ['badge', 'badge-sound'], ['levelUp', 'level-up-sound']]) {
    audio.playSound(sound, 'event-one'); audio.playSound(sound, 'event-one');
    await flush();
    assert.equal(audio.player(file).plays, 1);
    audio.playSound(sound, 'event-two'); await flush();
    assert.equal(audio.player(file).plays, 2);
    assert.deepEqual(audio.player(file).seeks, [0, 0]);
  }
  audio.stop();
});

test('rapid taps supersede pending playback; background and unmount cancel pending sounds', async () => {
  const audio = setup();
  audio.playSound('tap'); audio.playSound('tap'); await flush();
  assert.equal(audio.player('tap-sound').plays, 1);
  audio.playSound('tap'); audio.background(); await flush();
  assert.equal(audio.player('tap-sound').plays, 1);
  audio.playSound('correct', 'background-answer'); await flush();
  assert.equal(audio.player('correct-sound').plays, 0);
  audio.foreground(); audio.player('tap-sound').currentTime = 0.5;
  audio.playSound('tap'); audio.stop(); await flush();
  assert.equal(audio.player('tap-sound').plays, 1);
  assert.equal(audio.player('tap-sound').removed, true);
});

test('a celebration requested while its local file loads plays when ready', async () => {
  const audio = setup();
  const badge = audio.player('badge-sound'); badge.isLoaded = false;
  audio.playSound('badge', 'new-badge'); await flush();
  assert.equal(badge.plays, 0);
  badge.isLoaded = true; badge.loaded({ isLoaded: true }); await flush();
  assert.equal(badge.plays, 1);
  audio.playSound('badge', 'new-badge'); await flush();
  assert.equal(badge.plays, 1);
  audio.stop();
});

test('Android ended players replay for every question and repeated tap without a new load event', async () => {
  const audio = setup();
  for (const [sound, file] of [['correct', 'correct-sound'], ['wrong', 'wrong-answer-sound-effect'], ['tap', 'tap-sound']]) {
    const player = audio.player(file);
    for (let question = 0; question < 12; question++) {
      // Reproduce the native Android getter/status mismatch after playback ends.
      player.isLoaded = false; player.ended = true; player.currentTime = 1; player.playing = false;
      audio.playSound(sound, sound === 'tap' ? undefined : `question-${question}`);
      await flush();
      assert.equal(player.plays, question + 1);
      assert.equal(player.currentTime, 0);
    }
  }
  audio.stop();
});

test('a preloaded first tap starts synchronously without seeking and uses the stronger tap volume', () => {
  const audio = setup();
  const tap = audio.player('tap-sound'); tap.currentTime = 0;
  audio.playSound('tap');
  assert.equal(tap.plays, 1);
  assert.deepEqual(tap.seeks, []);
  assert.equal(tap.volume, 0.8);
  audio.stop();
});

test('an interrupted pending seek does not permanently mark feedback as already heard', async () => {
  const audio = setup();
  audio.playSound('correct', 'same-answer'); audio.background(); await flush();
  assert.equal(audio.player('correct-sound').plays, 0);
  audio.foreground(); audio.playSound('correct', 'same-answer'); await flush();
  assert.equal(audio.player('correct-sound').plays, 1);
  audio.stop();
});
