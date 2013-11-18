'use strict';

xdescribe('App version service', function () {
  var revision;
  var $httpBackend, $rootScope;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.constant('environment', {
        settings: {
          git_revision: 'git_revision'
        }
      });
    });
    inject(function (_revision_, _$httpBackend_, _$rootScope_) {
      $httpBackend = _$httpBackend_;
      $rootScope = _$rootScope_;
      revision = _revision_;
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('has a new version', function () {
    //var stub = sinon.stub();
    $rootScope.$apply(function () {
      $httpBackend.when('GET', /manifest\.json/, {data: {git_revision: 'new_git_revision'}});
      revision.hasNewVersion();
    });
    //expect(stub.called).toBe(true);
    //$httpBackend.flush();
  });

  xit('has no new version', function () {
    var successStub = sinon.stub();
    var failStub = sinon.stub();
    $httpBackend.whenGET('/manifest.json').respond({data: {git_revision: 'git_revision'}});
    revision.hasNewVersion().then(successStub).catch(failStub);
    expect(successStub.called).toBe(false);
    expect(failStub.called).toBe(true);
    //$httpBackend.flush();
  });

});
