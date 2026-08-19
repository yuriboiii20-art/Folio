/**
 * FOLIO RAG Document Index
 * ---------------------------------------------------------------------------
 * A lightweight, fully client-side retrieval index for the AI Studio.
 *
 * Every uploaded document is chunked and converted into a sparse TF vector
 * ("embedding"). The store powers four product surfaces:
 *
 *   1. AI Studio retrieval  -> grounding chat answers in the student notes
 *   2. Storage alerts       -> RAG index utilisation vs. its capacity
 *   3. Weak Spot Analysis   -> low-engagement subjects + confusing query topics
 *   4. Delete/Trash flows   -> embeddings are purged with their documents
 *
 * Persisted to localStorage so the index survives reloads without a backend.
 */

const STORAGE_KEY = 'folio.rag.index.v1';
const QUERY_LOG_KEY = 'folio.rag.queries.v1';

/** Capacity of the document index in raw indexed characters (~8 MB of text). */
export const RAG_INDEX_CAPACITY_BYTES = 8 * 1024 * 1024;

/** Total workspace disk quota for uploaded documents (250 MB). */
export const DISK_QUOTA_BYTES = 250 * 1024 * 1024;

/** Usage ratio at which FOLIO raises the storage threshold alert. */
export const STORAGE_ALERT_THRESHOLD = 0.85;

/** Similarity below which a retrieval is treated as "confused". */
const CONFUSION_THRESHOLD = 0.18;

const CHUNK_SIZE = 700;

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'do', 'does', 'for', 'from',
  'had', 'has', 'have', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'me', 'my', 'no',
  'not', 'of', 'on', 'or', 'so', 'that', 'the', 'their', 'them', 'then', 'there', 'these',
  'they', 'this', 'to', 'was', 'were', 'what', 'when', 'where', 'which', 'who', 'why', 'will',
  'with', 'you', 'your', 'about', 'explain', 'tell', 'give', 'please', 'help', 'us', 'we'
]);

export interface RagChunk {
  id: string;
  fileId: string;
  folderId: string;
  fileTitle: string;
  text: string;
  vector: Record<string, number>;
  bytes: number;
}

export interface RagQueryEntry {
  id: string;
  query: string;
  topic: string;
  score: number;
  confused: boolean;
  folderId?: string;
  ts: number;
}

export interface RagMatch {
  chunk: RagChunk;
  score: number;
}

export interface RagIndexStats {
  chunkCount: number;
  documentCount: number;
  indexedBytes: number;
  capacityBytes: number;
  usageRatio: number;
  usagePercent: number;
}

export interface ConfusionTopic {
  topic: string;
  queries: number;
  confusedQueries: number;
  confusionRate: number;
  avgScore: number;
  lastAsked: number;
  samples: string[];
}

// ---------------------------------------------------------------------------
// Tokenisation & vectors
// ---------------------------------------------------------------------------

export const tokenize = (text: string): string[] =>
  (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));

const buildVector = (text: string): Record<string, number> => {
  const tokens = tokenize(text);
  const counts: Record<string, number> = {};
  tokens.forEach(t => { counts[t] = (counts[t] || 0) + 1; });

  // L2 normalise so cosine similarity is a plain dot product.
  const magnitude = Math.sqrt(Object.values(counts).reduce((sum, c) => sum + c * c, 0)) || 1;
  Object.keys(counts).forEach(k => { counts[k] = counts[k] / magnitude; });
  return counts;
};

const cosine = (a: Record<string, number>, b: Record<string, number>): number => {
  const small = Object.keys(a).length < Object.keys(b).length ? a : b;
  const large = small === a ? b : a;
  let dot = 0;
  for (const key in small) {
    if (large[key]) dot += small[key] * large[key];
  }
  return dot;
};

const chunkText = (text: string): string[] => {
  const clean = (text || '').trim();
  if (!clean) return [];
  if (clean.length <= CHUNK_SIZE) return [clean];

  const chunks: string[] = [];
  const sentences = clean.split(/(?:(?<=[.!?])|(?<=\n))\s+/);
  let buffer = '';

  sentences.forEach(sentence => {
    if ((buffer + sentence).length > CHUNK_SIZE && buffer) {
      chunks.push(buffer.trim());
      buffer = '';
    }
    buffer += sentence + ' ';
  });

  if (buffer.trim()) chunks.push(buffer.trim());
  return chunks;
};

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const readStore = <T>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
};

const writeStore = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('RAG index persistence unavailable:', e);
  }
};

let chunkStore: RagChunk[] = readStore<RagChunk>(STORAGE_KEY);
let queryLog: RagQueryEntry[] = readStore<RagQueryEntry>(QUERY_LOG_KEY);

const persistChunks = () => writeStore(STORAGE_KEY, chunkStore);
const persistQueries = () => writeStore(QUERY_LOG_KEY, queryLog.slice(-400));

// ---------------------------------------------------------------------------
// Index mutations
// ---------------------------------------------------------------------------

