'use strict';

describe('cfJsonEditor directive', function () {
  let cmEditor, fieldApi, element;

  beforeEach(function () {
    module('contentful/test', function ($provide, createQueuedDebounce) {
      $provide.value('debounce', createQueuedDebounce());
    });

    cmEditor = {
      on: sinon.stub(),
      doc: {
        setValue: sinon.stub()
      },
      refresh: sinon.stub(),
      clearHistory: sinon.stub(),
      historySize: sinon.stub().returns({})
    };

    const CodeMirror = sinon.stub().returns(cmEditor);
    const LazyLoader = this.$inject('LazyLoader');
    LazyLoader.get = sinon.stub()
      .withArgs('markdown')
      .resolves({CodeMirror: CodeMirror});

    const widgetApi = this.$inject('mocks/widgetApi').create();
    fieldApi = widgetApi.field;

    element = this.$compile('<cf-json-editor />', {}, {
      cfWidgetApi: widgetApi
    });
  });

  afterEach(function () {
    element = fieldApi = cmEditor = null;
  });

  it('sets editor content when value changes', function () {
    fieldApi.onValueChanged.yield({json: true});
    sinon.assert.calledWithExactly(cmEditor.doc.setValue, beautifyJSON({json: true}));
  });

  it('sets disabled view content when value changes', function () {
    fieldApi.onValueChanged.yield({json: true});
    this.$apply();
    expect(element.find('pre:visible').length).toBe(0);
    fieldApi.onDisabledStatusChanged.yield(true);
    this.$apply();
    expect(JSON.parse(element.find('pre').text())).toEqual({json: true});
  });

  describe('when editor content changes', function () {
    beforeEach(function () {
      fieldApi.setValue = sinon.stub();

      const debounce = this.$inject('debounce');
      this.flush = function () {
        debounce.flush();
        this.$apply();
      };

      this.emitContentChange = function (content) {
        cmEditor.on.withArgs('change').yield({
          getValue: _.constant(content)
        });
      };
    });

    it('sets field value with valid json', function () {
      this.emitContentChange(beautifyJSON({json: true}));
      sinon.assert.notCalled(fieldApi.setValue);
      this.flush();
      sinon.assert.calledWithExactly(fieldApi.setValue, {json: true});
    });

    it('removes field value with empty content', function () {
      fieldApi.removeValue = sinon.stub();
      this.emitContentChange('');
      this.flush();
      sinon.assert.called(fieldApi.removeValue);
    });

    it('does not set field value with invalid json', function () {
      this.emitContentChange('not json');
      this.flush();
      sinon.assert.notCalled(fieldApi.setValue);
    });

    it('shows status message if content is invalid', function () {
      this.emitContentChange('not json');
      this.flush();
      expect(getStatusElement(element, 'invalid-json').length).toBe(1);

      this.emitContentChange(beautifyJSON({json: true}));
      this.flush();
      expect(getStatusElement(element, 'invalid-json').length).toBe(0);
    });

    it('shows no validation status when content is empty', function () {
      fieldApi.removeValue = sinon.stub();
      this.emitContentChange('');
      this.flush();
      expect(element.find('[role=status]').length).toBe(0);
    });
  });

  function getStatusElement ($el, code) {
    return $el.find(
      '[role=status]' +
      '[data-status-code="json-editor.' + code + '"]'
    );
  }


  function beautifyJSON (obj) {
    if (obj === null || obj === undefined) {
      return '';
    } else {
      return JSON.stringify(obj, null, '\t');
    }
  }
});
