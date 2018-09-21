import React from 'react';
import Enzyme from 'enzyme';
import sinon from 'sinon';
import WebhookBasicAuth from '../WebhookBasicAuth.es6';

describe('WebhookBasicAuth', () => {
  const shallow = user => {
    const onChangeStub = sinon.stub();
    const wrapper = Enzyme.shallow(
      <WebhookBasicAuth httpBasicUsername={user} onChange={onChangeStub} />
    );

    return [wrapper, onChangeStub];
  };

  it('does not show up if credentials are not stored', () => {
    const [wrapper] = shallow(undefined);
    expect(wrapper.children()).toHaveLength(0);
  });

  it('only displays username if credentials are stored', () => {
    const [wrapper] = shallow('jakub');
    expect(
      wrapper
        .find('strong')
        .first()
        .text()
    ).toBe('jakub');
  });

  it('allows to forget credentials if stored', () => {
    const [wrapper, onChangeStub] = shallow('jakub');
    wrapper.find('button').simulate('click');
    expect(
      onChangeStub.calledWith({
        httpBasicPassword: null,
        httpBasicUsername: null
      })
    ).toBeTruthy();
    expect(onChangeStub.calledOnce).toBeTruthy();
  });
});
