import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { supabaseAdmin } from './db';

/**
 * V2.9.11 — Primary Observability Infrastructure
 * Feed Structured Telemetry Event Sink
 * Primary Sink: Supabase PostgreSQL (`feed_telemetry_events` or `logs`)
 * Secondary Sink: Append-Only local JSONL (for local development/debugging)
 */

export interface FeedTelemetryEvent {
    request_id: string;
    timestamp_utc: string;
    user_uuid: string;
    experiment_id: string;
    variant: 'CURRENT' | 'HYBRID_RECOMMENDED';
    total_latency_ms: number;
    q1_latency_ms: number;
    q2_latency_ms: number;
    q3_latency_ms: number;
    q4_latency_ms: number | null;
    q5_latency_ms: number | null;
    fallback_fired: boolean;
    status_code: number;
    timeout: boolean;
    // Context / Diagnostics
    db_total_latency_ms?: number;
    candidates_count?: number;
}

export const EXPERIMENT_ID = 'exp_v2_9_11_hybrid';
export const DEFAULT_TELEMETRY_PATH = path.resolve(process.cwd(), '../telemetry/feed_events.jsonl');

/**
 * Deterministic A/B Assignment:
 * SHA256(experiment_id + immutable_stable_user_id)
 * 75% HYBRID_RECOMMENDED / 25% CURRENT
 */
export function assignVariant(
    experimentId: string,
    immutableUserId: string,
    hybridRatio: number = 0.75
): 'CURRENT' | 'HYBRID_RECOMMENDED' {
    const hash = crypto.createHash('sha256').update(experimentId + immutableUserId).digest('hex');
    const bucket = parseInt(hash.substring(0, 8), 16) % 10000; // 0..9999 for high precision
    const threshold = Math.round(hybridRatio * 10000);
    return bucket < threshold ? 'HYBRID_RECOMMENDED' : 'CURRENT';
}

/**
 * Structured event logger with Supabase PostgreSQL Primary Persistence
 */
class FeedTelemetrySink {
    private filePath: string;
    private writeQueue: string[] = [];
    private isFlushing: boolean = false;

