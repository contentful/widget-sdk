import { create as createQrCode } from 'qrcode';
import { renderToDataURL } from 'qrcode/lib/renderer/canvas';

export function createQRCodeDataURI(data?: unknown) {
  if (!data || typeof data !== 'string') {
    return null;
  }

  return renderToDataURL(createQrCode(data));
}
