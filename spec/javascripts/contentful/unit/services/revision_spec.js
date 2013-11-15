/*
'use strict';

describe('App version service', function () {
  var appVersion;
  var stub, successStub;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      successStub = sinon.stub();
      $provide.value('$http', {
        success: successStub
      });
      $provide.value('environment', {
        settings: {
          git_revision: 'git_revision'
        }
      });
    });
    inject(function (_appVersion_) {
      appVersion = _appVersion_;
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('has a new version', function () {
    appVersion.hasNewVersion().then(stub);
    successStub.callsArgWith(0, {git_revision: 'git_revision'});
    expect(stub.called).toBe(true);
  });

  xit('has no new version', function () {
    appVersion.hasNewVersion().catch(stub);
    successStub.callsArgWith(0, {git_revision: 'different_git_revision'});
    expect(stub.called).toBe(true);
  });

  xit('request fails', function () {
    var errorStub = sinon.stub();
    appVersion.hasNewVersion().catch(stub);
    successStub.returns({error: errorStub});
    errorStub.callsArg(0);
    expect(stub.called).toBe(true);
  });

});
*/
