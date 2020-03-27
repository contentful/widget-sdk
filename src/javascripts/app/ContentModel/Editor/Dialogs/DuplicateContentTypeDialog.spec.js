import React from 'react';
import Enzyme from 'enzyme';
import 'jest-enzyme';
import { DuplicateContentTypeForm } from './DuplicateContentTypeDialog';
import { Promise } from 'bluebird';

describe('ContentModel/Editor/DuplicateContentTypeDialog', () => {
  const render = (props = {}) => {
    const stubs = {
      onConfirmStub: jest.fn().mockImplementation((input) => Promise.resolve(input)),
      onCloseStub: jest.fn(),
    };
    const initialProps = {
      isShown: true,
      onConfirm: stubs.onConfirmStub,
      onCancel: stubs.onCloseStub,
      originalName: 'contentTypeYouWantToCopy',
      originalDescription: 'Description of contentTypeYouWantToCopy',
      existingContentTypeIds: ['first', 'second', 'third', 'contentTypeYouWantToCopy'],
    };
    const wrapper = Enzyme.mount(<DuplicateContentTypeForm {...initialProps} {...props} />);
    return {
      wrapper,
      initialProps,
      stubs,
    };
  };

  const selectors = {
    ctNameInput: 'input#contentTypeName',
    ctIdInput: 'input#contentTypeId',
    ctDescriptionInput: 'textarea#contentTypeDescription',
    note: '[data-test-id="duplicate-content-type-note"]',
    confirmBtn: '[data-test-id="content-type-form-confirm"]',
    cancelBtn: '[data-test-id="content-type-form-cancel"]',
    validationMessage: '[data-test-id="cf-ui-validation-message"]',
  };

  const changeFieldValue = (wrapper, field, value) => {
    wrapper.find(field).simulate('change', { target: { value } });
  };

  const changeName = (wrapper, value) => {
    changeFieldValue(wrapper, selectors.ctNameInput, value);
  };

  const changeId = (wrapper, value) => {
    changeFieldValue(wrapper, selectors.ctIdInput, value);
  };

  const changeDescription = (wrapper, value) => {
    changeFieldValue(wrapper, selectors.ctDescriptionInput, value);
  };

  it('should show proper initial state', () => {
    const { wrapper, initialProps } = render();

    expect(wrapper.find(selectors.ctNameInput)).toHaveValue('');
    expect(wrapper.find(selectors.ctIdInput)).toHaveValue('');
    expect(wrapper.find(selectors.ctDescriptionInput)).toHaveValue(
      initialProps.originalDescription
    );
    expect(wrapper.find(selectors.note).text()).toContain(
      `to duplicate the content type ${initialProps.originalName}`
    );
    expect(wrapper.find(selectors.confirmBtn)).toBeDisabled();
  });

  it('should automatically generate content type id based on name', () => {
    const { wrapper } = render();

    changeName(wrapper, 'new content type');
    expect(wrapper.find(selectors.ctIdInput)).toHaveValue('newContentType');

    changeName(wrapper, 'another name');
    expect(wrapper.find(selectors.ctIdInput)).toHaveValue('anotherName');

    expect(wrapper.find(selectors.confirmBtn)).not.toBeDisabled();
  });

  it('should not automatically generage content type id is the field was touched', () => {
    const { wrapper } = render();

    changeId(wrapper, 'myContentType');
    changeName(wrapper, 'super slick content type');

    expect(wrapper.find(selectors.ctIdInput)).toHaveValue('myContentType');
  });

  it('should show proper validation errors', () => {
    const { wrapper } = render();

    const getValidationErrors = () => {
      const containers = wrapper.find(selectors.validationMessage);
      return containers.map((container) => container.text());
    };

    changeName(wrapper, 'myContentType');
    changeName(wrapper, '');
    expect(getValidationErrors()).toEqual(['Name is required', 'Api Identifier is required']);
    expect(wrapper.find(selectors.confirmBtn)).toBeDisabled();

    changeName(wrapper, 'myContentType');
    changeId(wrapper, 'ajdasd asdj');
    expect(getValidationErrors()).toEqual(['Please use only letters, numbers and underscores']);
    expect(wrapper.find(selectors.confirmBtn)).toBeDisabled();

    changeId(wrapper, 'first');
    expect(getValidationErrors()).toEqual(['A content type with this ID already exists']);
    expect(wrapper.find(selectors.confirmBtn)).toBeDisabled();

    changeId(wrapper, 'newName');
    expect(getValidationErrors()).toEqual([]);
    expect(wrapper.find(selectors.confirmBtn)).not.toBeDisabled();
  });

  it('should call onConfirm and onClose once click on Duplicate', async () => {
    const { wrapper, stubs } = render();

    const values = {
      contentTypeId: 'superContentType',
      description: 'new description for new content type',
      name: 'new content type',
    };

    changeName(wrapper, values.name);
    changeId(wrapper, values.contentTypeId);
    changeDescription(wrapper, values.description);

    wrapper.find(selectors.confirmBtn).simulate('click');

    expect(stubs.onConfirmStub).toHaveBeenCalledWith(values);
  });

  it('should call onClose once click on Cancel', () => {
    const { wrapper, stubs } = render();

    wrapper.find(selectors.cancelBtn).simulate('click');

    expect(stubs.onConfirmStub).not.toHaveBeenCalled();
    expect(stubs.onCloseStub).toHaveBeenCalled();
  });
});
