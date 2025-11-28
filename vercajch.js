const EARTH_RADIUS = 6378137;

const rad = x => (x * Math.PI) / 180;
const deg = x => (x * 180) / Math.PI;

const latLngDist = function(p1, p2) {
  const dLat = rad(p2.lat() - p1.lat());
  const dLong = rad(p2.lng() - p1.lng());

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(p1.lat())) *
      Math.cos(rad(p2.lat())) *
      Math.sin(dLong / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = EARTH_RADIUS * c;

  return distanceKm;
};

// taken from https://www.movable-type.co.uk/scripts/latlong.html
export const headingFromPoints = (p1, p2) => {
  const φ1 = rad(p1.lat());
  const φ2 = rad(p2.lat());
  const dlng = rad(p1.lng()) - rad(p2.lng());
  const y = Math.sin(dlng) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(dlng);
  return deg(Math.atan2(y, x));
};

function* enumerate(iterable) {
  let count = 0;
  for (let item of iterable) {
    yield [count++, item];
  }
}

export const clamp = (x, min, max) => Math.min(Math.max(x, min), max);

export { latLngDist, rad, deg, enumerate };

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const documentVisible = () => new Promise((resolve) => {
  if (document.visibilityState === 'visible') {
    resolve();
  } else {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        resolve();
      }
    });
  }
});

export const scale = (value, smin, smax, tmin, tmax) => (value - smin) * (tmax - tmin) / (smax - smin) + tmin;

export const choose = list => list[Math.floor(Math.random() * list.length)];

export const openLink = (href) => {
  const link = document.createElement('a');
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener';
  link.click();
};

export const getVelocity = (target, origin, maximum) => {
  const forwards = target - origin;
  const backwards = maximum + forwards;

  if (Math.abs(forwards) < Math.abs(backwards)) {
    return forwards;
  }

  return backwards;
};

export const approachPov = async (G, targetPov, durationMS, steps = 100) => {
  const initialPov = G.map.getPov();

  const pitchStep = getVelocity(targetPov.pitch, initialPov.pitch, 360) / steps;
  const headingStep = getVelocity(targetPov.heading, initialPov.heading, 360) / steps;
  const zoomStep = (targetPov.zoom - initialPov.zoom) / steps;

  const stepMS = durationMS / steps;

  const pov = initialPov;
  for (let i = 0; i < steps; i++) {
    pov.pitch += pitchStep;
    pov.heading += headingStep;
    pov.zoom += zoomStep;

    G.map.setPov({ ...pov });

    await sleep(stepMS);
  }
};


export const approachLatLng = async (map, target, durationMS, steps = 10) => {
  const initial = { lat: map.getCenter().lat(), lng: map.getCenter().lng() };
  const latStep = (target.lat - initial.lat) / steps;
  const lngStep = (target.lng - initial.lng) / steps;
  const stepMS = durationMS / steps;

  const center = initial;
  for (let i = 0; i < steps; i++) {
    center.lat += latStep;
    center.lng += lngStep;

    map.panTo(center);
    await sleep(stepMS);
  }
};
