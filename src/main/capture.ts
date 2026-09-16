import { nativeImage, net, type WebContents, type Session } from 'electron';
import type { QuestionContext } from '../shared/types';

export function allowedImage(url: string, origin: string) {
  try { const u = new URL(url); return u.origin === origin || (u.protocol === 'https:' && (u.hostname.endsWith('.yuketang.cn') || u.hostname.endsWith('.xuetangx.com'))); } catch { return false; }
}
async function download(url: string, origin: string, session: Session, signal: AbortSignal, redirects = 0): Promise<string> {
  if (!allowedImage(url, origin) || redirects > 3) throw new Error('题图来源无法核实');
  const f = new URL(url).origin === origin ? session.fetch.bind(session) : net.fetch;
  const response = await f(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]), redirect: 'manual', credentials: new URL(url).origin === origin ? 'include' : 'omit' });
  if (response.status >= 300 && response.status < 400) return download(new URL(response.headers.get('location') ?? '', url).href, origin, session, signal, redirects + 1);
  if (!response.ok || !/^image\/(png|jpe?g|webp)/i.test(response.headers.get('content-type') ?? '')) throw new Error('原图不可用');
  if (Number(response.headers.get('content-length')) > 20000000) throw new Error('题图过大');
  const chunks: Uint8Array[] = []; let size = 0;
  for await (const chunk of response.body as any) { size += chunk.length; if (size > 20000000) throw new Error('题图过大'); chunks.push(chunk); }
  const image = nativeImage.createFromBuffer(Buffer.concat(chunks));
  const dimensions = image.getSize();
  if (image.isEmpty() || dimensions.width < 100 || dimensions.height < 60 || dimensions.width * dimensions.height > 40000000) throw new Error('题图尺寸无效');
  return image.toDataURL();
}

// 只定位带准确题目标识的可见节点，绝不退化为整个桌面或整个页面。
function locate(questionId: string) {
  const visible = (el: HTMLElement) => { const r = el.getBoundingClientRect(); return r.width > 100 && r.height > 50 && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none'; };
  const candidates = [...document.querySelectorAll<HTMLElement>('[data-problem-id],[data-question-id],.problem,.problem-box,.ppt-problem,.ppt-dialog, .problem-content')];
  const element = candidates.find(el => {
    const vue = (el as any).__vue__;
    const value = el.dataset.problemId ?? el.dataset.questionId ?? vue?.$props?.problem?.problemId ?? vue?.$props?.currentData?.problemId ?? vue?.problemId;
    return String(value) === questionId && visible(el);
  });
  if (!element) return null;
  element.scrollIntoView({ block: 'start' });
  const rect = element.getBoundingClientRect();
  // 非根节点的内嵌滚动可能遮住选项；无法证明完整时停止截图。
  for (const child of element.querySelectorAll<HTMLElement>('*')) {
    if (child.clientHeight > 10 && child.scrollHeight > child.clientHeight + 4 && /auto|scroll|hidden/.test(getComputedStyle(child).overflowY)) return null;
  }
  if (element.scrollWidth > element.clientWidth + 4) return null;
  if ([...element.querySelectorAll('img')].some(i => !i.complete || i.naturalWidth === 0)) return null;
  let parent = element.parentElement;
  while (parent && parent !== document.body) {
    const css = getComputedStyle(parent), p = parent.getBoundingClientRect();
    if (/hidden|auto|scroll/.test(css.overflowY) && (rect.bottom > p.bottom + 2 || rect.top < p.top - 2)) return null;
    parent = parent.parentElement;
  }
  return { x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height, total: Math.max(rect.height, element.scrollHeight), scrollable: element.scrollHeight > element.clientHeight + 4 };
}
export async function screenshotQuestion(contents: WebContents, q: QuestionContext, signal: AbortSignal): Promise<string[]> {
  signal.throwIfAborted();
  if (contents.isDestroyed()) throw new Error('官方课堂页面已关闭');
  const bounds = await contents.executeJavaScript(`(${locate.toString()})(${JSON.stringify(q.questionId)})`);
  if (!bounds || bounds.total > 18000 || bounds.width > 5000) throw new Error('无法定位完整题目区域，请在官方页面打开本题');
  // 内部滚动容器需用专门适配器；拒绝截到一半的题图。
  if (bounds.scrollable) throw new Error('本题使用内嵌滚动容器，无法确认截图完整，请使用原图或官方手动作答');
  const images: string[] = [];
  for (let offset = 0; offset < bounds.height; offset += 2400) {
    signal.throwIfAborted();
    const height = Math.min(2400, bounds.height - offset);
    const result = await contents.debugger.sendCommand('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: bounds.x, y: bounds.y + offset, width: bounds.width, height, scale: 1 } });
    if (!result.data) throw new Error('题目截图失败');
    images.push(`data:image/png;base64,${result.data}`);
  }
  return images;
}
export async function capture(q: QuestionContext, contents: WebContents | null, session: Session, origin: string, signal: AbortSignal) {
  try {
    if (!q.imageUrls.length || q.imageUrls.length > 6) throw new Error('需要页面截图');
    const images: string[] = [];
    for (const url of q.imageUrls) images.push(await download(url, origin, session, signal));
    signal.throwIfAborted();
    return { ...q, images, captureSource: 'original' as const };
  } catch {
    signal.throwIfAborted();
    if (!contents || new URL(contents.getURL()).origin !== origin) throw new Error('题图不可用，请打开已登录的官方课堂页面');
    const images = await screenshotQuestion(contents, q, signal);
    return { ...q, images, captureSource: 'screenshot' as const };
  }
}
