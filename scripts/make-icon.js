// Generates assets/icon.png (pixel-art app icon) without external dependencies.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ART = [
  '................',
  '..........yy....',
  '.........yyyy...',
  '.........yyyy...',
  '..........yy....',
  '....gg..........',
  '...gggg.........',
  '..gggggg........',
  '...gggg.....b...',
  '....tt.....bbb..',
  '....tt....bbbbb.',
  'GGGGGGGGGGGGGGGG',
  'DDDDDDDDDDDDDDDD',
  'DDDdDDDDDDdDDDDD',
  'DDDDDDdDDDDDDDdD',
  'DDDDDDDDDDDDDDDD',
];
const PAL = {
  '.': [0x5f, 0xa8, 0xe8, 255], y: [0xff, 0xe0, 0x6a, 255], g: [0x3f, 0x8f, 0x2f, 255], t: [0x6b, 0x44, 0x23, 255],
  b: [0x8a, 0x6a, 0x4a, 255], G: [0x5a, 0xab, 0x42, 255], D: [0x7a, 0x52, 0x32, 255], d: [0x5e, 0x3e, 0x24, 255],
};

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size) {
  const scale = size / 16;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const ch = ART[Math.floor(y / scale)][Math.floor(x / scale)];
      const c = PAL[ch];
      // rounded corners
      const cx = Math.min(x, size - 1 - x), cy = Math.min(y, size - 1 - y);
      const r = size * 0.18;
      const out = cx < r && cy < r && (r - cx) ** 2 + (r - cy) ** 2 > r * r;
      raw.set(out ? [0, 0, 0, 0] : c, y * (size * 4 + 1) + 1 + x * 4);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const out = path.join(__dirname, '..', 'assets');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'icon.png'), png(512));
fs.writeFileSync(path.join(out, 'tray.png'), png(32));
console.log('wrote assets/icon.png and assets/tray.png');