    constructor(customPath?: string) {
        this.filePath = customPath || (
            fs.existsSync(path.resolve(__dirname, '../../../../telemetry'))
                ? path.resolve(__dirname, '../../../../telemetry/feed_events.jsonl')
                : path.resolve(process.cwd(), 'telemetry/feed_events.jsonl')
        );

        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            try {
                fs.mkdirSync(dir, { recursive: true });
            } catch (e) {}
        }
    }

    public setPath(newPath: string): void {
        this.filePath = newPath;
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            try {
                fs.mkdirSync(dir, { recursive: true });
            } catch (e) {}
        }
    }

    public getPath(): string {
        return this.filePath;
    }

    /**
     * Primary Persistent Record to Supabase (Production Serverless Sink)
     * Meets serverless requirements: awaits write with safe timeout to prevent suspension loss
     */
    public async recordEventAsync(event: FeedTelemetryEvent): Promise<void> {
        // Also queue to local disk sink for local debugging
        this.recordEvent(event);

        if (!supabaseAdmin) {
            console.warn('[FeedTelemetry] supabaseAdmin client not available for persistent sink');
            return;
        }

        const timeoutMs = 1200;
        const writePromise = (async () => {
            try {
                // 1. Attempt dedicated feed_telemetry_events table
                const { error: dedicatedErr } = await supabaseAdmin
                    .from('feed_telemetry_events')
                    .insert({
                        request_id: event.request_id,
                        timestamp_utc: event.timestamp_utc,
                        user_uuid: event.user_uuid,
                        experiment_id: event.experiment_id,
                        variant: event.variant,
                        total_latency_ms: event.total_latency_ms,
                        q1_latency_ms: event.q1_latency_ms,
                        q2_latency_ms: event.q2_latency_ms,
                        q3_latency_ms: event.q3_latency_ms,
                        q4_latency_ms: event.q4_latency_ms,
                        q5_latency_ms: event.q5_latency_ms,
                        fallback_fired: event.fallback_fired,
                        status_code: event.status_code,
                        timeout: event.timeout,
                        db_total_latency_ms: event.db_total_latency_ms ?? null,
                        candidates_count: event.candidates_count ?? null
                    });

                if (!dedicatedErr) {
                    return; // Successfully persisted in dedicated table
                }

                // 2. If table is not found in schema cache (PGRST205), persist in logs table
                if (dedicatedErr.code === 'PGRST205' || dedicatedErr.message?.includes('schema cache')) {
                    const { error: logsErr } = await supabaseAdmin
                        .from('logs')
                        .insert({
                            id: event.request_id,
                            employee_name: event.variant,
                            action: 'FEED_TELEMETRY',
                            details: JSON.stringify(event),
                            timestamp: event.timestamp_utc
                        });

                    if (logsErr) {
                        console.error('[FeedTelemetry] Error persisting to logs fallback sink:', logsErr);
                    }
                } else {
                    console.error('[FeedTelemetry] Error persisting to feed_telemetry_events:', dedicatedErr);
                }
            } catch (err) {
                console.error('[FeedTelemetry] Exception persisting event to Supabase:', err);
            }
        })();

        // Prevent hanging the serverless lambda if Supabase encounters extreme latency
        const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
        await Promise.race([writePromise, timeoutPromise]);
    }

    /**
     * Read events from Supabase Persistent Sink
     */
    public async readEventsFromSupabaseAsync(filter?: {
        startUtc?: string;
        endUtc?: string;
        limit?: number;
    }): Promise<FeedTelemetryEvent[]> {
        if (!supabaseAdmin) return [];

        const limit = filter?.limit || 10000;

        // 1. Try dedicated table first
        let query = supabaseAdmin
            .from('feed_telemetry_events')
            .select('*')
            .order('timestamp_utc', { ascending: true })
            .limit(limit);

        if (filter?.startUtc) query = query.gte('timestamp_utc', filter.startUtc);
        if (filter?.endUtc) query = query.lte('timestamp_utc', filter.endUtc);

        const { data: dedicatedData, error: dedicatedErr } = await query;
        if (!dedicatedErr && dedicatedData && dedicatedData.length > 0) {
            return dedicatedData.map((row: any) => ({
                request_id: row.request_id,
                timestamp_utc: row.timestamp_utc,
                user_uuid: row.user_uuid,
                experiment_id: row.experiment_id,
                variant: row.variant,
                total_latency_ms: row.total_latency_ms,
                q1_latency_ms: row.q1_latency_ms,
                q2_latency_ms: row.q2_latency_ms,
                q3_latency_ms: row.q3_latency_ms,
                q4_latency_ms: row.q4_latency_ms,
                q5_latency_ms: row.q5_latency_ms,
                fallback_fired: row.fallback_fired,
                status_code: row.status_code,
                timeout: row.timeout,
                db_total_latency_ms: row.db_total_latency_ms,
                candidates_count: row.candidates_count
            }));
        }

        // 2. Query logs table
        let logsQuery = supabaseAdmin
            .from('logs')
            .select('*')
            .eq('action', 'FEED_TELEMETRY')
            .order('timestamp', { ascending: true })
            .limit(limit);

        if (filter?.startUtc) logsQuery = logsQuery.gte('timestamp', filter.startUtc);
        if (filter?.endUtc) logsQuery = logsQuery.lte('timestamp', filter.endUtc);

        const { data: logsData, error: logsErr } = await logsQuery;
        if (logsErr || !logsData) {
            console.error('[FeedTelemetry] Error reading from logs:', logsErr);
            return [];
        }

        const events: FeedTelemetryEvent[] = [];
        for (const row of logsData) {
            try {
                const ev: FeedTelemetryEvent = JSON.parse(row.details);
                events.push(ev);
            } catch (e) {
                console.warn('[FeedTelemetry] Corrupted log details skipped:', row.id);
            }
        }
        return events;
    }

    /**
     * Non-blocking append of event (Secondary local file sink)
     */
    public recordEvent(event: FeedTelemetryEvent): void {
        try {
            const line = JSON.stringify(event) + '\n';
            this.writeQueue.push(line);
            this.flush();
        } catch (err) {
            console.error('[FeedTelemetry] Error queuing event:', err);
        }
    }

    /**
     * Synchronous record for deterministic batch processing / testing
     */
    public recordEventSync(event: FeedTelemetryEvent): void {
        try {
            const line = JSON.stringify(event) + '\n';
            fs.appendFileSync(this.filePath, line, 'utf8');
        } catch (err) {
            console.error('[FeedTelemetry] Error writing event sync:', err);
        }
    }

    private flush(): void {
        if (this.isFlushing || this.writeQueue.length === 0) return;
        this.isFlushing = true;

        const linesToWrite = this.writeQueue.splice(0, this.writeQueue.length).join('');
        fs.appendFile(this.filePath, linesToWrite, 'utf8', (err) => {
            this.isFlushing = false;
            if (err) {
                console.error('[FeedTelemetry] Error writing to telemetry sink:', err);
            }
            if (this.writeQueue.length > 0) {
                this.flush();
            }
        });
    }

    /**
     * Read and parse stored events from local file
     */
    public readEvents(targetPath?: string, filter?: { startUtc?: string; endUtc?: string }): FeedTelemetryEvent[] {
        const file = targetPath || this.filePath;
        if (!fs.existsSync(file)) return [];

        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        const events: FeedTelemetryEvent[] = [];

        for (const line of lines) {
            try {
                const ev: FeedTelemetryEvent = JSON.parse(line);
                if (filter?.startUtc && ev.timestamp_utc < filter.startUtc) continue;
                if (filter?.endUtc && ev.timestamp_utc > filter.endUtc) continue;
                events.push(ev);
            } catch (e) {
                console.warn('[FeedTelemetry] Corrupted line skipped:', line);
            }
        }
        return events;
    }
}

