export type SpeedResult = { ok: boolean; latencyMs: number; engine?: string; error: string }

export const ALL_GROUP = '__all__'
export const DIRECT_PROXY_ID = '__direct__'
export const SPEED_RESULT_EVENT = 'proxy:speed:result'
export const BATCH_TEST_CONCURRENCY = 20
