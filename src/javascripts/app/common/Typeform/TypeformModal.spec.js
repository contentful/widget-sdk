import React from 'react';
import Enzyme from 'enzyme';
import { Modal } from '@contentful/forma-36-react-components';
import { TypeformEmbed } from './TypeformEmbed.es6';
import { TypeformModal } from './TypeformModal.es6';

describe('TypeformModal', () => {
  const props = {
    title: 'My typeform modal',
    isShown: true,
    onClose: () => 'close modal',
    typeformUrl: 'https://contentful.typeform.com/potato',
    onTypeformSubmit: () => 'typeform submitted',
    testId: 'my-typeform-modal'
  };
  const wrapper = Enzyme.shallow(<TypeformModal {...props} />);

  it('should pass Modal props to Modal component', () => {
    const WrappingModal = wrapper.find(Modal);

    expect(WrappingModal.prop('title')).toBe(props.title);
    expect(WrappingModal.prop('isShown')).toBe(props.isShown);
    expect(WrappingModal.prop('onClose')).toBe(props.onClose);
    expect(WrappingModal.prop('testId')).toBe(props.testId);
  });

  it('should pass TypeformEmbed props to TypeformEmbed component', () => {
    const EmbeddedTypeform = wrapper.find(TypeformEmbed);

    expect(EmbeddedTypeform.prop('url')).toBe(props.typeformUrl);
    expect(EmbeddedTypeform.prop('onSubmit')).toBe(props.onTypeformSubmit);
  });

  it('should render a Modal with TypeformEmbed inside', () => {
    expect(wrapper).toMatchSnapshot();
  });
});
