import React from 'react';
import Enzyme from 'enzyme';
import { TextField, Button } from '@contentful/forma-36-react-components';
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
  contentTypeId: 'ctid'
};

const TEMPLATE_CONTENT_TYPES = [
  { id: 'x', name: 'X', titlePointer: '/payload/fields/x/en-US' },
  { id: 'y', name: 'Y', titlePointer: '/payload/fields/y/en-US' }
];

describe('WebhookTemplateForm', () => {
  beforeEach(() => {
    AnalyticsMocked.track.mockClear();
  });

  const mount = () => {
    const stubs = {
      onClose: jest.fn(),
      map: jest.fn(),
      onCreate: jest.fn().mockResolvedValue({})
    };
    const template = { ...cloneDeep(TEMPLATE), mapParamsToDefinition: stubs.map };

    const wrapper = Enzyme.mount(
      <WebhookTemplateForm
        template={template}
        onClose={stubs.onClose}
        templateContentTypes={TEMPLATE_CONTENT_TYPES}
        hasAwsProxy={false}
        onCreate={stubs.onCreate}
      />
    );

    return [wrapper, stubs];
  };

  const findField = (wrapper, i) => wrapper.find('.webhook-template-form__field').at(i);

  it('renders text field', () => {
    const [wrapper] = mount();
    const textField = findField(wrapper, 0).find(TextField);
    expect(textField.prop('textInputProps').type).toBe('text');
  });

  it('renders password field', () => {
    const [wrapper] = mount();
    const passField = findField(wrapper, 1).find(TextField);
    expect(passField.prop('textInputProps').type).toBe('password');
  });

  it('renders content type selector', () => {
    const [wrapper] = mount();
    const ctSelect = findField(wrapper, 2).find('select');
    const options = ctSelect.children().map(opt => opt.text());
    expect(options).toEqual(['Select...', 'X', 'Y']);
  });

  it('closes dialog if cancel is clicked', () => {
    const [wrapper, stubs] = mount();
    const cancelBtn = wrapper.find(Button).at(1);
    cancelBtn.simulate('click');
    expect(stubs.onClose).toHaveBeenCalledTimes(1);
  });

  it('disables create button if not all values are provided', () => {
    const [wrapper, stubs] = mount();
    const createBtn = wrapper.find(Button).at(0);
    expect(createBtn.prop('disabled')).toBe(true);

    createBtn.simulate('click');
    expect(stubs.onCreate).not.toHaveBeenCalled();
  });

  it('updates parameter values', () => {
    const [wrapper] = mount();

    const f1 = findField(wrapper, 0).find(TextField);
    f1.prop('onChange')({ target: { value: 'http://x' } });
    expect(wrapper.state('fields').url).toBe('http://x');

    const f2 = findField(wrapper, 1).find(TextField);
    f2.prop('onChange')({ target: { value: 'secret' } });
    expect(wrapper.state('fields').pass).toBe('secret');

    const f3 = findField(wrapper, 2).find('select');
    f3.prop('onChange')({ target: { value: 'ctid' } });
    expect(wrapper.state('fields').contentTypeId).toBe('ctid');
  });

  it('enables create button when all values are provided', () => {
    const [wrapper] = mount();
    wrapper.setState({ fields: VALID_FORM_VALUES });
    const createBtn = wrapper.find(Button).at(0);
    expect(createBtn.prop('disabled')).toBe(false);
  });

  it('maps params to webhook and calls onCreate callback', async () => {
    const [wrapper, stubs] = mount();
    wrapper.setState({ fields: VALID_FORM_VALUES });

    const createBtn = wrapper.find(Button).at(0);
    stubs.map.mockReset().mockReturnValue({ mapped: true });

    await createBtn.prop('onClick')();

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
