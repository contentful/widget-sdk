import _ from 'lodash';
import sinon from 'sinon';
import { $initializeAndReregister, $inject, $apply, $compile } from 'test/helpers/helpers';

describe('cfJsonEditor directive', () => {
  let cmEditor, fieldApi, element;

  beforeEach(async function() {
    cmEditor = {
      on: sinon.stub(),
      doc: {
        setValue: sinon.stub()
      },
      refresh: sinon.stub(),
      clearHistory: sinon.stub(),
      historySize: sinon.stub().returns({})
    };

    function debounce(fn) {
      return function(...args) {
        debounce.queue.push({ fn: fn, args: args });
      };
    }

    debounce.queue = [];
    debounce.flush = () => {
      debounce.queue.forEach(call => {
        call.fn.apply(null, call.args);
      });
    };

    this.stubs = {
      debounce
    };

    this.system.set('lodash/debounce', {
      default: this.stubs.debounce
    });

    this.system.set('codemirror', {
      default: sinon.stub().returns(cmEditor)
    });

    await $initializeAndReregister(this.system, ['app/widgets/json/JsonEditorController']);

    this.widgetApi = $inject('mocks/widgetApi').create();
    fieldApi = this.widgetApi.field;

    element = $compile(
      '<cf-json-editor />',
      {},
      {
        cfWidgetApi: this.widgetApi
      }
    );
  });

  afterEach(() => {
    element = fieldApi = cmEditor = null;
  });

  it('sets editor content when value changes', () => {
    fieldApi.onValueChanged.yield({ json: true });
    sinon.assert.calledWithExactly(cmEditor.doc.setValue, beautifyJSON({ json: true }));
  });

  it('sets disabled view content when value changes', function() {
    fieldApi.onValueChanged.yield({ json: true });
    $apply();
    expect(element.find('pre:visible').length).toBe(0);
    this.widgetApi.fieldProperties.isDisabled$.set(true);
    $apply();
    expect(JSON.parse(element.find('pre').text())).toEqual({ json: true });
  });

  describe('when editor content changes', () => {
    beforeEach(function() {
      fieldApi.setValue = sinon.stub();

      this.flush = function() {
        this.stubs.debounce.flush();
        $apply();
      };

      this.emitContentChange = content => {
        cmEditor.on.withArgs('change').yield({
          getValue: _.constant(content)
        });
      };
    });

    it('sets field value with valid json', function() {
      this.emitContentChange(beautifyJSON({ json: true }));
      sinon.assert.notCalled(fieldApi.setValue);
      this.flush();
      sinon.assert.calledWithExactly(fieldApi.setValue, { json: true });
    });

    it('removes field value with empty content', function() {
      fieldApi.removeValue = sinon.stub();
      this.emitContentChange('{}');
      this.flush();
      sinon.assert.notCalled(fieldApi.removeValue);
      this.emitContentChange('');
      this.flush();
      sinon.assert.calledOnce(fieldApi.removeValue);
    });

    it('does not set field value with invalid json', function() {
      this.emitContentChange('not json');
      this.flush();
      sinon.assert.notCalled(fieldApi.setValue);
    });

    it('shows status message if content is invalid', function() {
      this.emitContentChange('not json');
      this.flush();
      expect(getStatusElement(element, 'invalid-json').length).toBe(1);

      this.emitContentChange(beautifyJSON({ json: true }));
      this.flush();
      expect(getStatusElement(element, 'invalid-json').length).toBe(0);
    });

    it('shows no validation status when content is empty', function() {
      fieldApi.removeValue = sinon.stub();
      this.emitContentChange('');
      this.flush();
      expect(element.find('[role=status]').length).toBe(0);
    });
  });

  function getStatusElement($el, code) {
    return $el.find('[role=status]' + '[data-status-code="json-editor.' + code + '"]');
  }

  function beautifyJSON(obj) {
    if (obj === null || obj === undefined) {
      return '';
    } else {
      return JSON.stringify(obj, null, '\t');
    }
  }
});
