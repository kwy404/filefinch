// Previews for images, video, audio, PDF and text, shown only when you click Preview.
// The browser renders them from a Blob with a MIME type we choose, never as a web page:
// HTML and scripts show as plain text, and SVG is drawn as an image, where scripts cannot run.

import { $, bytes, el, previewKind, safeType, showDialog } from './ui.js';
import { t } from './i18n.js';
import { saveFile } from './sinks.js';

const TEXT_LIMIT = 512 * 1024;
let current = null;

export function canPreview(name, type) {
  return previewKind(name, type) !== null;
}

/** Opens the preview dialog. getFile returns a File or Blob, read lazily from disk where possible. */
export async function openPreview(name, type, getFile) {
  const dialog = $('#preview-dialog');
  const body = $('#preview-body');
  $('#preview-title').textContent = name;
  body.replaceChildren(el('p.text-muted-foreground', { text: t('preview.loading') }));
  cleanup();
  $('#preview-save').onclick = async () => {
    try {
      if (await saveFile(await getFile(), name)) dialog.close();
    } catch (err) {
      body.append(el('p.text-danger', { text: err.message }));
    }
  };
  $('#preview-close').onclick = () => dialog.close();
  const done = showDialog(dialog);
  try {
    const file = await getFile();
    const kind = previewKind(name, type);
    if (kind === 'text') {
      const slice = file.slice(0, TEXT_LIMIT);
      const text = new TextDecoder('utf-8', { fatal: false }).decode(await slice.arrayBuffer());
      const pre = el('pre.ff-preview-text', { text });
      body.replaceChildren(pre);
      if (file.size > TEXT_LIMIT) body.append(el('p.text-sm.text-muted-foreground', { text: t('preview.text.cut', { size: bytes(TEXT_LIMIT) }) }));
    } else if (kind) {
      const blob = new Blob([file], { type: safeType(kind, name) });
      current = URL.createObjectURL(blob);
      const media =
        kind === 'image'
          ? el('img', { src: current, alt: name })
          : kind === 'video'
            ? el('video', { src: current, controls: true, playsInline: true, preload: 'metadata' })
            : kind === 'audio'
              ? el('audio', { src: current, controls: true, preload: 'metadata' })
              : el('iframe', { src: current, title: name });
      body.replaceChildren(media);
    } else {
      body.replaceChildren(el('p', { text: t('preview.none') }));
    }
  } catch (err) {
    body.replaceChildren(el('p.text-danger', { text: err.message }));
  }
  await done;
  body.replaceChildren();
  cleanup();
}

function cleanup() {
  if (current) URL.revokeObjectURL(current);
  current = null;
}
