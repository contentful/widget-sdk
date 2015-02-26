'use strict';

describe('Analytics provider', function () {
  it('generates a stub of dontLoad is set', function() {
    module('contentful/test', function(analyticsProvider){
      analyticsProvider.dontLoad();
    });
    var analytics = this.$inject('analytics');
    expect(analytics.setUserData).toBe(_.noop);
  });

});

describe('Analytics service', function () {
  beforeEach(function(){
    module('contentful/test', function(analyticsProvider){
      analyticsProvider.forceLoad();
    });

    this.userData = {
      firstName: 'Hans',
      lastName: 'Wurst',
      sys: {id: 'h4nswur5t'}
    };

    this.space = {data: {
      tutorial: false,
      organization: {
        sys: {id: 'orgId'},
        subscriptionState: 'subscriptionStateValue',
        invoiceState: 'invoiceStateValue',
        subscriptionPlan: {
          sys: {id: 'subscriptionPlanId'},
          name: 'subscriptionPlanName' } } }};

    this.segment   = this.$inject('segment') ;
    sinon.stub(this.segment, 'enable');
    sinon.stub(this.segment, 'disable');
    sinon.stub(this.segment, 'identify');
    sinon.stub(this.segment, 'track');

    this.totango   = this.$inject('totango') ;
    sinon.stub(this.totango, 'enable');
    sinon.stub(this.totango, 'disable');
    sinon.stub(this.totango, 'initialize');
    sinon.stub(this.totango, 'setSection');
    sinon.stub(this.totango, 'track');

    this.analytics = this.$inject('analytics');
  });

  it('should enable', function() {
    this.analytics.enable();
    sinon.assert.called(this.segment.enable);
    sinon.assert.called(this.totango.enable);
  });

  it('should disable', function() {
    this.analytics.disable();
    sinon.assert.called(this.segment.disable);
    sinon.assert.called(this.totango.disable);
    expect(this.analytics.track).toBe(_.noop);
  });

  describe('setSpace', function(){
    beforeEach(function(){
      this.analytics.setUserData(this.userData);
    });

    it('setSpace should set space data and initialize', function() {
      sinon.assert.calledWith(this.segment.identify, 'h4nswur5t', {firstName: 'Hans', lastName: 'Wurst'});
      sinon.assert.notCalled(this.totango.initialize);
      this.analytics.setSpace(this.space);
      sinon.assert.calledWith(this.totango.initialize, this.userData, this.space.data.organization);
    });
  });

  describe('setUserData', function(){
    beforeEach(function(){
      this.analytics.setSpace(this.space);
    });

    it('setSpace should set space data and initialize', function() {
      sinon.assert.notCalled(this.segment.identify);
      sinon.assert.notCalled(this.totango.initialize);
      this.analytics.setUserData(this.userData);
      sinon.assert.calledWith(this.segment.identify, 'h4nswur5t', {firstName: 'Hans', lastName: 'Wurst'});
      sinon.assert.calledWith(this.totango.initialize, this.userData, this.space.data.organization);
    });
  });

  it('should track', function(){
    this.analytics.track('Event', {data: 'foobar'});
    sinon.assert.calledWith(this.segment.track, 'Event', {data: 'foobar'});
  });

  it('should track totango', function(){
    this.analytics.trackTotango('Event');
    sinon.assert.calledWith(this.totango.track, 'Event');
  });

  describe('tabAdded', function() {
    beforeEach(function(){
      this.analytics.tabAdded({
        viewType: 'entry-editor',
        section: 'sectionValue',
        params: {
          entry: {getId: _.constant('entryId')}
        }
      });
    });

    it('should track Opened Tab', function(){
      sinon.assert.calledWith(this.segment.track, 'Opened Tab',{
        section: 'sectionValue',
        viewType: 'entry-editor',
        id: 'entryId'
      });
    });

    it('should track page view', function(){
      sinon.assert.calledWith(this.segment.track, 'Viewed Page', {
        section: 'sectionValue',
        viewType: 'entry-editor',
        entryId: 'entryId'});
    });
  });

  it('should track tab closed', function(){
    this.analytics.tabClosed({
      viewType: 'viewTypeValue',
      section: 'sectionValue'
    });
    sinon.assert.calledWith(this.segment.track, 'Closed Tab', {
      section: 'sectionValue',
      viewType: 'viewTypeValue',
      id: undefined
    });
  });

  describe('tabActivated', function() {
    beforeEach(function(){
      this.tab = {
        viewType: 'viewTypeValue',
        section: 'sectionValue'
      };
      this.analytics.tabActivated(this.tab);
    });

    it('should set the section in totango', function(){
      sinon.assert.calledWith(this.totango.setSection, 'sectionValue');
    });

    it('should track segment', function(){
      sinon.assert.called(this.segment.track);
    });
  });

  it('should track knowledgeBase clicks', function(){
    this.analytics.knowledgeBase('sectionName');
    sinon.assert.calledWith(this.segment.track, 'Clicked KBP link', {section: 'sectionName'});
  });

  it('should track modifiedContentType', function(){
    var event  = 'Herp';
    var action = 'derp';
    var contentType = {
      getId:   _.constant('ctId'),
      getName: _.constant('ctName')
    };
    var field = {
      id: 'fieldId',
      name: 'fieldName',
      type: 'fieldType',
      localized: true,
      required: true 
    };
    this.analytics.modifiedContentType(event, contentType, field, action);
    sinon.assert.calledWith(this.segment.track, 'Herp', {
      contentTypeId: 'ctId',
      contentTypeName: 'ctName',
      fieldId: 'fieldId',
      fieldName: 'fieldName',
      fieldType: 'fieldType',
      fieldSubtype: null,
      fieldLocalized: true,
      fieldRequired: true,
      action: 'derp'
    });
  });

  it('should track toggleAuxPanel', function(){
    this.analytics.toggleAuxPanel(true, { section: 's', viewType: 't' });
    sinon.assert.calledWith(this.segment.track, 'Opened Aux-Panel', {
      currentSection: 's', currentViewType: 't'
    });

    this.analytics.toggleAuxPanel(false, { section: 's', viewType: 't' });
    sinon.assert.calledWith(this.segment.track, 'Closed Aux-Panel', {
      currentSection: 's', currentViewType: 't'
    });
  });

  describe('id calculation', function(){
    _.each({
      'entry-editor': 'entry',
      'asset-editor': 'asset',
      'content-type-editor': 'contentType'
    }, function(param, viewType){

      it('should extract the id from a '+viewType, function(){
        var tab = {
          viewType: viewType,
          section: 'sectionValue',
          params: {}
        };
        tab.params[param] = {getId: _.constant('theId')};
        this.analytics.tabActivated(tab);
        expect(this.segment.track.args[0][1].id).toBe('theId');
      });

    });
  });

});
