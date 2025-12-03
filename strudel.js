import { initStrudel, s } from 'https://esm.run/@strudel/web';

initStrudel({
  prebake: () => samples('github:tidalcycles/dirt-samples'),
});

export const play = (code) => {
  console.log('[strudel]', 'playing', code);
  s(code).play();
}
