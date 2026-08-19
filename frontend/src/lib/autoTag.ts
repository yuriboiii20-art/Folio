/**
 * FOLIO AI auto-tagging
 * ---------------------------------------------------------------------------
 * When "Auto-tag & route uploads" is enabled in Settings, every uploaded
 * document is analysed before it lands: the model reads the filename and the
 * extracted text, picks the best-matching subject folder, and proposes topic
 * tags. If the AI is unavailable the same job is done by a keyword-overlap
 * heuristic, so uploads are never blocked on the network.
 */

import { tokenize } from './ragIndex';

export interface FolderOption {
  id: string;
  name: string;
  code?: string;
  description?: string;
}

export interface AutoTagResult {
  folderId: string;
  folderName: string;
  tags: string[];
  summary: string;
  confidence: number;
  method: 'ai' | 'heuristic';
  /** True when the document was moved out of the folder the student picked. */
  rerouted: boolean;
}

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent';

const normalizeTag = (tag: string): string =>
  tag.replace(/[^a-zA-Z0-9\s&/+-]/g, '').trim().slice(0, 28);

/** Keyword-overlap fallback: score each folder against the document text. */
const heuristicClassify = (
  fileName: string,
  content: string,
  folders: FolderOption[],
  fallbackFolderId: string
): AutoTagResult => {
  const docTokens = tokenize(`${fileName} ${content.slice(0, 4000)}`);
  const docCounts: Record<string, number> = {};
  docTokens.forEach(t => { docCounts[t] = (docCounts[t] || 0) + 1; });

  let best: { folder: FolderOption; score: number } | null = null;

  folders.forEach(folder => {
    const folderTokens = tokenize(`${folder.name} ${folder.code || ''} ${folder.description || ''}`);
    const score = folderTokens.reduce((sum, t) => sum + (docCounts[t] || 0), 0);
    if (!best || score > best.score) best = { folder, score };
  });

  const topTags = Object.entries(docCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

  const chosen = best && best.score > 0 ? best.folder : folders.find(f => f.id === fallbackFolderId);
  const totalTokens = docTokens.length || 1;
  const confidence = best ? Math.min(0.75, best.score / totalTokens + 0.15) : 0.2;

  return {
    folderId: chosen?.id || fallbackFolderId,
    folderName: chosen?.name || 'Selected folder',
    tags: topTags,
    summary: `Matched on keyword overlap with ${chosen?.name || 'the selected folder'}.`,
    confidence: Number(confidence.toFixed(2)),
    method: 'heuristic',
    rerouted: Boolean(chosen && chosen.id !== fallbackFolderId)
  };
};

const extractJson = (text: string): any | null => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
};

export interface ClassifyArgs {
  fileName: string;
  content: string;
  folders: FolderOption[];
  /** Folder the student selected in the upload dialog. */
  selectedFolderId: string;
  apiKey?: string;
}

/** Classify a document into a subject folder and propose topic tags. */
export const classifyDocument = async ({
  fileName,
  content,
  folders,
  selectedFolderId,
  apiKey
}: ClassifyArgs): Promise<AutoTagResult> => {
  if (!folders.length) {
    return {
      folderId: selectedFolderId,
      folderName: 'Selected folder',
      tags: [],
      summary: 'No subject folders available to route into.',
      confidence: 0,
      method: 'heuristic',
      rerouted: false
    };
  }

  if (!apiKey) {
    return heuristicClassify(fileName, content, folders, selectedFolderId);
  }

  const folderCatalogue = folders
    .map(f => `- id: ${f.id} | name: ${f.name} | code: ${f.code || 'n/a'} | about: ${f.description || 'n/a'}`)
    .join('\n');

  const prompt = [
    'You are the document classification engine inside FOLIO, an academic file manager.',
    'Classify the uploaded study document into exactly one existing subject folder and propose topic tags.',
    '',
    'Available subject folders:',
    folderCatalogue,
    '',
    `Document filename: ${fileName}`,
    `Document text (truncated): ${content.slice(0, 3000) || '(no extractable text)'}`,
    '',
    'Reply with ONLY a JSON object, no markdown fences, in this exact shape:',
    '{"folderId":"<id from the list>","tags":["Tag One","Tag Two"],"summary":"<one short sentence>","confidence":<0 to 1>}'
  ].join('\n');

  try {
    const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) throw new Error(data?.error?.message || 'Empty classification response');

    const parsed = extractJson(raw);
    if (!parsed) throw new Error('Classifier did not return JSON');

    const folder = folders.find(f => f.id === parsed.folderId) ||
      folders.find(f => f.name?.toLowerCase() === String(parsed.folderName || '').toLowerCase());

    if (!folder) throw new Error('Classifier chose an unknown folder');

    const tags: string[] = Array.isArray(parsed.tags)
      ? parsed.tags.map((t: unknown) => normalizeTag(String(t))).filter(Boolean).slice(0, 5)
      : [];

    return {
      folderId: folder.id,
      folderName: folder.name,
      tags,
      summary: String(parsed.summary || `Classified into ${folder.name}.`).slice(0, 160),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.6)),
      method: 'ai',
      rerouted: folder.id !== selectedFolderId
    };
  } catch (err) {
    console.warn('AI auto-tagging fell back to keyword matching:', err);
    return heuristicClassify(fileName, content, folders, selectedFolderId);
  }
};
