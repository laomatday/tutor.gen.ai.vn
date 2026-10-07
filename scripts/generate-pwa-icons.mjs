import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function createPng(width, height, renderPixel) {
  const bytesPerPixel = 4; // RGBA
  const rowSize = 1 + width * bytesPerPixel;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      const [r, g, b, a] = renderPixel(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = deflateSync(rawData);

  // PNG Header
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdrChunk = createChunk("IHDR", ihdrData);
  const idatChunk = createChunk("IDAT", deflated);
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, "ascii");
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function renderBrandIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const radius = isMaskable ? w / 2 : w * 0.42;

  const dist = Math.hypot(x - cx, y - cy);
  const cornerRadius = w * 0.22;

  // Background rounded rectangle or full bleed for maskable
  let inBg = true;
  if (!isMaskable) {
    const rx = Math.max(0, Math.abs(x - cx) - (cx - cornerRadius));
    const ry = Math.max(0, Math.abs(y - cy) - (cy - cornerRadius));
    inBg = Math.hypot(rx, ry) <= cornerRadius;
    if (!inBg) return [0, 0, 0, 0];
  }

  // Official genAi gradient: navy → teal → cyan → sky.
  const stops = [
    [0.00, [36, 60, 143]],
    [0.44, [25, 183, 165]],
    [0.72, [73, 183, 219]],
    [1.00, [91, 183, 239]],
  ];
  let left = stops[0], right = stops[stops.length - 1];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) { left = stops[i - 1]; right = stops[i]; break; }
  }
  const local = Math.max(0, Math.min(1, (t - left[0]) / Math.max(0.0001, right[0] - left[0])));
  const rBg = Math.round(left[1][0] + (right[1][0] - left[1][0]) * local);
  const gBg = Math.round(left[1][1] + (right[1][1] - left[1][1]) * local);
  const bBg = Math.round(left[1][2] + (right[1][2] - left[1][2]) * local);

  // Simple clean emblem in center
  const scale = isMaskable ? 0.65 : 0.8;
  const nx = (x - cx) / (w * scale);
  const ny = (y - cy) / (h * scale);

  // Check graduation cap shape
  // Diamond top: |nx| / 0.4 + |ny + 0.15| / 0.2 <= 1
  const inDiamond = Math.abs(nx) / 0.38 + Math.abs(ny + 0.15) / 0.18 <= 1;
  const inCapBase =
    ny >= 0.05 &&
    ny <= 0.35 &&
    Math.abs(nx) <= 0.28 &&
    nx * nx + (ny - 0.05) * (ny - 0.05) <= 0.1;
  const inTassel = nx >= 0.36 && nx <= 0.4 && ny >= -0.15 && ny <= 0.25;
  const inSparkle =
    Math.abs(nx) < 0.08 &&
    Math.abs(ny - 0.02) < 0.08 &&
    (Math.abs(nx) < 0.02 || Math.abs(ny - 0.02) < 0.02);

  if (inDiamond || inCapBase || inSparkle) {
    return [255, 255, 255, 255];
  }
  if (inTassel) {
    return [124, 211, 204, 255];
  }

  return [rBg, gBg, bBg, 255];
}

mkdirSync("public", { recursive: true });

console.log("Generating PWA icons...");
writeFileSync(
  "public/apple-touch-icon.png",
  createPng(180, 180, (x, y, w, h) => renderBrandIcon(x, y, w, h, false)),
);
writeFileSync(
  "public/pwa-192x192.png",
  createPng(192, 192, (x, y, w, h) => renderBrandIcon(x, y, w, h, false)),
);
writeFileSync(
  "public/pwa-512x512.png",
  createPng(512, 512, (x, y, w, h) => renderBrandIcon(x, y, w, h, false)),
);
writeFileSync(
  "public/pwa-maskable-512x512.png",
  createPng(512, 512, (x, y, w, h) => renderBrandIcon(x, y, w, h, true)),
);
console.log("Generated PNG icons successfully!");
