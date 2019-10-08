import React from 'react';
import { render, cleanup, wait } from '@testing-library/react';
import ChangeEnvironmentModal from './ChangeEnvironmentModal.es6';
import '@testing-library/jest-dom/extend-expect';

jest.mock('./Utils.es6', () => ({
  handleChangeEnvironment: jest.fn().mockImplementation((...res) => Promise.resolve(res))
}));

let setModalOpen;
describe('ChangeEnvironmentModal', () => {
  afterEach(cleanup);
  setModalOpen = jest.fn();

  const build = (props = {}) => {
    return render(
      <ChangeEnvironmentModal
        alias={{ sys: { id: 'master' } }}
        environments={[
          {
            aliases: ['master'],
            id: 'staging',
            payload: { sys: { createdAt: Date.now() } }
          },
          {
            aliases: [],
            id: 'release-1',
            payload: { sys: { createdAt: Date.now() } }
          },
          {
            aliases: [],
            id: 'release-2',
            payload: { sys: { createdAt: Date.now() } }
          }
        ]}
        spaceId="123456"
        targetEnv={{
          aliases: ['master'],
          id: 'staging',
          payload: { sys: { createdAt: Date.now() } }
        }}
        modalOpen
        setModalOpen={setModalOpen}
        {...props}></ChangeEnvironmentModal>
    );
  };

  it('hides modal', () => {
    const { getByTestId } = build({ modalOpen: false });
    expect(() => getByTestId('changeenvironmentmodal.modal')).toThrow();
    expect(() => getByTestId('changeenvironmentmodal.content')).toThrow();
  });

  it('shows modal with disabled button', () => {
    const { getByTestId } = build();
    const modal = getByTestId('changeenvironmentmodal.modal');
    expect(modal).toBeInTheDocument();
    expect(getByTestId('changeenvironmentmodal.accept-btn')).toBeDisabled();
  });

  it('shows all items without aliases', () => {
    const { getByTestId } = build();
    getByTestId('changeenvironmentmodal.open-dropdown-btn').click();
    expect(getByTestId('changeenvironmentmodal.current-alias').innerHTML).toContain('master');
    expect(getByTestId('changeenvironmentmodal.current-environment').innerHTML).toContain(
      'staging'
    );
    expect(getByTestId('changeenvironmentmodal.dropdown').childNodes).toHaveLength(2);
  });

  it('lets the environment be selected', async () => {
    const { getByTestId } = build();
    getByTestId('changeenvironmentmodal.open-dropdown-btn').click();
    getByTestId('changeenvironmentmodal.select-release-1').firstChild.click();
    const acceptBtn = getByTestId('changeenvironmentmodal.accept-btn');
    expect(acceptBtn).not.toBeDisabled();
    acceptBtn.click();
    await wait(() => expect(setModalOpen).toHaveBeenCalledWith(false));
  });
});
