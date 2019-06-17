import React from 'react';
import 'jest-dom/extend-expect';
import { render, cleanup, getByTestId, fireEvent } from '@testing-library/react';
import { cloneDeep } from 'lodash';
import { WebhookTemplateForm } from './WebhookTemplateForm.es6';
import * as AnalyticsMocked from 'analytics/Analytics.es6';

const TEMPLATE = {
  id: 'test-template',
  title: 'Test Template',
  subtitle: 'subtitle',
  fields: [
    {
      name: 'url',
      type: 'text',
      title: 'URL'
    },
    {
      name: 'pass',
      type: 'password',
      title: 'Password'
    },
    {
      name: 'contentTypeId',
      type: 'content-type-selector',
      title: 'Content type'
    }
  ]
};

const VALID_FORM_VALUES = {
  url: 'http://x',
  pass: 'secret',
  contentTypeId: 'x'
};

const TEMPLATE_CONTENT_TYPES = [
  { id: 'x', name: 'X', titlePointer: '/payload/fields/x/en-US' },
  { id: 'y', name: 'Y', titlePointer: '/payload/fields/y/en-US' }
];

describe('WebhookTemplateForm', () => {
  beforeEach(() => {
    AnalyticsMocked.track.mockClear();
  });

  afterEach(cleanup);

  const selectors = {
    textField: container => getByTestId(container, 'webhook-template-field--url'),
    passwordField: container => getByTestId(container, 'webhook-template-field--pass'),
    contentTypeSelect: container =>
      getByTestId(container, 'webhook-template-field--content-type-selector'),
    createButton: container => getByTestId(container, 'webhook-template-field--create-button'),
    cancelButton: container => getByTestId(container, 'webhook-template-field--cancel-button')
  };

  const mount = () => {
    const stubs = {
      onClose: jest.fn(),
      map: jest.fn(),
      onCreate: jest.fn().mockResolvedValue({})
    };
    const template = { ...cloneDeep(TEMPLATE), mapParamsToDefinition: stubs.map };

    const { container } = render(
      <WebhookTemplateForm
        template={template}
        onClose={stubs.onClose}
        templateContentTypes={TEMPLATE_CONTENT_TYPES}
        hasAwsProxy={false}
        onCreate={stubs.onCreate}
      />
    );

    return [container, stubs];
  };

  it('renders text field', () => {
    const [container] = mount();
    expect(selectors.textField(container)).toHaveAttribute('type', 'text');
  });

  it('renders password field', () => {
    const [container] = mount();
    expect(selectors.passwordField(container)).toHaveAttribute('type', 'password');
  });

  it('renders content type selector', () => {
    const [container] = mount();
    const options = selectors.contentTypeSelect(container).querySelectorAll('option');

    const expectations = ['Select...', 'X', 'Y'];
    options.forEach((option, index) => {
      expect(option).toHaveTextContent(expectations[index]);
    });
  });

  it('closes dialog if cancel is clicked', () => {
    const [container, stubs] = mount();
    fireEvent.click(selectors.cancelButton(container));
    expect(stubs.onClose).toHaveBeenCalledTimes(1);
  });

  it('disables create button if not all values are provided', () => {
    const [container, stubs] = mount();
    const createBtn = selectors.createButton(container);
    expect(createBtn).toBeDisabled();
    fireEvent.click(createBtn);
    expect(stubs.onCreate).not.toHaveBeenCalled();
  });

  it('enables create button when all values are provided', async () => {
    const [container, stubs] = mount();

    await fireEvent.change(selectors.textField(container), {
      target: { value: VALID_FORM_VALUES.url }
    });
    await fireEvent.change(selectors.passwordField(container), {
      target: { value: VALID_FORM_VALUES.pass }
    });
    await fireEvent.change(selectors.contentTypeSelect(container), {
      target: { value: VALID_FORM_VALUES.contentTypeId }
    });

    const createButton = selectors.createButton(container);

    expect(createButton).not.toBeDisabled();

    stubs.map.mockReset().mockReturnValue({ mapped: true });

    fireEvent.click(createButton);

    expect(stubs.map).toHaveBeenCalledTimes(1);
    expect(stubs.map).toHaveBeenCalledWith(
      VALID_FORM_VALUES,
      'Test Template - subtitle',
      TEMPLATE_CONTENT_TYPES
    );
    expect(stubs.onCreate).toHaveBeenCalledTimes(1);
    expect(stubs.onCreate).toHaveBeenCalledWith([{ mapped: true }], 'test-template');
  });
});
