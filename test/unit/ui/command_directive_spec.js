'use strict';

describe('uiCommand directive element', () => {

  beforeEach(function () {
    module('contentful/test');
    this.createCommand = this.$inject('command').create;
  });

  it('sets the "button" role if no role given', function () {
    var cmd = this.createCommand(sinon.stub());
    var el = this.$compile('<button ui-command=cmd>', {cmd: cmd});
    expect(el.attr('role')).toEqual('button');
  });

  it('does not overide the role attribute', function () {
    var cmd = this.createCommand(sinon.stub());
    var el = this.$compile('<button role=menuitem ui-command=cmd>', {cmd: cmd});
    expect(el.attr('role')).toEqual('menuitem');
  });


  it('is hidden when command is not available', function () {
    var available = sinon.stub().returns(false);
    var cmd = this.createCommand(sinon.stub(), {available: available});
    var el = this.$compile('<button ui-command=cmd>', {cmd: cmd});
    expect(el).toBeNgHidden();
  });

  it('is not hidden by default', function () {
    var cmd = this.createCommand(sinon.stub());
    var el = this.$compile('<button ui-command=cmd>', {cmd: cmd});
    expect(el).not.toBeNgHidden();
  });

  describe('disabled', () => {

    it('is not disabled by default', function () {
      var cmd = this.createCommand(sinon.stub());
      var el = this.$compile('<button ui-command=cmd>', {cmd: cmd});
      expect(el.prop('disabled')).toBe(false);
      expect(el.attr('aria-disabled')).toBeUndefined();
    });

    it('is true when "disabled" property returns true', function () {
      var disabled = sinon.stub().returns(true);
      var cmd = this.createCommand(sinon.stub(), {disabled: disabled});
      var el = this.$compile('<button ui-command=cmd>', {cmd: cmd});
      this.$apply();
      expect(el.prop('disabled')).toBe(true);
      expect(el.attr('aria-disabled')).toBe('true');
    });

    it('is true when "available" property returns false', function () {
      var available = sinon.stub().returns(false);
      var cmd = this.createCommand(sinon.stub(), {available: available});
      var el = this.$compile('<button ui-command=cmd>', {cmd: cmd});
      this.$apply();
      expect(el.prop('disabled')).toBe(true);
      expect(el.attr('aria-disabled')).toBe('true');
    });

    it('remains false when "available" property switches to true', function () {
      var available = sinon.stub().returns(false);
      var disabled = sinon.stub().returns(true);
      var cmd = this.createCommand(sinon.stub(), {available: available, disabled: disabled});
      var el = this.$compile('<button ui-command=cmd>', {cmd: cmd});

      this.$apply();
      expect(el).toBeNgHidden();
      expect(el.prop('disabled')).toBe(true);
      expect(el.attr('aria-disabled')).toBe('true');

      available.returns(true);
      this.$apply();
      expect(el).not.toBeNgHidden();
      expect(el.prop('disabled')).toBe(true);
      expect(el.attr('aria-disabled')).toBe('true');
    });

    it('is true when command is in progress', function () {
      var action = this.$inject('$q').defer();
      var run = sinon.stub().returns(action.promise);
      var cmd = this.createCommand(run);
      var el = this.$compile('<button ui-command=cmd>', {cmd: cmd});

      expect(el.prop('disabled')).toBe(false);
      expect(el.attr('aria-disabled')).toBeUndefined();
      el.click();
      this.$apply();
      expect(el.prop('disabled')).toBe(true);
      expect(el.attr('aria-disabled')).toBe('true');
    });

    it('is false again when command finished', function () {
      var action = this.$inject('$q').defer();
      var run = sinon.stub().returns(action.promise);
      var cmd = this.createCommand(run);
      var el = this.$compile('<button ui-command=cmd>', {cmd: cmd});

      el.click();
      this.$apply();
      expect(el.prop('disabled')).toBe(true);
      expect(el.attr('aria-disabled')).toBe('true');

      action.resolve();
      this.$apply();
      expect(el.prop('disabled')).toBe(false);
      expect(el.attr('aria-disabled')).toBeUndefined();
    });

  });

  it('runs the action on click', function () {
    var run = sinon.stub().resolves();
    var cmd = this.createCommand(run);
    var el = this.$compile('<button ui-command=cmd>', {cmd: cmd});
    el.click();
    sinon.assert.calledOnce(run);
  });

  it('does not run the action on click if command is disabled', function () {
    var run = sinon.stub().resolves();
    var cmd = this.createCommand(run);
    cmd.isDisabled = sinon.stub().returns(true);
    var el = this.$compile('<div role="button" ui-command="cmd">', {cmd: cmd});
    el.click();
    sinon.assert.notCalled(run);
  });


  it('is set to busy when command is in progress', function () {
    var action = this.$inject('$q').defer();
    var run = sinon.stub().returns(action.promise);
    var cmd = this.createCommand(run);
    var el = this.$compile('<button ui-command=cmd>', {cmd: cmd});

    expect(el.hasClass('is-loading')).toBe(false);
    expect(el.attr('aria-busy')).toBeUndefined();

    el.click();
    this.$apply();
    expect(el.hasClass('is-loading')).toBe(true);
    expect(el.attr('aria-busy')).toBe('true');

    action.resolve();
    this.$apply();
    expect(el.hasClass('is-loading')).toBe(false);
    expect(el.attr('aria-busy')).toBeUndefined();
  });

});
