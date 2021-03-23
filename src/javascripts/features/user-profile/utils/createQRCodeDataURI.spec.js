import { create } from 'qrcode';
import { renderToDataURL } from 'qrcode/lib/renderer/canvas';
import { createQRCodeDataURI } from './createQRCodeDataURI';

jest.mock('qrcode', () => ({
  create: jest.fn(),
}));

jest.mock('qrcode/lib/renderer/canvas', () => ({
  renderToDataURL: jest.fn(),
}));

describe('createQRCodeDataURI', () => {
  it('should return null if not given data', () => {
    expect(createQRCodeDataURI()).toBeNull();
  });

  it('should return null if given non-string data', () => {
    expect(createQRCodeDataURI({})).toBeNull();
    expect(createQRCodeDataURI(1234)).toBeNull();
    expect(createQRCodeDataURI([])).toBeNull();
  });

  it('should call qrcode utilities to create the data URI', () => {
    createQRCodeDataURI('hello');

    expect(create).toHaveBeenCalled();
    expect(renderToDataURL).toHaveBeenCalled();
  });
});
