import type { AnswerProposal, QuestionContext, SubmissionReceipt, TaskRecord, TaskStatus } from '../shared/types';
import { questionKey, parseAnswer, SubmissionNotSentError } from './protocol';

export interface EnginePorts {
  ledger: { blocks(key: string): boolean; put(record: TaskRecord): void };
  capture(q: QuestionContext, signal: AbortSignal): Promise<QuestionContext>;
  solve(q: QuestionContext, signal: AbortSignal): Promise<AnswerProposal>;
  fresh(q: QuestionContext): Promise<QuestionContext>;
  submit(q: QuestionContext, a: AnswerProposal, signal: AbortSignal): Promise<SubmissionReceipt>;
  changed(q: QuestionContext, a: AnswerProposal | null, record: TaskRecord): void;
  error(message: string): void;
}
export class AnswerEngine {
  private mode: 'stopped' | 'preview' | 'auto' | 'paused' = 'stopped';
  private queue: QuestionContext[] = [];
  private seen = new Set<string>();
  private current?: { q: QuestionContext; controller: AbortController; submitting: boolean };
  private processing = false;
  constructor(private ports: EnginePorts, private now = Date.now) {}
  start(mode: 'preview' | 'auto') { this.mode = mode; this.seen.clear(); }
  pause() { this.mode = 'paused'; this.cancel(); }
  stop() { this.mode = 'stopped'; this.cancel(); }
  private cancel() { this.queue = []; this.current?.controller.abort(); }
  invalidate(questionId: string) { this.queue = this.queue.filter(q => q.questionId !== questionId); if (this.current?.q.questionId === questionId) this.current.controller.abort(); }
  offer(q: QuestionContext) {
    const key = `${questionKey(q)}:${q.revision}`;
    if (!['preview', 'auto'].includes(this.mode) || this.seen.has(key) || this.ports.ledger.blocks(questionKey(q)) || !this.viable(q)) return;
    this.seen.add(key); this.queue.push(q); void this.pump();
  }
  private viable(q: QuestionContext) { return q.open && !q.answered && (q.deadline === null || q.deadline - this.now() > 3000); }
  private record(q: QuestionContext, status: TaskStatus, message: string, a: AnswerProposal | null = null) {
    const record: TaskRecord = { key: questionKey(q), questionId: q.questionId, lessonId: q.lessonId, kind: q.kind, status, message, updatedAt: this.now(), ...(a ? { answers: a.answers } : {}) };
    this.ports.ledger.put(record); this.ports.changed(q, a, record);
  }
  private async pump() {
    if (this.processing) return;
    this.processing = true;
    try {
      while (this.queue.length && ['preview', 'auto'].includes(this.mode)) {
        let q = this.queue.shift()!;
        const controller = new AbortController();
        this.current = { q, controller, submitting: false };
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          if (!this.viable(q) || this.ports.ledger.blocks(questionKey(q))) continue;
          const timeout = q.deadline === null ? 45000 : Math.min(45000, q.deadline - this.now() - 3000);
          timer = setTimeout(() => controller.abort(), timeout);
          this.record(q, 'CAPTURING', '正在获取题目图片');
          q = await this.ports.capture(q, controller.signal);
          controller.signal.throwIfAborted();
          this.record(q, 'SOLVING', '正在分析题图');
          const answer = parseAnswer(JSON.stringify(await this.ports.solve(q, controller.signal)), q);
          controller.signal.throwIfAborted();
          const fresh = await this.ports.fresh(q);
          controller.signal.throwIfAborted();
          if (!this.viable(fresh) || fresh.revision !== q.revision) throw new Error('题目已变化、已作答或已截止');
          if (this.mode === 'preview') { this.record(q, 'PREVIEW', '仅预览，尚未提交', answer); continue; }
          if (this.mode !== 'auto' || this.ports.ledger.blocks(questionKey(q))) throw new Error('已暂停或记录阻止重复提交');
          // 同一同步段内：再次检查截止 -> 记录落盘 -> 标记在途 -> 派发请求。
          q = { ...q, deadline: fresh.deadline };
          if (!this.viable(q)) throw new Error('题目已截止');
          this.record(q, 'SUBMITTING', '正在提交，等待平台回执', answer);
          this.current.submitting = true;
          if (timer) clearTimeout(timer);
          let result: SubmissionReceipt;
          try { result = await this.ports.submit(q, answer, controller.signal); }
          catch (e) {
            if (e instanceof SubmissionNotSentError) { this.record(q, 'SKIPPED', e.message, answer); continue; }
            result = { status: 'UNKNOWN', message: '提交后未收到确定回执，请核对官方记录；不会自动重发' };
          }
          this.record(q, result.status, result.message, answer);
        } catch (e) {
          if (this.current.submitting) { this.mode = 'paused'; this.queue = []; this.ports.error('提交记录保存失败，已暂停；请核对官方记录'); }
          else {
            try { this.record(q, 'SKIPPED', controller.signal.aborted ? '已暂停、收题或超时，本题未提交' : (e instanceof Error ? e.message : '处理失败')); }
            catch { this.mode = 'paused'; this.queue = []; this.ports.error('无法保存本地记录，已暂停'); }
          }
        } finally { if (timer) clearTimeout(timer); this.current = undefined; }
      }
    } finally { this.processing = false; }
  }
  isBusy() { return this.processing; }
}
