const response = await fetch('/vars');
const text = await response.text();
const lines = text.split('\n');
export default Object.fromEntries(lines.map(l => l.split('=')));
