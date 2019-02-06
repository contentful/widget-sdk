import React from 'react';
import Enzyme from 'enzyme';

import * as typeformEmbed from '@typeform/embed';
import { TypeformEmbed } from './TypeformEmbed.es6';

jest.mock('@typeform/embed');

describe('TypeformEmbed', () => {
  const render = props => Enzyme.mount(<TypeformEmbed {...props} />);

  describe('render as widget', () => {
    const props = {
      url: 'https://contentful.typeform.com/potato',
      renderAs: 'widget',
      hideHeaders: false,
      hideFooter: false,
      onSubmit: () => 'typeform submitted',
      widgetOpacity: 60,
      widgetStartButtonText: 'Carpe Diem and such'
    };

    const wrapper = render(props);

    it('should render the typeform as a widget inside the TypeformEmbed container', () => {
      expect(wrapper).toMatchSnapshot();
    });

    it('should pass only typeform widget props to the makeWidget typeform fn', () => {
      expect(typeformEmbed.makeWidget).toBeCalledWith(wrapper.find('div').getDOMNode(), props.url, {
        hideHeaders: props.hideHeaders,
        hideFooter: props.hideFooter,
        onSubmit: props.onSubmit,
        opacity: props.widgetOpacity,
        buttonText: props.widgetStartButtonText
      });
    });
  });

  describe('render as popup', () => {
    const props = {
      url: 'https://contentful.typeform.com/potato',
      renderAs: 'popup',
      hideHeaders: false,
      hideFooter: false,
      onSubmit: () => 'typeform submitted',
      popupMode: 'drawer_left',
      popupAutoOpen: true,
      popupAutoCloseDuration: 123123
    };

    const wrapper = render(props);

    it('should render the typeform in popup mode', () => {
      expect(wrapper).toMatchSnapshot();
    });

    it('should pass only typeform widget props to the makeWidget typeform fn', () => {
      expect(typeformEmbed.makePopup).toBeCalledWith(props.url, {
        hideHeaders: props.hideHeaders,
        hideFooter: props.hideFooter,
        onSubmit: props.onSubmit,
        mode: props.popupMode,
        autoOpen: props.popupAutoOpen,
        autoClose: props.popupAutoCloseDuration
      });
    });
  });

  it('should throw when not rendered as widget or popup', () => {
    expect(() =>
      render({
        url: 'https://contentful.typeform.com/potato',
        renderAs: 'invalid render mode'
      })
    ).toThrow();
  });
});
