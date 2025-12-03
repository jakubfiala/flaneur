import { initStrudel, evaluate } from 'https://esm.run/@strudel/web';

const codeDisplay = document.getElementById('strudel-code');

initStrudel({
  prebake: () => samples('github:tidalcycles/dirt-samples'),
});

export const tracks = new Map();

export const play = (track, code) => {
  console.log('[strudel]', 'playing', code);
  tracks.set(track, code);

  const full = Array.from(tracks.values()).map(t => `$: ${t}`).join('\n');
  console.log('[strudel]', 'full code', full);

  codeDisplay.innerText = full;
  evaluate(full);
}
