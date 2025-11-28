import env from "./env.js";

const soundInstanceFields = ['id', 'previews', 'geotag', 'name'];

const baseURL = new URL('https://freesound.org/apiv2/search');
baseURL.searchParams.set('fields', soundInstanceFields.join());

const headers = { Authorization: `Token ${env.FREESOUND_API_KEY}` };

const RANGE = 1e-2;

const getFilter = (position) => {
  const minLat = position.lat - RANGE;
  const minLng = position.lng - RANGE;
  const maxLat = position.lat + RANGE;
  const maxLng = position.lng + RANGE;
  console.log(minLat, minLng, maxLat, maxLng);
  return encodeURIComponent(`geotag:["${minLat}, ${minLng}" TO "${maxLat}, ${maxLng}"]`);
};

export const getSurroundingSounds = async (position) => {
  const url = new URL(baseURL);
  url.searchParams.set('filter', getFilter(position));

  const response = await fetch(url, { headers });
  if (!response.ok) return [];

  const data = await response.json();
  if (!data.count || data.count === 0) return [];

  return data.results.map((r) => {
    const [lat, lng] = r.geotag.split(' ').map((n) => parseFloat(n));
    const src = r.previews['preview-lq-mp3'];
    return { id: r.id, name: r.name, lat, lng, src, gain: 1, db: 80, loop: true };
  });
};
