import React from 'react';
import 'jest-dom/extend-expect';
import { render, cleanup, fireEvent } from '@testing-library/react';
import WebhookSegmentation from './WebhookSegmentation.es6';
import { transformMapToTopics, transformTopicsToMap } from './WebhookSegmentationState.es6';

describe('WebhookSegmentation', () => {
  afterEach(cleanup);

  const renderComponent = topics => {
    const onChangeStub = jest.fn();

    return [
      render(
        <WebhookSegmentation
          values={transformTopicsToMap(topics)}
          onChange={map => onChangeStub(transformMapToTopics(map))}
        />
      ),
      onChangeStub
    ];
  };

  const getRadioValues = radios => {
    return [radios[0].checked, radios[1].checked];
  };

  const hasTable = wrapper => wrapper.querySelectorAll('table').length > 0;
  const findTableCheckboxes = wrapper =>
    Array.from(wrapper.querySelectorAll('table input[type="checkbox"]'));

  it('uses "all" mode if topic list contains *.* wildcard', () => {
    const [{ getAllByTestId, container }] = renderComponent(['*.*']);
    expect(getRadioValues(getAllByTestId('webhook-editor-setting-option'))).toEqual([true, false]);
    expect(hasTable(container)).toBe(false);
  });

  it('shows table if topic list is empty', () => {
    const [{ getAllByTestId, container }] = renderComponent();
    expect(getRadioValues(getAllByTestId('webhook-editor-setting-option'))).toEqual([false, true]);
    expect(hasTable(container)).toBe(true);

    findTableCheckboxes(container).forEach(checkbox => {
      if (!checkbox.disabled) {
        expect(checkbox.checked).toBe(false);
      }
    });
  });

  it('shows table if topic list contains specific topics', () => {
    const [{ getAllByTestId, container }] = renderComponent(['ContentType.*', 'Entry.delete']);
    expect(getRadioValues(getAllByTestId('webhook-editor-setting-option'))).toEqual([false, true]);
    expect(hasTable(container)).toBe(true);

    const checked = findTableCheckboxes(container).filter(checkbox => {
      return checkbox.checked === true;
    });

    // 7 = 1 (Entry.delete) + 1 (ContentType.*) + 5 (ContentType.(create|save|publish|unpublish|delete))
    expect(checked).toHaveLength(7);
  });

  it('selects all horizontal checkboxes for entity wildcard and stores selection', () => {
    const [{ container }, onChangeStub] = renderComponent(['Entry.save']);
    const entryRow = container.querySelectorAll('tr')[2];
    const entryWildcardCheckbox = entryRow.querySelectorAll('input')[0];
    fireEvent.click(entryWildcardCheckbox);
    expect(onChangeStub).toHaveBeenCalledWith(['Entry.*']);
  });

  it('selects all vertical checkboxes for action wildcard and stores selection', () => {
    const [{ container }, onChangeStub] = renderComponent(['Asset.create']);
    const rows = container.querySelectorAll('tr');
    const lastRow = rows[rows.length - 1];
    const createWildcardCheckbox = lastRow.querySelectorAll('input')[0];
    fireEvent.click(createWildcardCheckbox);
    expect(onChangeStub).toHaveBeenCalledWith(['*.create']);
  });
});
