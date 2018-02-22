import * as sinon from 'helpers/sinon';

describe('DetectTEA', function () {
  beforeEach(function () {
    this.getAllContentPreviews = sinon.stub();
    this.environment = {
      env: 'production'
    };
    module('contentful/test', $provide => {
      $provide.value('contentPreview', {
        getAll: this.getAllContentPreviews
      });
      $provide.value('Config', this.environment);
    });
    this.detectTEA = this.$inject('services/DetectTEA').detectTEA;
  });

  it('should detect TEA if there are preview configurations with TEA url', function* () {
    this.getAllContentPreviews.returns(Promise.resolve({
      'some_id': {
        configurations: [{
          url: 'https://the-example-app-nodejs.contentful.com/course/something/{{some}}'
        }]
      }
    }));
    const isTEA = yield this.detectTEA();

    expect(isTEA).toBe(true);
  });

  it('should not detect TEA if there are no preview configurations with TEA url', function* () {
    this.getAllContentPreviews.returns(Promise.resolve({
      'some_id': {
        configurations: [{
          url: 'https://the-example-app-random.example.com/something'
        }]
      }
    }));
    const isTEA = yield this.detectTEA();

    expect(isTEA).toBe(false);
  });

  it('should detect TEA if there are both TEA previews and unrelated', function* () {
    this.getAllContentPreviews.returns(Promise.resolve({
      'some_id': {
        configurations: [{
          url: 'https://the-example-app-random.example.com/something'
        }]
      },
      'another_id': {
        configurations: [{
          url: 'https://the-example-app-csharp.contentful.com/something'
        }]
      }
    }));
    const isTEA = yield this.detectTEA();

    expect(isTEA).toBe(true);
  });
});

describe('DetectTEA', function () {
  beforeEach(function () {
    this.getAllContentPreviews = sinon.stub();
    this.environment = {
      env: 'not_production'
    };
    module('contentful/test', $provide => {
      $provide.value('contentPreview', {
        getAll: this.getAllContentPreviews
      });
      $provide.value('Config', this.environment);
    });
    this.detectTEA = this.$inject('services/DetectTEA').detectTEA;
  });

  it('should detect flinky TEA previews if we are not in production environment', function* () {
    this.getAllContentPreviews.returns(Promise.resolve({
      'another_id': {
        configurations: [{
          url: 'https://the-example-app-csharp.flinkly.com/something'
        }]
      }
    }));
    const isTEA = yield this.detectTEA();

    expect(isTEA).toBe(true);
  });

  it('should not detect production TEA previews if we are not in production environment', function* () {
    this.getAllContentPreviews.returns(Promise.resolve({
      'another_id': {
        configurations: [{
          url: 'https://the-example-app-csharp.contentful.com/something'
        }]
      }
    }));
    const isTEA = yield this.detectTEA();

    expect(isTEA).toBe(false);
  });
});
