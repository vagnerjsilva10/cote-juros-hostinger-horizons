const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeKey = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export class LiveDiscoveryResilienceService {
  static memoryCache = new Map();
  static circuit = {
    failures: 0,
    openedAt: null,
  };

  static async fetchWithResilience({
    key,
    fetcher,
    fallback,
    ttlMs = 30 * 60 * 1000,
    timeoutMs = 12000,
    retries = 1,
    circuitThreshold = 3,
    circuitCooldownMs = 10 * 60 * 1000,
  } = {}) {
    const cacheKey = normalizeKey(key);
    const cached = this.memoryCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.createdAt <= ttlMs) {
      return { ...cached.value, cache: 'hit', stale: false };
    }

    if (this.isCircuitOpen({ now, circuitThreshold, circuitCooldownMs })) {
      return {
        ...(cached?.value || fallback?.() || { ok: false, candidates: [] }),
        cache: cached ? 'stale' : 'miss',
        stale: Boolean(cached),
        circuitOpen: true,
      };
    }

    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const value = await this.withTimeout(fetcher(), timeoutMs);
        this.circuit.failures = 0;
        this.circuit.openedAt = null;
        this.memoryCache.set(cacheKey, { value, createdAt: now });
        return { ...value, cache: 'miss', stale: false, attempts: attempt + 1 };
      } catch (error) {
        lastError = error;
        this.circuit.failures += 1;
        if (this.circuit.failures >= circuitThreshold) this.circuit.openedAt = Date.now();
        if (attempt < retries) await sleep(250 * (attempt + 1));
      }
    }

    const fallbackValue = cached?.value || fallback?.() || { ok: false, candidates: [] };
    return {
      ...fallbackValue,
      cache: cached ? 'stale' : 'fallback',
      stale: Boolean(cached),
      error: lastError?.message || 'discovery timeout',
      circuitOpen: this.circuit.failures >= circuitThreshold,
    };
  }

  static withTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`discovery timeout after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  }

  static isCircuitOpen({ now = Date.now(), circuitThreshold = 3, circuitCooldownMs = 600000 } = {}) {
    if (this.circuit.failures < circuitThreshold || !this.circuit.openedAt) return false;
    if (now - this.circuit.openedAt > circuitCooldownMs) {
      this.circuit.failures = 0;
      this.circuit.openedAt = null;
      return false;
    }
    return true;
  }

  static deduplicateCandidates(candidates = []) {
    const seen = new Set();
    return candidates.filter((candidate) => {
      const key = normalizeKey(candidate.keyword || candidate.title || '');
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  static rankOffline(candidates = []) {
    const saturationFamilies = new Set(['credito_emprestimo', 'score', 'cartao', 'financiamento']);
    const freshnessSignals = /hoje|nova regra|mudanca|banco central|selic|inss|fgts|pix|golpe|fraude/i;
    return this.deduplicateCandidates(candidates)
      .map((candidate) => ({
        ...candidate,
        offlineRankScore:
          (candidate.type === 'consumer_alert' ? 18 : 0) +
          (candidate.type === 'news_analysis' ? 16 : 0) +
          (candidate.type === 'market_update' ? 18 : 0) +
          (candidate.type === 'regulatory_update' ? 20 : 0) +
          (candidate.type === 'content_refresh' ? 14 : 0) +
          (candidate.angle?.length > 45 ? 8 : 0) +
          (/golpe|fraude|pix|consumidor|superendividamento/i.test(`${candidate.cluster || ''} ${candidate.keyword || ''}`) ? 18 : 0) +
          (freshnessSignals.test(`${candidate.keyword || ''} ${candidate.title || ''} ${candidate.angle || ''}`) ? 12 : 0) +
          (/banco central|bacen|gov\.br|inss|fgts|procon|consumidor/i.test(`${candidate.angle || ''} ${candidate.source || ''}`) ? 10 : 0) -
          (saturationFamilies.has(candidate.cluster || candidate.family) ? 18 : 0) -
          (/emprestimo|credito|score|cartao|financiamento/i.test(candidate.keyword || '') ? 8 : 0),
      }))
      .sort((a, b) => b.offlineRankScore - a.offlineRankScore);
  }

  static getStatus() {
    return {
      cacheSize: this.memoryCache.size,
      circuitFailures: this.circuit.failures,
      circuitOpen: this.isCircuitOpen(),
      policy: {
        retries: 'bounded',
        fallback: 'stale cache or offline queue',
        cronSafety: 'external discovery cannot block editorial engine',
      },
    };
  }
}

export default LiveDiscoveryResilienceService;
