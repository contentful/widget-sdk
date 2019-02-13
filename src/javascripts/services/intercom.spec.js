import * as Intercom from './intercom.es6';

jest.mock('utils/LazyLoader.es6', () => ({ getFromGlobal: jest.fn() }));

describe('intercom', () => {
  it('is enabled by default', () => {
    expect(Intercom.isEnabled()).toBe(true);
  });

  it('should open an Intercom dialog if enabled', async () => {
    const loader = jest.requireMock('utils/LazyLoader.es6');
    const IntercomMock = jest.fn();
    loader.getFromGlobal.mockImplementationOnce(() => Promise.resolve(IntercomMock));

    await Intercom.open('initial message');

    expect(loader.getFromGlobal).toHaveBeenCalledTimes(1);
    expect(loader.getFromGlobal).toHaveBeenCalledWith('Intercom');
    expect(IntercomMock).toHaveBeenCalledTimes(1);
    expect(IntercomMock).toHaveBeenCalledWith('showNewMessage', 'initial message');
  });

  it('should disable', () => {
    Intercom.disable();
    expect(Intercom.isEnabled()).toBe(false);
  });

  it('should not open the dialog if disabled', async () => {
    const loader = jest.requireMock('utils/LazyLoader.es6');
    const IntercomMock = jest.fn();
    loader.getFromGlobal.mockReset().mockImplementationOnce(() => Promise.resolve(IntercomMock));

    Intercom.disable();
    await Intercom.open('test');

    expect(loader.getFromGlobal).toHaveBeenCalledTimes(0);
    expect(IntercomMock).toHaveBeenCalledTimes(0);
  });
});