export const feedTelemetry = new FeedTelemetrySink();

/**
 * Metric analysis helper for Primary Telemetry
 * CORRECTED: (sorted[upper] - sorted[lower]) instead of (sorted[upper] - lower)
 */
export function calculatePercentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (index - lower) * (sorted[upper] - sorted[lower]);
}

/**
 * Automated validation enforcing p50 <= p95 <= p99
 * Fails immediately if percentiles are incoherent
 */
export function validatePercentileOrdering(p50: number, p95: number, p99: number, label: string = 'feed'): void {
    if (p50 > p95 || p95 > p99) {
        throw new Error(`[Percentile Validation Error] Incoherent ordering for ${label}: p50 (${p50}) <= p95 (${p95}) <= p99 (${p99}) violated!`);
    }
}

export interface MetricSummary {
    total_events: number;
    current_events: number;
    hybrid_events: number;
    current_ratio_pct: number;
    hybrid_ratio_pct: number;
    feed_latency: {
        all: { p50: number; p95: number; p99: number; max: number };
        current: { p50: number; p95: number; p99: number; max: number };
        hybrid: { p50: number; p95: number; p99: number; max: number };
        delta_p99_pct: number;
    };
    db_latency: {
        p50: number;
        p95: number;
        p99: number;
    };
    queries: {
        q1_p95: number;
        q2_p95: number;
        q3_p95: number;
        q4_p95: number | null;
        q5_p95: number | null;
    };
    fallback: {
        count: number;
        rate_pct: number;
    };
    errors: {
        count_5xx: number;
        rate_5xx_pct: number;
        count_timeout: number;
        rate_timeout_pct: number;
        current_5xx_pct: number;
        hybrid_5xx_pct: number;
        delta_5xx_pp: number;
        current_timeout_pct: number;
        hybrid_timeout_pct: number;
        delta_timeout_pp: number;
    };
    guardrails: {
        feed_p95_passed: boolean;
        dynamic_p99_passed: boolean;
        error_5xx_passed: boolean;
        timeout_passed: boolean;
    };
}

