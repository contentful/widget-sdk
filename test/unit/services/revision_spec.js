'use strict';

xdescribe('Revision service', function () {
  var revision;
  var $httpBackend, $rootScope;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.constant('environment', {
        gitRevision: 'git_revision'
      });
    });
    inject(function (_revision_, _$httpBackend_, _$rootScope_) {
      $httpBackend = _$httpBackend_;
      $rootScope = _$rootScope_;
      revision = _revision_;
    });
  });

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('has a new version', function () {
    var stub = sinon.stub();
    $httpBackend.when('GET', /revision\.json/).respond(
      {git_revision: 'new_git_revision'},
      {'Content-Type': 'application/json'}
    );
    $rootScope.$apply(function () {
      revision.hasNewVersion().catch(stub).finally(function () {
        sinon.assert.called(stub);
      });
    });
    $httpBackend.flush();
  });

  it('has no new version', function () {
    var successStub = sinon.stub();
    var failStub = sinon.stub();
    $httpBackend.when('GET', /revision\.json/).respond(
      {git_revision: 'git_revision'},
      {'Content-Type': 'application/json'}
    );
    $rootScope.$apply(function () {
      revision.hasNewVersion().then(successStub).catch(failStub).finally(function () {
        sinon.assert.called(successStub);
        sinon.assert.notCalled(failStub);
      });
    });
    $httpBackend.flush();
  });

});