/** Index (or re-index) one document. Existing chunks for the file are replaced. */
export const indexDocument = (
  fileId: string,
  folderId: string,
  fileTitle: string,
  content: string
): number => {
  removeDocument(fileId, false);

  const body = `${fileTitle}\n${content || ''}`;
  const pieces = chunkText(body);

  pieces.forEach((piece, idx) => {
    chunkStore.push({
      id: `${fileId}::${idx}`,
      fileId,
      folderId,
      fileTitle,
      text: piece,
      vector: buildVector(piece),
      bytes: piece.length
    });
  });

  persistChunks();
  return pieces.length;
};

/** Purge every embedding belonging to a document. */
export const removeDocument = (fileId: string, persist = true): number => {
  const before = chunkStore.length;
  chunkStore = chunkStore.filter(c => c.fileId !== fileId);
  if (persist) persistChunks();
  return before - chunkStore.length;
};

/** Purge every embedding belonging to a folder (used by folder soft-delete). */
export const removeFolder = (folderId: string): number => {
  const before = chunkStore.length;
  chunkStore = chunkStore.filter(c => c.folderId !== folderId);
  persistChunks();
  return before - chunkStore.length;
};

/** Move embeddings when a document is re-filed into another folder. */
export const reassignDocumentFolder = (fileId: string, folderId: string) => {
  let touched = false;
  chunkStore = chunkStore.map(c => {
    if (c.fileId === fileId) {
      touched = true;
      return { ...c, folderId };
    }
    return c;
  });
  if (touched) persistChunks();
};

/** Drop everything the index knows (used when the workspace is reset). */
export const clearIndex = () => {
  chunkStore = [];
  persistChunks();
};

// ---------------------------------------------------------------------------
// Retrieval
// ---------------------------------------------------------------------------

export const search = (query: string, topK = 4): RagMatch[] => {
  const qVec = buildVector(query);
  if (!Object.keys(qVec).length || !chunkStore.length) return [];

  return chunkStore
    .map(chunk => ({ chunk, score: cosine(qVec, chunk.vector) }))
    .filter(m => m.score > 0.02)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
};

/** Derive a short human-readable topic label from a query. */
export const extractTopic = (query: string): string => {
  const tokens = tokenize(query);
  if (!tokens.length) return 'General';

  const counts: Record<string, number> = {};
  tokens.forEach(t => { counts[t] = (counts[t] || 0) + 1; });

  const ranked = Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, 2)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

  return ranked.join(' ') || 'General';
};

/** Record a retrieval outcome so Weak Spot Analysis can learn from it. */
export const logQuery = (query: string, score: number, folderId?: string): RagQueryEntry => {
  const entry: RagQueryEntry = {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    query: query.trim(),
    topic: extractTopic(query),
    score: Number(score.toFixed(4)),
    confused: score < CONFUSION_THRESHOLD,
    folderId,
    ts: Date.now()
  };

  queryLog = [...queryLog, entry].slice(-400);
  persistQueries();
  return entry;
};

export const getQueryLog = (): RagQueryEntry[] => [...queryLog];

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export const getIndexStats = (): RagIndexStats => {
  const indexedBytes = chunkStore.reduce((sum, c) => sum + c.bytes, 0);
  const documentCount = new Set(chunkStore.map(c => c.fileId)).size;
  const usageRatio = Math.min(1, indexedBytes / RAG_INDEX_CAPACITY_BYTES);

  return {
    chunkCount: chunkStore.length,
    documentCount,
    indexedBytes,
    capacityBytes: RAG_INDEX_CAPACITY_BYTES,
    usageRatio,
    usagePercent: usageRatio * 100
  };
};

/** How many queries resolved into each folder — the engagement signal. */
export const getFolderQueryCounts = (): Record<string, number> => {
  const counts: Record<string, number> = {};
  queryLog.forEach(q => {
    if (q.folderId) counts[q.folderId] = (counts[q.folderId] || 0) + 1;
  });
  return counts;
};

/** Topics the assistant repeatedly struggled to answer from the student notes. */
export const getConfusionTopics = (minQueries = 2): ConfusionTopic[] => {
  const grouped: Record<string, RagQueryEntry[]> = {};
  queryLog.forEach(q => {
    const key = q.topic || 'General';
    (grouped[key] = grouped[key] || []).push(q);
  });

  return Object.entries(grouped)
    .map(([topic, entries]) => {
      const confusedQueries = entries.filter(e => e.confused).length;
      return {
        topic,
        queries: entries.length,
        confusedQueries,
        confusionRate: confusedQueries / entries.length,
        avgScore: entries.reduce((s, e) => s + e.score, 0) / entries.length,
        lastAsked: Math.max(...entries.map(e => e.ts)),
        samples: entries.slice(-3).map(e => e.query)
      };
    })
    .filter(t => t.confusedQueries > 0 && t.queries >= minQueries)
    .sort((a, b) => b.confusedQueries - a.confusedQueries || b.confusionRate - a.confusionRate);
};

export const formatBytes = (bytes: number): string => {
  if (!bytes || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};
