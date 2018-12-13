import React from 'react';
import Enzyme from 'enzyme';
import { create as createPublicationManager } from '../index.es6';
import { registerUnpublishedReferencesWarning as createRegisterUnpublishedReferencesWarning } from './index.es6';
import Confirm from './UnpublishedReferencesConfirm.es6';

const mockStubs = {
  modalOpenStub: jest.fn().mockResolvedValue(true)
};

jest.mock(
  'app/common/ModalLauncher.es6',
  () => ({
    open: (...args) => mockStubs.modalOpenStub(...args)
  }),
  { virtual: true }
);

describe('UnpublishedReferencesWarning', () => {
  const createField = name => ({
    name: name,
    locale: 'en-US'
  });

  const createEntry = () => ({
    sys: {
      type: 'Entry',
      id: 1
    }
  });

  const createAsset = () => ({
    sys: {
      type: 'Asset',
      id: 1
    }
  });
  describe('registerUnpublishedReferencesWarning', () => {
    let publicationWarningManager, registerUnpublishedReferencesWarning;
    beforeEach(() => {
      publicationWarningManager = createPublicationManager();
      registerUnpublishedReferencesWarning = createRegisterUnpublishedReferencesWarning(
        publicationWarningManager
      );
    });
    afterEach(() => {});
    it('does not show confirmation if no unpublished references provided', async () => {
      registerUnpublishedReferencesWarning({
        getData: async () => {
          return Promise.resolve({
            field: createField(),
            references: []
          });
        }
      });

      await expect(publicationWarningManager.show()).toResolve();
      expect(mockStubs.modalOpenStub).not.toBeCalled();
    });

    it('shows confirm if unpublished references provided', async () => {
      registerUnpublishedReferencesWarning({
        getData: async () => {
          return Promise.resolve({
            field: createField(),
            references: [createEntry()]
          });
        }
      });

      await expect(publicationWarningManager.show()).toResolve();
      expect(mockStubs.modalOpenStub).toBeCalledTimes(1);
    });
  });

  describe('UnpublishedReferencesConfirm', () => {
    const defaultProps = () => ({
      isShown: true,
      onConfirm: jest.fn(),
      onCancel: jest.fn(),
      unpublishedReferencesInfo: []
    });

    it('renders confirmation dialog', () => {
      const wrapper = Enzyme.shallow(<Confirm {...defaultProps()} />);

      expect(wrapper).toMatchSnapshot();
    });

    describe.each([
      ['This entry links to 1 unpublished entry', createEntry()],
      ['This entry links to 2 unpublished entries', createEntry(), createEntry()],
      ['This entry links to 1 unpublished asset', createAsset()],
      ['This entry links to 2 unpublished assets', createAsset(), createAsset()],
      [
        'This entry links to 1 unpublished entry and 1 unpublished asset',
        createEntry(),
        createAsset()
      ],
      [
        'This entry links to 1 unpublished entry and 2 unpublished assets',
        createEntry(),
        createAsset(),
        createAsset()
      ],
      [
        'This entry links to 2 unpublished entries and 1 unpublished asset',
        createEntry(),
        createEntry(),
        createAsset()
      ],
      [
        'This entry links to 2 unpublished entries and 2 unpublished assets',
        createEntry(),
        createEntry(),
        createAsset(),
        createAsset()
      ]
    ])('renders following title "%s"', (title, ...references) => {
      const wrapper = Enzyme.mount(
        <Confirm
          {...defaultProps()}
          unpublishedReferencesInfo={[
            { field: createField('field-with-unpublished-entities'), references }
          ]}
        />
      );

      expect(wrapper.find('[data-test-id="cf-ui-modal-header"]').text()).toBe(title);
    });

    it('renders list of fields with unpublished references', () => {
      const wrapper = Enzyme.mount(
        <Confirm
          {...defaultProps()}
          unpublishedReferencesInfo={[
            {
              field: createField('field-with-unpublished-entry'),
              references: [createEntry()]
            },
            {
              field: createField('field-with-unpublished-entries'),
              references: [createEntry(), createEntry()]
            },
            {
              field: createField('field-with-unpublished-asset'),
              references: [createAsset()]
            },
            {
              field: createField('field-with-unpublished-assets'),
              references: [createAsset(), createAsset()]
            },
            {
              field: createField('field-with-unpublished-mixed'),
              references: [createEntry(), createAsset()]
            },
            {
              field: createField('field-with-unpublished-mixed'),
              references: [createEntry(), createEntry(), createAsset(), createAsset()]
            }
          ]}
        />
      );

      expect(wrapper.find('[data-test-id="cf-ui-modal-content"]')).toMatchSnapshot();
    });
  });
});
