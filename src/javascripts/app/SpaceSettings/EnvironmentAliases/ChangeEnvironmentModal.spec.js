import React from 'react';
import { render, wait } from '@testing-library/react';
import ChangeEnvironmentModal from './ChangeEnvironmentModal';

jest.mock('./Utils', () => ({
  handleChangeEnvironment: jest.fn().mockImplementation((...res) => Promise.resolve(res)),
}));

let setModalOpen;
describe('ChangeEnvironmentModal', () => {
  setModalOpen = jest.fn();

  const build = (props = {}) => {
    return render(
      <ChangeEnvironmentModal
        alias={{ sys: { id: 'master' } }}
        environments={[
          {
            aliases: ['master'],
            id: 'staging',
            payload: { sys: { createdAt: Date.now() } },
          },
          {
            aliases: [],
            id: 'release-1',
            payload: { sys: { createdAt: Date.now() } },
          },
          {
            aliases: [],
            id: 'release-2',
            payload: { sys: { createdAt: Date.now() } },
          },
        ]}
        spaceId="123456"
        targetEnv={{
          aliases: ['master'],
          id: 'staging',
          payload: { sys: { createdAt: Date.now() } },
        }}
        modalOpen
        setModalOpen={setModalOpen}
        {...props}
      />
    );
  };

  it('hides modal', async () => {
    const { findByTestId } = build({ modalOpen: false });
    await expect(findByTestId('changeenvironmentmodal.modal')).rejects.toBeInstanceOf(Error);
    await expect(findByTestId('changeenvironmentmodal.content')).rejects.toBeInstanceOf(Error);
  });

  it('shows modal with disabled button', async () => {
    const { findByTestId } = build();
    const modal = await findByTestId('changeenvironmentmodal.modal');
    expect(modal).toBeInTheDocument();
    expect(await findByTestId('changeenvironmentmodal.accept-btn')).toBeDisabled();
  });

  it('shows all items without aliases', async () => {
    const { findByTestId } = build();
    (await findByTestId('changeenvironmentmodal.open-dropdown-btn')).click();

    expect((await findByTestId('changeenvironmentmodal.current-alias')).innerHTML).toContain(
      'master'
    );
    expect((await findByTestId('changeenvironmentmodal.current-environment')).innerHTML).toContain(
      'staging'
    );
    expect((await findByTestId('changeenvironmentmodal.dropdown')).childNodes).toHaveLength(2);
  });

  it('lets the environment be selected', async () => {
    const { findByTestId } = build();
    (await findByTestId('changeenvironmentmodal.open-dropdown-btn')).click();
    (await findByTestId('changeenvironmentmodal.select-release-1')).firstChild.click();
    const acceptBtn = await findByTestId('changeenvironmentmodal.accept-btn');
    expect(acceptBtn).not.toBeDisabled();
    acceptBtn.click();
    await wait(() => expect(setModalOpen).toHaveBeenCalledWith(false));
  });
});
