import { importLibrary, setOptions } from 'https://esm.run/@googlemaps/js-api-loader';

import fragmentShaderSource from './shader.js';
import { createRenderer } from './glsl-sandbox.js';
import { choose, clamp } from './vercajch.js';
import { getSurroundingSounds } from './freesound.js';
import Sharawadji from './sharawadji/index.js';
import env from "./env.js";
import { play } from "./strudel.js";

setOptions({ key: env.GOOGLE_MAPS_API_KEY });

const { StreetViewPanorama } = await importLibrary('streetView');

let sharawadji = null;
const panorama = new StreetViewPanorama(document.getElementById('pano'), { position: { lat: 41.380319074503305, lng: 2.1771172573345092 }});

const ROTATE_SPEED = 0.05;
const COMMANDER_URL = 'http://localhost:5000';

const move = () => {
  requestAnimationFrame(move);
  const pov = panorama.getPov();
  panorama.setPov({ heading: (pov.heading + ROTATE_SPEED) % 360, pitch: pov.pitch });
}

const audioContext = new AudioContext();
audioContext.suspend();

window.ac = audioContext;

const initAudio = async () => {
  sharawadji = new Sharawadji([], panorama, audioContext);

  const position = panorama.getPosition();
  const sounds = await getSurroundingSounds({ lat: position.lat(), lng: position.lng() });
  sounds.forEach((s) => sharawadji.addSound(s));

  window.sharawadji = sharawadji;
  await audioContext.resume();

  sharawadji.masterGain.gain.setValueAtTime(0, audioContext.currentTime);
};

const loadFromSpeechServer = async (text) => {
  const response = await fetch('http://localhost:3000/speech', { method: 'post', body: text });
  const buffer = await audioContext.decodeAudioData(await response.arrayBuffer());
  const source = new AudioBufferSourceNode(audioContext, { buffer });
  source.playbackRate.value = Math.random() + 0.5;
  source.connect(audioContext.destination);
  source.start();

  return source;
};

document.body.addEventListener('keypress', initAudio, { once: true });

requestAnimationFrame(move);

const { canvas, draw } = createRenderer(fragmentShaderSource);

canvas.id = 'shader';
document.body.appendChild(canvas);

const onWindowResize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

onWindowResize();
window.addEventListener('resize', onWindowResize, false);

const mouse = new DOMPoint(0, 0);

window.addEventListener('pointermove', (event) => {
  mouse.x = event.clientX / window.innerWidth;
  mouse.y = event.clientY / window.innerHeight;
});

const renderedMouse = new DOMPoint(0, 0);

const animate = (time) => {
  // smoothly transition to the new mouse position
  if (Math.abs(mouse.x - renderedMouse.x) > 1e-1) {
    renderedMouse.x += (mouse.x - renderedMouse.x) / 20;
  }
  if (Math.abs(mouse.y - renderedMouse.y) > 1e-1) {
    renderedMouse.y += (mouse.y - renderedMouse.y) / 20;
  }

  requestAnimationFrame(animate);
  // draw(time, renderedMouse.x, renderedMouse.y, canvas.width, canvas.height, false);
};

export const startAnimating = () => requestAnimationFrame(animate);

startAnimating();

const commandInput = document.getElementById('command');

const translateCommand = async (text) => {
  const url = new URL(COMMANDER_URL);
  url.searchParams.set('query', text);
  const response = await fetch(url);
  return response.text();
}

const parseCommandText = (text) => {
  const matches = text.match(/^(.*){([0-9]):(.*)}$/i);
  if (!matches) {
    return { command: text, track: null, args: null };
  }

  const [m, command, track, args] = matches;
  return { command, track, args };
}

const execute = async (text) => {
  const { command, track, args } = parseCommandText(text);

  loadFromSpeechServer(command);

  const translated = await translateCommand(command);

  switch (translated) {
    case 'GO':
      const links = panorama.getLinks();
      if (links.length === 0) return;

      let link = choose(links);
      if (links.length <= 2) {
        const { heading } = panorama.getPov();
        link = links.reduce((acc, it) => Math.abs(heading - it.heading) < Math.abs(heading - acc.heading) ? it : acc, links[0]);
      }

      console.info('[command]', 'go', link);
      panorama.setPano(link.pano);
      panorama.setPov({ pitch: panorama.getPov().pitch, heading: link.heading });
      break;
    case 'QUIET':
      sharawadji?.masterGain.gain.setValueAtTime(1, audioContext.currentTime);
      sharawadji?.masterGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 5);
      break;
    case 'LOUD':
      sharawadji?.masterGain.gain.setValueAtTime(0, audioContext.currentTime);
      sharawadji?.masterGain.gain.linearRampToValueAtTime(1, audioContext.currentTime + 5);
      break;
    case 'PLAY':
      if (Number.isNaN(track) || !args) break;
      play(track, args);
      break;
    default:
      return;
  }
};

const commandHistory = [];

commandInput.addEventListener('input', (event) => {
  commandInput.style.setProperty('--length', commandInput.value.length);
})

commandInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    const selection = document.getSelection().toString();
    if (selection === "") return;

    commandHistory.push(commandInput.value);

    if (event.shiftKey) {
      loadFromSpeechServer(selection);
    } else {
      execute(selection);
    }

    const animation = commandInput.animate([
      { transform: "scale(1)", opacity: 1 },
      { transform: "scale(7)", opacity: 0.25 },
    ], { duration: 300 });

    animation.addEventListener('finish', () => {
      commandInput.value = commandInput.value.replace(selection, "");
    }, { once: true });
  } else if (event.key === 'ArrowUp') {
    commandInput.value = commandHistory.at(-1) ?? '';
  }
})
