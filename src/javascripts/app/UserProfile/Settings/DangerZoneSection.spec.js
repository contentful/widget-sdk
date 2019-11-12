import React from 'react';
import { render, cleanup, fireEvent, wait } from '@testing-library/react';
import * as ModalLauncher from 'app/common/ModalLauncher';
import { cancelUser } from 'Authentication';
import DangerZoneSection from './DangerZoneSection';

import '@testing-library/jest-dom/extend-expect';

describe('DangerZoneSection', () => {
  const build = () => {
    return render(<DangerZoneSection singleOwnerOrganizations={[]} />);
  };

  afterEach(cleanup);

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
