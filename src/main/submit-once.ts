import http from 'node:http';
import https from 'node:https';
// Chromium 网络栈可能透明重试连接重置的请求。提交使用单次原生请求，
// 不使用连接池、不跟随重定向，也不在错误后重试。
export function submitOnce(url: string, headers: Record<string, string>, body: unknown): Promise<string> {
  const target = new URL(url), serialized = JSON.stringify(body);
  const transport = target.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = transport.request(target, { method: 'POST', agent: false, headers: { ...headers, 'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(serialized)) } }, res => {
      const buffers: Buffer[] = []; let length = 0;
      res.on('data', b => { length += b.length; if (length > 2000000) { res.destroy(new Error('response too large')); return; } buffers.push(b); });
      res.on('error', reject);
      res.on('end', () => { if (res.statusCode !== 200) reject(new Error('submission not confirmed')); else resolve(Buffer.concat(buffers).toString('utf8')); });
    });
    const timer = setTimeout(() => req.destroy(new Error('submission timeout')), 12000);
    req.on('close', () => clearTimeout(timer)); req.on('error', reject);
    req.end(serialized);
  });
}
