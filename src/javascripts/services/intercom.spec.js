import * as Intercom from './intercom';
import * as loader from 'utils/LazyLoader';

jest.mock('utils/LazyLoader', () => ({ getFromGlobal: jest.fn() }));

describe('intercom', () => {
  it('is not enabled by default', () => {
    expect(Intercom.isEnabled()).toBe(false);
  });

  // NOTE: This is order dependent because Intercom can't be disabled
  // in the normal app. To get around this order dependency, we could
  // add a special test function in the code to allow for disabling.
  it('should not open the dialog if disabled', async () => {
    const IntercomMock = jest.fn();
    loader.getFromGlobal.mockImplementationOnce(() => Promise.resolve(IntercomMock));

    await Intercom.open('test');

    expect(loader.getFromGlobal).toHaveBeenCalledTimes(0);
    expect(IntercomMock).toHaveBeenCalledTimes(0);
  });

  it('should open an Intercom dialog if enabled', async () => {
    const IntercomMock = jest.fn();
    loader.getFromGlobal.mockReset().mockImplementationOnce(() => Promise.resolve(IntercomMock));

    Intercom.enable();

    await Intercom.open('initial message');

    expect(loader.getFromGlobal).toHaveBeenCalledTimes(1);
    expect(loader.getFromGlobal).toHaveBeenCalledWith('Intercom');
    expect(IntercomMock).toHaveBeenCalledTimes(1);
    expect(IntercomMock).toHaveBeenCalledWith('showNewMessage', 'initial message');
  });
});
