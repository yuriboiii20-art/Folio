/**
 * FOLIO sharing helpers
 * ---------------------------------------------------------------------------
 * Used by the AI Studio (share a chat thread) and subject folders (share a
 * whole folder with a classmate). Everything degrades gracefully: the native
 * share sheet when the device offers one, otherwise WhatsApp / email / clipboard.
 */

export interface ChatMessageLike {
  sender: string;
  text: string;
  time?: string;
}

export interface ShareFolderPayload {
  name: string;
  code?: string;
  description?: string;
  fileNames: string[];
  url: string;
  sharedBy?: string;
}

const MAX_WHATSAPP_CHARS = 1800;

const truncate = (text: string, limit = MAX_WHATSAPP_CHARS): string =>
  text.length <= limit ? text : `${text.slice(0, limit - 25)}\n\n…(trimmed for sharing)`;

/** Open a WhatsApp share sheet (app on mobile, WhatsApp Web on desktop). */
export const shareOnWhatsApp = (message: string) => {
  const url = `https://wa.me/?text=${encodeURIComponent(truncate(message))}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

export const shareViaEmail = (subject: string, body: string) => {
  window.open(
    `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    '_blank',
    'noopener,noreferrer'
  );
};

export const googleSearchUrl = (query: string): string =>
  `https://www.google.com/search?q=${encodeURIComponent(query)}`;

/** Open a Google web search in a new tab. */
export const openGoogleSearch = (query: string) => {
  if (!query.trim()) return;
  window.open(googleSearchUrl(query), '_blank', 'noopener,noreferrer');
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
};

/** Native OS share sheet when available. Resolves false if unsupported/cancelled. */
export const nativeShare = async (title: string, text: string, url?: string): Promise<boolean> => {
  if (!navigator.share) return false;
  try {
    await navigator.share({ title, text, url });
    return true;
  } catch {
    return false;
  }
};

/** Render an AI Studio thread as a readable plain-text transcript. */
export const buildChatTranscript = (messages: ChatMessageLike[], studentName?: string): string => {
  const header = studentName
    ? `FOLIO AI Studio — study thread shared by ${studentName}`
    : 'FOLIO AI Studio — study thread';

  const body = messages
    .map(m => `${m.sender === 'user' ? '🙋 Question' : '🤖 FOLIO AI'}: ${m.text.trim()}`)
    .join('\n\n');

  return `${header}\n${'-'.repeat(34)}\n\n${body}\n\nShared from FOLIO Studio`;
};

/** Render a folder as a shareable summary message. */
export const buildFolderShareMessage = (payload: ShareFolderPayload): string => {
  const { name, code, description, fileNames, url, sharedBy } = payload;

  const fileList = fileNames.length
    ? fileNames.slice(0, 12).map((f, i) => `${i + 1}. ${f}`).join('\n') +
      (fileNames.length > 12 ? `\n…and ${fileNames.length - 12} more` : '')
    : 'No documents in this folder yet.';

  return [
    `📁 *${name}*${code ? ` (${code})` : ''}`,
    description || '',
    '',
    `📄 ${fileNames.length} ${fileNames.length === 1 ? 'document' : 'documents'}:`,
    fileList,
    '',
    `🔗 Open in FOLIO: ${url}`,
    sharedBy ? `Shared by ${sharedBy} via FOLIO Studio` : 'Shared via FOLIO Studio'
  ]
    .filter(Boolean)
    .join('\n');
};
