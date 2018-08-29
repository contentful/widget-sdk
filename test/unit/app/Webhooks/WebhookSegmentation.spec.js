import React from 'react';
import Enzyme from 'enzyme';
import WebhookSegmentation from 'app/Webhooks/WebhookSegmentation';
import { transformMapToTopics, transformTopicsToMap } from 'app/Webhooks/WebhookSegmentationState';

describe('WebhookSegmentation', function() {
  const mount = topics => {
    const onChangeStub = sinon.stub();
    const wrapper = Enzyme.mount(
      <WebhookSegmentation
        values={transformTopicsToMap(topics)}
        onChange={map => onChangeStub(transformMapToTopics(map))}
      />
    );

    return [wrapper, onChangeStub];
  };

  const getRadioValues = wrapper => {
    const radios = wrapper.find('input[type="radio"]');
    return [radios.at(0).prop('checked'), radios.at(1).prop('checked')];
  };

  const hasTable = wrapper => wrapper.find('table').length > 0;
  const findTableCheckboxes = wrapper => wrapper.find('table input[type="checkbox"]');

  it('uses "all" mode if topic list contains *.* wildcard', function() {
    const [wrapper] = mount(['*.*']);
    expect(getRadioValues(wrapper)).toEqual([true, false]);
    expect(hasTable(wrapper)).toBe(false);
  });

  it('shows table if topic list is empty', function() {
    const [wrapper] = mount();
    expect(getRadioValues(wrapper)).toEqual([false, true]);
    expect(hasTable(wrapper)).toBe(true);

    findTableCheckboxes(wrapper).forEach(checkbox => {
      if (!checkbox.prop('disabled')) {
        expect(checkbox.prop('checked')).toBe(false);
      }
    });
  });

  it('shows table if topic list contains specific topics', function() {
    const [wrapper] = mount(['ContentType.*', 'Entry.delete']);
    expect(getRadioValues(wrapper)).toEqual([false, true]);
    expect(hasTable(wrapper)).toBe(true);

    const checked = findTableCheckboxes(wrapper).filterWhere(checkbox => {
      return checkbox.prop('checked') === true;
    });

    // 7 = 1 (Entry.delete) + 1 (ContentType.*) + 5 (ContentType.(create|save|publish|unpublish|delete))
    expect(checked.length).toBe(7);
  });

  it('selects all horizontal checkboxes for entity wildcard and stores selection', function() {
    const [wrapper, onChangeStub] = mount(['Entry.save']);
    const entryRow = wrapper.find('tr').at(2);
    const entryWildcardCheckbox = entryRow.find('input').first();
    entryWildcardCheckbox.simulate('change', { target: { checked: true } });
    sinon.assert.calledWith(onChangeStub, ['Entry.*']);
  });

  it('selects all vertical checkboxes for action wildcard and stores selection', function() {
    const [wrapper, onChangeStub] = mount(['Asset.create']);
    const rows = wrapper.find('tr');
    const lastRow = rows.last();
    const createWildcardCheckbox = lastRow.find('input').first();
    createWildcardCheckbox.simulate('change', { target: { checked: true } });
    sinon.assert.calledWith(onChangeStub, ['*.create']);
  });
});
