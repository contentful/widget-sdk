import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { render, cleanup, fireEvent } from '@testing-library/react';
import WebhookOtherEventsSection from './WebhookOtherEventsSection';
import { transformTopicsToMap } from './WebhookSegmentationState';

describe('WebhookOtherEventsSection', () => {
  afterEach(cleanup);

  const renderComponent = topics => {
    const onChangeStub = jest.fn();
    const wrapper = render(
      <WebhookOtherEventsSection values={transformTopicsToMap(topics)} onChange={onChangeStub} />
    );

    return [wrapper, onChangeStub];
  };

  it('shows the other events section', () => {
    const [{ queryAllByTestId }] = renderComponent([]);
    const section = queryAllByTestId('other-events-section');
    expect(section).toHaveLength(1);
  });

  it('onChange is called when checkbox is checked', () => {
    const [{ container }, onChangeStub] = renderComponent([]);
    const environmentAliasCheckbox = container.querySelectorAll('#environment-alias-action')[0];

    fireEvent.click(environmentAliasCheckbox);

    expect(onChangeStub).toHaveBeenCalled();
  });
});
