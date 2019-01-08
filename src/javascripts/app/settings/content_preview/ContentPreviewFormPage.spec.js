import React from 'react';
import _ from 'lodash';
import ContentPreviewFormPage from './ContentPreviewFormPage.es6';
import Enzyme from 'enzyme';
import { Notification } from '@contentful/forma-36-react-components';
import contentPreview from 'ng/contentPreview';
import * as Analytics from 'ng/analytics/Analytics.es6';
import $state from 'ng/$state';
import ModalLauncher from 'app/common/ModalLauncher.es6';

jest.mock(
  'ng/analytics/Analytics.es6',
  () => ({
    track: jest.fn()
  }),
  { virtual: true }
);

jest.mock(
  'ng/slug',
  () => ({
    slugify: _ => _
  }),
  { virtual: true }
);

describe('app/settings/content_preview/ContentPreviewFormPage', () => {
  beforeEach(() => {
    jest.spyOn(Notification, 'success').mockImplementation(() => {});
    jest.spyOn(Notification, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const selectors = {
    headerTitle: '.workbench-header__title',
    saveBtn: '[data-test-id="save-content-preview"]',
    deleteBtn: '[data-test-id="delete-content-preview"]',
    nameInput: 'input#previewName',
    descriptionInput: 'textarea#previewDescription',
    checkboxes: 'input[type="checkbox"]',
    nameValidation: '[data-test-id="preview-name-field"] [data-test-id="cf-ui-validation-message"]'
  };

  const updateName = (wrapper, value) => {
    wrapper.find(selectors.nameInput).simulate('change', { target: { value } });
  };

  const updateDescription = (wrapper, value) => {
    wrapper.find(selectors.descriptionInput).simulate('change', { target: { value } });
  };

  describe('Create new content preview environment', () => {
    const initialValue = {
      name: '',
      description: '',
      configs: [
        {
          name: 'Ct - 1',
          contentType: 'ct-1',
          url: '',
          enabled: false,
          contentTypeFields: [
            {
              apiName: 'body',
              type: 'Symbol'
            }
          ]
        },
        {
          name: 'Ct - 2',
          contentType: 'ct-2',
          url: '',
          enabled: false,
          contentTypeFields: [
            {
              apiName: 'title',
              type: 'Symbol'
            }
          ]
        }
      ],
      version: 0
    };

    const render = props => {
      const stubs = {
        setDirty: jest.fn(),
        registerSaveAction: jest.fn()
      };

      const wrapper = Enzyme.mount(
        <ContentPreviewFormPage
          isNew
          setDirty={stubs.setDirty}
          registerSaveAction={stubs.registerSaveAction}
          initialValue={initialValue}
          {...props}
        />
      );
      return { wrapper, stubs };
    };

    describe('initial state', () => {
      const { wrapper } = render();
      it('sets default title to header', () => {
        expect(wrapper.find(selectors.headerTitle)).toHaveText('Untitled');
      });

      it('save button is disabled', () => {
        expect(wrapper.find(selectors.saveBtn)).toBeDisabled();
      });

      it('delete button is not shown', () => {
        expect(wrapper.find(selectors.deleteBtn)).not.toExist();
      });

      it('has checkbox for each content type', () => {
        expect(wrapper.find(selectors.checkboxes)).toHaveLength(2);
      });
    });

    it('setDirty and registerSaveAction were called', () => {
      const { stubs } = render();
      expect(stubs.registerSaveAction).toHaveBeenCalled();
      expect(stubs.setDirty).toHaveBeenCalledWith(false);
    });

    it('updates name and description', () => {
      const { stubs, wrapper } = render();
      updateName(wrapper, 'preview name');
      updateDescription(wrapper, 'preview description');
      expect(wrapper.find(selectors.saveBtn)).not.toBeDisabled();
      expect(stubs.setDirty).toHaveBeenCalledWith(true);
    });

    it('shows validation error if name is not present on save', () => {
      const { wrapper } = render();

      updateName(wrapper, 'test');
      updateName(wrapper, '');

      wrapper.find(selectors.saveBtn).simulate('click');
      expect(wrapper.find(selectors.nameValidation)).toHaveText('Please provide a name');
    });

    it('shows error if a content type is active but has no value', () => {
      const { wrapper } = render();
      updateName(wrapper, 'test name');
      wrapper.find('input#ct-1-checkbox').simulate('change', { target: { checked: true } });
      expect(wrapper.find('input#ct-1-checkbox').prop('checked')).toBe(true);
      wrapper.find(selectors.saveBtn).simulate('click');

      expect(
        wrapper.find('[data-test-id="ct-1-value"] [data-test-id="cf-ui-validation-message"]')
      ).toHaveText('Please provide a URL.');
    });

    it('shows error if a content type is active but has invalid URL', () => {
      contentPreview.urlFormatIsValid.mockImplementationOnce(() => false);
      const { wrapper } = render();
      updateName(wrapper, 'test name');
      wrapper.find('input#ct-1-checkbox').simulate('change', { target: { checked: true } });
      expect(wrapper.find('input#ct-1-checkbox').prop('checked')).toBe(true);
      wrapper.find('input#ct-1-value').simulate('change', { target: { value: 'test' } });

      wrapper.find(selectors.saveBtn).simulate('click');

      expect(
        wrapper.find('[data-test-id="ct-1-value"] [data-test-id="cf-ui-validation-message"]')
      ).toHaveText('URL is invalid');
    });

    it('shows notification if create fails', done => {
      contentPreview.create.mockRejectedValueOnce(new Error('API returned error'));

      const { wrapper } = render();

      updateName(wrapper, 'preview name');
      updateDescription(wrapper, 'preview description');

      wrapper.find(selectors.saveBtn).simulate('click');

      expect(contentPreview.create).toHaveBeenCalledWith({
        ...initialValue,
        name: 'preview name',
        description: 'preview description'
      });

      process.nextTick(() => {
        expect(Notification.error).toHaveBeenCalledWith('Could not save Preview Environment');
        expect(Analytics.track).not.toHaveBeenCalled();
        done();
      });
    });

    it('calls create method and redirects on save', done => {
      const resolvedObject = {
        name: 'preview name',
        sys: {
          id: 'ct-1'
        }
      };

      contentPreview.create.mockResolvedValueOnce(resolvedObject);

      const { wrapper } = render();

      updateName(wrapper, 'preview name');
      updateDescription(wrapper, 'preview description');

      wrapper.find('input#ct-1-checkbox').simulate('change', { target: { checked: true } });
      wrapper
        .find('input#ct-1-value')
        .simulate('change', { target: { value: 'https://contentful.com' } });

      wrapper.find(selectors.saveBtn).simulate('click');

      const newConfigs = [...initialValue.configs];
      newConfigs[0].enabled = true;
      newConfigs[0].url = 'https://contentful.com';
      expect(contentPreview.create).toHaveBeenCalledWith({
        ...initialValue,
        name: 'preview name',
        description: 'preview description',
        configs: newConfigs
      });

      process.nextTick(() => {
        expect(Notification.success).toHaveBeenCalledWith(
          'Content preview "preview name" saved successfully'
        );
        expect(Analytics.track).toHaveBeenCalledWith('content_preview:created', {
          envName: resolvedObject.name,
          envId: resolvedObject.sys.id,
          isDiscoveryApp: false
        });

        expect($state.go).toHaveBeenCalledWith(
          '^.detail',
          { contentPreviewId: 'ct-1' },
          { reload: true }
        );

        done();
      });
    });
  });

  describe('Edit existing content preview environment', () => {
    const initialValue = {
      id: 'initial-value-id',
      name: 'test preview',
      description: 'test description',
      configs: [
        {
          name: 'Ct - 1',
          contentType: 'ct-1',
          url: 'https://contentful.com',
          enabled: true,
          contentTypeFields: [
            {
              apiName: 'body',
              type: 'Symbol'
            }
          ]
        },
        {
          name: 'Ct - 2',
          contentType: 'ct-2',
          url: '',
          enabled: false,
          contentTypeFields: [
            {
              apiName: 'title',
              type: 'Symbol'
            }
          ]
        }
      ],
      version: 0
    };

    const render = props => {
      const stubs = {
        setDirty: jest.fn(),
        registerSaveAction: jest.fn()
      };
      const wrapper = Enzyme.mount(
        <ContentPreviewFormPage
          isNew={false}
          setDirty={stubs.setDirty}
          registerSaveAction={stubs.registerSaveAction}
          initialValue={initialValue}
          {...props}
        />
      );
      return { wrapper, stubs };
    };

    describe('initial state', () => {
      const { wrapper } = render();
      it('sets current name to header', () => {
        expect(wrapper.find(selectors.headerTitle)).toHaveText(initialValue.name);
      });

      it('save button is disabled', () => {
        expect(wrapper.find(selectors.saveBtn)).toBeDisabled();
      });

      it('delete button is shown', () => {
        expect(wrapper.find(selectors.deleteBtn)).toExist();
      });

      it('name and description are populated', () => {
        expect(wrapper.find(selectors.nameInput).props().value).toEqual(initialValue.name);
        expect(wrapper.find(selectors.descriptionInput).props().value).toEqual(
          initialValue.description
        );
      });

      it('displays initial configuration details', () => {
        expect(wrapper.find('input#ct-1-checkbox').props().checked).toEqual(true);
        expect(wrapper.find('input#ct-2-checkbox').props().checked).toEqual(false);
        expect(wrapper.find('input#ct-1-value').props().value).toEqual('https://contentful.com');
        expect(wrapper.find('input#ct-2-value')).not.toExist();
      });
    });

    it('setDirty and registerSaveAction were called', () => {
      const { stubs } = render();

      expect(stubs.registerSaveAction).toHaveBeenCalled();
      expect(stubs.setDirty).toHaveBeenCalledWith(false);
    });

    it('displays error when fails', done => {
      contentPreview.update.mockRejectedValueOnce(new Error('API returned error'));

      const { wrapper } = render();

      updateName(wrapper, 'test name new');

      wrapper.find(selectors.saveBtn).simulate('click');

      expect(contentPreview.update).toHaveBeenCalledWith({
        ...initialValue,
        name: 'test name new'
      });

      process.nextTick(() => {
        expect(Notification.error).toHaveBeenCalledWith('Could not save Preview Environment');
        expect(Analytics.track).not.toHaveBeenCalled();
        done();
      });
    });

    it('calls remove method and redirects on delete', done => {
      jest.spyOn(ModalLauncher, 'open').mockResolvedValue(true);
      contentPreview.remove.mockResolvedValueOnce();
      const { wrapper, stubs } = render();
      wrapper.find(selectors.deleteBtn).simulate('click');
      process.nextTick(() => {
        expect(contentPreview.remove).toHaveBeenCalledWith({
          id: initialValue.id
        });
        expect(Notification.success).toHaveBeenCalledWith(
          'Content preview was deleted successfully'
        );
        expect(stubs.setDirty).toHaveBeenCalledWith(false);
        expect(Analytics.track).toHaveBeenCalledWith('content_preview:deleted', {
          name: initialValue.name,
          sys: { id: initialValue.id }
        });
        expect($state.go).toHaveBeenCalledWith('^.list');
        done();
      });
    });

    it('displays success message when saved successfully', done => {
      const resolvedObject = {
        name: 'preview name new',
        sys: {
          id: 'ct-1',
          version: 12
        }
      };

      contentPreview.update.mockResolvedValueOnce(resolvedObject);
      const { wrapper } = render();

      updateName(wrapper, 'preview name new');
      updateDescription(wrapper, 'preview description new');

      wrapper.find('input#ct-2-checkbox').simulate('change', { target: { checked: true } });
      wrapper
        .find('input#ct-2-value')
        .simulate('change', { target: { value: 'https://google.com' } });

      wrapper.find(selectors.saveBtn).simulate('click');

      const newConfigs = [...initialValue.configs];
      newConfigs[1].enabled = true;
      newConfigs[1].url = 'https://google.com';
      expect(contentPreview.update).toHaveBeenCalledWith({
        ...initialValue,
        name: 'preview name new',
        description: 'preview description new',
        configs: newConfigs
      });

      process.nextTick(() => {
        expect(Notification.success).toHaveBeenCalledWith(
          'Content preview "preview name new" saved successfully'
        );
        expect(Analytics.track).toHaveBeenCalledWith('content_preview:updated', {
          envId: resolvedObject.sys.id,
          envName: resolvedObject.name
        });

        expect($state.go).not.toHaveBeenCalled();

        done();
      });
    });
  });
});
