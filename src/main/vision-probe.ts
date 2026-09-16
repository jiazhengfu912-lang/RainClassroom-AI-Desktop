import { deflateSync } from 'node:zlib';
import { randomInt } from 'node:crypto';
import type { QuestionContext } from '../shared/types';
function crc(b: Buffer) { let c = 0xffffffff; for (const byte of b) { c ^= byte; for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0); } return (c ^ 0xffffffff) >>> 0; }
function chunk(type: string, value: Buffer) { const tag = Buffer.from(type); const length = Buffer.alloc(4); length.writeUInt32BE(value.length); const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc(Buffer.concat([tag, value]))); return Buffer.concat([length, tag, value, checksum]); }
export function visionProbe(): { question: QuestionContext; expected: string[] } {
  const palette = [{ name: '红', rgb: [225, 30, 40] }, { name: '绿', rgb: [20, 170, 65] }, { name: '蓝', rgb: [35, 75, 220] }];
  const choices = Array.from({ length: 4 }, () => randomInt(3));
  const width = 320, height = 100, raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) { const start = y * (1 + width * 3) + 1 + x * 3; raw.set(palette[choices[Math.floor(x / 80)]].rgb, start); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
  return { expected: choices.map(i => palette[i].name), question: { accountId: '1', lessonId: '1', questionId: '1', presentationId: '1', kind: 'blank', platformType: 4, stem: '图片包含四个等宽的色块，从左到右填写各色块颜色。每空仅使用红、绿、蓝之一。', options: [], blankCount: 4, images: [`data:image/png;base64,${png.toString('base64')}`], imageUrls: [], revision: 'probe', open: true, answered: false, deadline: null } };
}
