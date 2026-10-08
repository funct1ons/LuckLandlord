/* Original offline industrial-fantasy illustration; no DOM/engine dependencies.
 * welcome/room: 1920x1080. machine: 1000x700, transparent interior
 * x=72..928,y=62..640. All APIs return decorative image markup strings.
 * Scenes are baked from original procedural SVG; PNG avoids full-screen filter work.
 * Not a claim of physical hand painting.
 */
(function (root) {
  'use strict';
  // Resolve relative to this script, not the embedding page's route.
  const script = typeof document !== 'undefined' && document.currentScript;
  const base = script && script.src
    ? new URL('../../assets/art/scenes/', script.src).href
    : 'assets/art/scenes/';
  const safe = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  function image(kind, file, width, height, aspect) {
    return '<img class="gdd1-scene gdd1-scene-' + kind + '" src="' + safe(base + file) +
      '" width="' + width + '" height="' + height + '" alt="" aria-hidden="true" decoding="async">';
  }
  function welcome() { return image('welcome', 'welcome-workshop.png', 1920, 1080, 'xMidYMid slice'); }
  function machine() { return image('machine', 'machine-frame.svg', 1000, 700, 'none'); }
  // Optional full-room layer; caller mounts behind the game shell, pointer-events:none.
  function room() { return image('room', 'room-workshop.png', 1920, 1080, 'xMidYMid slice'); }
  root.GDD1SCENE = { welcome, machine, room };
})(typeof window !== 'undefined' ? window : globalThis);
