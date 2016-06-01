'use strict';

describe('Revision service', function () {
  var revision;
  var $httpBackend, $rootScope;

  beforeEach(function () {
    module('contentful/test', function (environment) {
      environment.settings.gitRevision = 'git_revision';
    });
    $httpBackend = this.$inject('$httpBackend');
    $rootScope = this.$inject('$rootScope');
    revision = this.$inject('revision');
  });

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
    $httpBackend = $rootScope = revision = null;
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
