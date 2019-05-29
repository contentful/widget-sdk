import React from 'react';
import { render, cleanup, fireEvent } from 'react-testing-library';
import 'jest-dom/extend-expect';
import AccountView from './AccountView.es6';

jest.mock('account/UrlSyncHelper.es6', () => ({
  getGatekeeperUrl: jest.fn().mockReturnValue('account/gatekeeperpage')
}));

describe('AccountView', () => {
  afterEach(cleanup);

  const props = {
    title: 'My Account Page',
    onReady: jest.fn()
  };

  const build = () => {
    return render(<AccountView {...props} />);
  };

  it('renders the iframe with the correct url', () => {
    const { getByTestId } = build();

    expect(getByTestId('account-iframe')).toHaveAttribute('src', 'account/gatekeeperpage');
  });

  it('calls the onReady callback', async () => {
    const { getByTestId } = build();
    const iframe = getByTestId('account-iframe');
    expect(props.onReady).not.toHaveBeenCalled();

    fireEvent.load(iframe);

    process.nextTick(() => {
      expect(props.onReady).toHaveBeenCalled();
    });
  });
});
