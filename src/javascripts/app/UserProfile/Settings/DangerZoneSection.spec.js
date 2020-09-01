import React from 'react';
import { render, fireEvent, wait } from '@testing-library/react';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';
import { cancelUser } from 'Authentication';
import DangerZoneSection from './DangerZoneSection';

describe('DangerZoneSection', () => {
  const build = () => {
    return render(<DangerZoneSection singleOwnerOrganizations={[]} />);
  };

  beforeEach(() => {
    jest.spyOn(ModalLauncher, 'open').mockImplementation(() => Promise.resolve(true));
  });

  it('should not call cancelUser if ModalLauncher.open resolves false', async () => {
    ModalLauncher.open.mockResolvedValueOnce(false);

    const { queryByTestId } = build();

    fireEvent.click(queryByTestId('delete-cta'));

    await wait();

    expect(cancelUser).not.toBeCalled();
  });

  it('should call cancelUser if ModalLauncher.open does not resolve false', async () => {
    ModalLauncher.open.mockResolvedValueOnce();

    const { queryByTestId } = build();

    fireEvent.click(queryByTestId('delete-cta'));

    await wait();

    expect(cancelUser).toBeCalled();
  });
});
