'use strict';

describe('uiCommand directive element', function () {

  beforeEach(function () {
    module('contentful/test');
    this.createCommand = this.$inject('command').create;
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

  it('is disabled when "disabled" option returns true', function () {
    var disabled = sinon.stub().returns(true);
    var cmd = this.createCommand(sinon.stub(), {disabled: disabled});
    var el = this.$compile('<button ui-command=cmd>', {cmd: cmd});
    this.$apply();
    expect(el.prop('disabled')).toBe(true);
  });

  it('is not disabled by default', function () {
    var cmd = this.createCommand(sinon.stub());
    var el = this.$compile('<button ui-command=cmd>', {cmd: cmd});
    expect(el.prop('disabled')).toBe(false);
  });


  it('runs the action on click', function () {
    var run = sinon.stub().resolves();
    var cmd = this.createCommand(run);
    var el = this.$compile('<button ui-command=cmd>', {cmd: cmd});
    el.click();
    sinon.assert.called(run);
  });

  it('is disabled when command is in progress', function () {
    var action = this.$inject('$q').defer();
    var run = sinon.stub().returns(action.promise);
    var cmd = this.createCommand(run);
    var el = this.$compile('<button ui-command=cmd>', {cmd: cmd});

    expect(el.prop('disabled')).toBe(false);
    el.click();
    this.$apply();
    expect(el.prop('disabled')).toBe(true);
  });

  it('is reenabled when command finished', function () {
    var action = this.$inject('$q').defer();
    var run = sinon.stub().returns(action.promise);
    var cmd = this.createCommand(run);
    var el = this.$compile('<button ui-command=cmd>', {cmd: cmd});

    el.click();
    this.$apply();
    expect(el.prop('disabled')).toBe(true);

    action.resolve();
    this.$apply();
    expect(el.prop('disabled')).toBe(false);
  });
});
