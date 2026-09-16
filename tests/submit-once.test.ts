import { it, expect } from 'vitest';
import http from 'node:http';
import { submitOnce } from '../src/main/submit-once';
it('never transparently repeats a received POST after connection reset', async () => {
  let attempts = 0;
  const server = http.createServer(async (req) => { for await (const _chunk of req) {} attempts++; req.socket.destroy(); });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address() as { port: number };
    await expect(submitOnce(`http://127.0.0.1:${address.port}/answer`, {}, { result: ['A'] })).rejects.toThrow();
    expect(attempts).toBe(1);
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
