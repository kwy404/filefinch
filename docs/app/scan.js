// Camera QR scanning with the browser's BarcodeDetector where it exists. Everywhere else the
// person pastes the link, so the scan buttons only show when scanning can work.

import { $, showDialog } from './ui.js';
import { t } from './i18n.js';
import { findSignal } from './lib/invite.js';

export async function canScan() {
  if (!('BarcodeDetector' in globalThis) || !navigator.mediaDevices?.getUserMedia) return false;
  try {
    const formats = await BarcodeDetector.getSupportedFormats();
    return formats.includes('qr_code');
  } catch {
    return false;
  }
}

/** Opens the camera and resolves with { kind, code } from the first filefinch QR code, or null. */
export async function scanSignal() {
  const dialog = $('#scan-dialog');
  const video = $('#scan-video');
  const status = $('#scan-status');
  status.textContent = t('scan.point');
  let stream = null;
  let stop = false;
  let found = null;
  $('#scan-close').onclick = () => dialog.close();
  const closed = showDialog(dialog).then(() => (stop = true));
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    video.srcObject = stream;
    await video.play();
    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    while (!stop && !found) {
      try {
        const codes = await detector.detect(video);
        for (const c of codes) {
          const sig = findSignal(c.rawValue);
          if (sig) found = sig;
          else status.textContent = t('scan.notours');
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 200));
    }
  } catch (err) {
    status.textContent = t('scan.nocamera', { error: err.name || err.message });
    await closed;
  } finally {
    stream?.getTracks().forEach((tr) => tr.stop());
    video.srcObject = null;
    if (dialog.open) dialog.close();
  }
  return found;
}
