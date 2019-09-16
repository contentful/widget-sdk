import sinon from 'sinon';
import { $initialize, $inject, $compile, $apply } from 'test/utils/ng';

describe('uiCommand directive element', () => {
  beforeEach(async function() {
    await $initialize(this.system);
    this.createCommand = $inject('command').create;
  });

  it('sets the "button" role if no role given', function() {
    const cmd = this.createCommand(sinon.stub());
    const el = $compile('<button ui-command=cmd>', { cmd: cmd });
    expect(el.attr('role')).toEqual('button');
  });

  it('does not overide the role attribute', function() {
    const cmd = this.createCommand(sinon.stub());
    const el = $compile('<button role=menuitem ui-command=cmd>', { cmd: cmd });
    expect(el.attr('role')).toEqual('menuitem');
  });

  it('is hidden when command is not available', function() {
    const available = sinon.stub().returns(false);
    const cmd = this.createCommand(sinon.stub(), { available: available });
    const el = $compile('<button ui-command=cmd>', { cmd: cmd });
    expect(el).toBeNgHidden();
  });

  it('is not hidden by default', function() {
    const cmd = this.createCommand(sinon.stub());
    const el = $compile('<button ui-command=cmd>', { cmd: cmd });
    expect(el).not.toBeNgHidden();
  });

  describe('disabled', () => {
    it('is not disabled by default', function() {
      const cmd = this.createCommand(sinon.stub());
      const el = $compile('<button ui-command=cmd>', { cmd: cmd });
      expect(el.prop('disabled')).toBe(false);
      expect(el.attr('aria-disabled')).toBeUndefined();
    });

    it('is true when "disabled" property returns true', function() {
      const disabled = sinon.stub().returns(true);
      const cmd = this.createCommand(sinon.stub(), { disabled: disabled });
      const el = $compile('<button ui-command=cmd>', { cmd: cmd });
      $apply();
      expect(el.prop('disabled')).toBe(true);
      expect(el.attr('aria-disabled')).toBe('true');
    });

    it('is true when "available" property returns false', function() {
      const available = sinon.stub().returns(false);
      const cmd = this.createCommand(sinon.stub(), { available: available });
      const el = $compile('<button ui-command=cmd>', { cmd: cmd });
      $apply();
      expect(el.prop('disabled')).toBe(true);
      expect(el.attr('aria-disabled')).toBe('true');
    });

    it('remains false when "available" property switches to true', function() {
      const available = sinon.stub().returns(false);
      const disabled = sinon.stub().returns(true);
      const cmd = this.createCommand(sinon.stub(), { available: available, disabled: disabled });
      const el = $compile('<button ui-command=cmd>', { cmd: cmd });

      $apply();
      expect(el).toBeNgHidden();
      expect(el.prop('disabled')).toBe(true);
      expect(el.attr('aria-disabled')).toBe('true');

      available.returns(true);
      $apply();
      expect(el).not.toBeNgHidden();
      expect(el.prop('disabled')).toBe(true);
      expect(el.attr('aria-disabled')).toBe('true');
    });

    it('is true when command is in progress', function() {
      const action = $inject('$q').defer();
      const run = sinon.stub().returns(action.promise);
      const cmd = this.createCommand(run);
      const el = $compile('<button ui-command=cmd>', { cmd: cmd });

      expect(el.prop('disabled')).toBe(false);
      expect(el.attr('aria-disabled')).toBeUndefined();
      el.click();
      $apply();
      expect(el.prop('disabled')).toBe(true);
      expect(el.attr('aria-disabled')).toBe('true');
    });

    it('is false again when command finished', function() {
      const action = $inject('$q').defer();
      const run = sinon.stub().returns(action.promise);
      const cmd = this.createCommand(run);
      const el = $compile('<button ui-command=cmd>', { cmd: cmd });

      el.click();
      $apply();
      expect(el.prop('disabled')).toBe(true);
      expect(el.attr('aria-disabled')).toBe('true');

      action.resolve();
      $apply();
      expect(el.prop('disabled')).toBe(false);
      expect(el.attr('aria-disabled')).toBeUndefined();
    });
  });

  it('runs the action on click', function() {
    const run = sinon.stub().resolves();
    const cmd = this.createCommand(run);
    const el = $compile('<button ui-command=cmd>', { cmd: cmd });
    el.click();
    sinon.assert.calledOnce(run);
  });

  it('does not run the action on click if command is disabled', function() {
    const run = sinon.stub().resolves();
    const cmd = this.createCommand(run);
    cmd.isDisabled = sinon.stub().returns(true);
    const el = $compile('<div role="button" ui-command="cmd">', { cmd: cmd });
    el.click();
    sinon.assert.notCalled(run);
  });

  it('is set to busy when command is in progress', function() {
    const action = $inject('$q').defer();
    const run = sinon.stub().returns(action.promise);
    const cmd = this.createCommand(run);
    const el = $compile('<button ui-command=cmd>', { cmd: cmd });

    expect(el.hasClass('is-loading')).toBe(false);
    expect(el.attr('aria-busy')).toBeUndefined();

    el.click();
    $apply();
    expect(el.hasClass('is-loading')).toBe(true);
    expect(el.attr('aria-busy')).toBe('true');

    action.resolve();
    $apply();
    expect(el.hasClass('is-loading')).toBe(false);
    expect(el.attr('aria-busy')).toBeUndefined();
  });
});
