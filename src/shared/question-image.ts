// 仅忽略已实测的雨课堂 CDN 临时签名；路径和内容变换仍参与题图身份判断。
export function imageIdentity(value: string): string {
  const url = new URL(value);
  if (['rain-pri-ups.yuketang.cn', 'rain-pri-ups-ali.yuketang.cn'].includes(url.hostname)) url.searchParams.delete('auth_key');
  return url.href;
}
