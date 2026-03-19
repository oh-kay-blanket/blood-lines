// Generates PNG icons from the SVG favicon for PWA manifest
// Uses canvas to render SVG to PNG at required sizes
const fs = require('fs');
const path = require('path');

// Read SVG and create a simple colored PNG icon as fallback
// Since we can't render SVG server-side without dependencies,
// generate simple icons with the app's visual identity
function generatePNG(size) {
  // Create a minimal valid PNG with the brand colors
  // This is a simple circle-based icon matching the favicon design
  const { createCanvas } = (() => {
    try {
      return require('canvas');
    } catch {
      return { createCanvas: null };
    }
  })();

  if (createCanvas) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const svg = fs.readFileSync(path.join(__dirname, 'src/img/favicon.svg'), 'utf8');
    // Would need proper SVG rendering here
  }

  // Fallback: create a minimal PNG programmatically
  // PNG structure: signature + IHDR + IDAT + IEND
  return createMinimalPNG(size);
}

function createMinimalPNG(size) {
  const { deflateSync } = require('zlib');

  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);  // width
  ihdr.writeUInt32BE(size, 4);  // height
  ihdr.writeUInt8(8, 8);        // bit depth
  ihdr.writeUInt8(2, 9);        // color type (RGB)
  ihdr.writeUInt8(0, 10);       // compression
  ihdr.writeUInt8(0, 11);       // filter
  ihdr.writeUInt8(0, 12);       // interlace

  // Create pixel data - draw circles matching the favicon
  const rawData = [];
  const cx = size / 2;
  const cy = size / 2;
  const bgColor = [1, 0, 0];       // #010000 dark bg
  const nodeColor = [246, 237, 208]; // #f6edd0 cream
  const lineColor = [252, 103, 103]; // #fc6767 red

  for (let y = 0; y < size; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Main circle (background)
      if (dist > size * 0.45) {
        rawData.push(0, 0, 0); // transparent-ish (black)
      }
      // Top node
      else if (Math.sqrt((x - cx) ** 2 + (y - cy * 0.45) ** 2) < size * 0.11) {
        rawData.push(...nodeColor);
      }
      // Bottom-left node
      else if (Math.sqrt((x - cx * 0.36) ** 2 + (y - cy * 1.3) ** 2) < size * 0.13) {
        rawData.push(...nodeColor);
      }
      // Bottom-right node
      else if (Math.sqrt((x - cx * 1.6) ** 2 + (y - cy * 1.4) ** 2) < size * 0.16) {
        rawData.push(...nodeColor);
      }
      // Center node
      else if (Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) < size * 0.08) {
        rawData.push(...nodeColor);
      }
      // Lines (approximate)
      else {
        // Check if point is near a line between nodes
        const nearLine = isNearLine(x, y, cx, cy * 0.45, cx, cy, size * 0.015)
          || isNearLine(x, y, cx * 0.36, cy * 1.3, cx, cy * 0.45, size * 0.015)
          || isNearLine(x, y, cx * 1.6, cy * 1.4, cx, cy * 0.45, size * 0.015);
        if (nearLine) {
          rawData.push(...lineColor);
        } else {
          rawData.push(...bgColor);
        }
      }
    }
  }

  function isNearLine(px, py, x1, y1, x2, y2, threshold) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return false;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (len * len)));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    const distSq = (px - projX) ** 2 + (py - projY) ** 2;
    return distSq < threshold * threshold;
  }

  const rawBuf = Buffer.from(rawData);
  const compressed = deflateSync(rawBuf);

  // Build chunks
  const chunks = [signature];

  // IHDR
  chunks.push(makeChunk('IHDR', ihdr));

  // IDAT
  chunks.push(makeChunk('IDAT', compressed));

  // IEND
  chunks.push(makeChunk('IEND', Buffer.alloc(0)));

  return Buffer.concat(chunks);
}

function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuf]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Generate icons
const dist = path.join(__dirname, 'src', 'img');
[192, 512].forEach((size) => {
  const png = createMinimalPNG(size);
  fs.writeFileSync(path.join(dist, `icon-${size}.png`), png);
  console.log(`Generated icon-${size}.png (${png.length} bytes)`);
});