export function summarizeTelemetryEvents(events: FeedTelemetryEvent[]): MetricSummary {
    const total = events.length;
    const current = events.filter(e => e.variant === 'CURRENT');
    const hybrid = events.filter(e => e.variant === 'HYBRID_RECOMMENDED');

    const totalLatencies = events.map(e => e.total_latency_ms);
    const currentLatencies = current.map(e => e.total_latency_ms);
    const hybridLatencies = hybrid.map(e => e.total_latency_ms);

    const dbLatencies = events.map(e => e.db_total_latency_ms || 0).filter(v => v > 0);
    const q1Latencies = events.map(e => e.q1_latency_ms).filter(v => v > 0);
    const q2Latencies = events.map(e => e.q2_latency_ms).filter(v => v > 0);
    const q3Latencies = events.map(e => e.q3_latency_ms).filter(v => v > 0);
    const q4Latencies = events.map(e => e.q4_latency_ms).filter((v): v is number => v !== null && v > 0);
    const q5Latencies = events.map(e => e.q5_latency_ms).filter((v): v is number => v !== null && v > 0);

    const allP50 = Number(calculatePercentile(totalLatencies, 50).toFixed(1));
    const allP95 = Number(calculatePercentile(totalLatencies, 95).toFixed(1));
    const allP99 = Number(calculatePercentile(totalLatencies, 99).toFixed(1));
    if (totalLatencies.length > 0) {
        validatePercentileOrdering(allP50, allP95, allP99, 'all_feed_latency');
    }

    const currentP50 = Number(calculatePercentile(currentLatencies, 50).toFixed(1));
    const currentP95 = Number(calculatePercentile(currentLatencies, 95).toFixed(1));
    const currentP99 = Number(calculatePercentile(currentLatencies, 99).toFixed(1));
    if (currentLatencies.length > 0) {
        validatePercentileOrdering(currentP50, currentP95, currentP99, 'current_feed_latency');
    }

    const hybridP50 = Number(calculatePercentile(hybridLatencies, 50).toFixed(1));
    const hybridP95 = Number(calculatePercentile(hybridLatencies, 95).toFixed(1));
    const hybridP99 = Number(calculatePercentile(hybridLatencies, 99).toFixed(1));
    if (hybridLatencies.length > 0) {
        validatePercentileOrdering(hybridP50, hybridP95, hybridP99, 'hybrid_feed_latency');
    }

    const deltaP99Pct = currentP99 > 0 ? ((hybridP99 - currentP99) / currentP99) * 100 : 0;

    const count5xx = events.filter(e => e.status_code >= 500).length;
    const current5xx = current.filter(e => e.status_code >= 500).length;
    const hybrid5xx = hybrid.filter(e => e.status_code >= 500).length;

    const countTimeout = events.filter(e => e.timeout).length;
    const currentTimeout = current.filter(e => e.timeout).length;
    const hybridTimeout = hybrid.filter(e => e.timeout).length;

    const current5xxPct = current.length > 0 ? (current5xx / current.length) * 100 : 0;
    const hybrid5xxPct = hybrid.length > 0 ? (hybrid5xx / hybrid.length) * 100 : 0;
    const delta5xxPp = hybrid5xxPct - current5xxPct;

    const currentTimeoutPct = current.length > 0 ? (currentTimeout / current.length) * 100 : 0;
    const hybridTimeoutPct = hybrid.length > 0 ? (hybridTimeout / hybrid.length) * 100 : 0;
    const deltaTimeoutPp = hybridTimeoutPct - currentTimeoutPct;

    const fallbackCount = events.filter(e => e.fallback_fired).length;
    const fallbackRate = total > 0 ? (fallbackCount / total) * 100 : 0;

    return {
        total_events: total,
        current_events: current.length,
        hybrid_events: hybrid.length,
        current_ratio_pct: total > 0 ? (current.length / total) * 100 : 0,
        hybrid_ratio_pct: total > 0 ? (hybrid.length / total) * 100 : 0,
        feed_latency: {
            all: {
                p50: allP50,
                p95: allP95,
                p99: allP99,
                max: Math.max(0, ...totalLatencies)
            },
            current: {
                p50: currentP50,
                p95: currentP95,
                p99: currentP99,
                max: Math.max(0, ...currentLatencies)
            },
            hybrid: {
                p50: hybridP50,
                p95: hybridP95,
                p99: hybridP99,
                max: Math.max(0, ...hybridLatencies)
            },
            delta_p99_pct: Number(deltaP99Pct.toFixed(2))
        },
        db_latency: {
            p50: Number(calculatePercentile(dbLatencies, 50).toFixed(1)),
            p95: Number(calculatePercentile(dbLatencies, 95).toFixed(1)),
            p99: Number(calculatePercentile(dbLatencies, 99).toFixed(1))
        },
        queries: {
            q1_p95: Number(calculatePercentile(q1Latencies, 95).toFixed(1)),
            q2_p95: Number(calculatePercentile(q2Latencies, 95).toFixed(1)),
            q3_p95: Number(calculatePercentile(q3Latencies, 95).toFixed(1)),
            q4_p95: q4Latencies.length > 0 ? Number(calculatePercentile(q4Latencies, 95).toFixed(1)) : null,
            q5_p95: q5Latencies.length > 0 ? Number(calculatePercentile(q5Latencies, 95).toFixed(1)) : null
        },
        fallback: {
            count: fallbackCount,
            rate_pct: Number(fallbackRate.toFixed(4))
        },
        errors: {
            count_5xx: count5xx,
            rate_5xx_pct: total > 0 ? Number(((count5xx / total) * 100).toFixed(3)) : 0,
            count_timeout: countTimeout,
            rate_timeout_pct: total > 0 ? Number(((countTimeout / total) * 100).toFixed(3)) : 0,
            current_5xx_pct: Number(current5xxPct.toFixed(3)),
            hybrid_5xx_pct: Number(hybrid5xxPct.toFixed(3)),
            delta_5xx_pp: Number(delta5xxPp.toFixed(3)),
            current_timeout_pct: Number(currentTimeoutPct.toFixed(3)),
            hybrid_timeout_pct: Number(hybridTimeoutPct.toFixed(3)),
            delta_timeout_pp: Number(deltaTimeoutPp.toFixed(3))
        },
        guardrails: {
            feed_p95_passed: hybridP95 < 250.0,
            dynamic_p99_passed: currentP99 === 0 || hybridP99 <= currentP99 * 1.30,
            error_5xx_passed: delta5xxPp <= 0.10,
            timeout_passed: deltaTimeoutPp <= 0.50
        }
    };
}
