'use strict';

describe('navigation/confirmLeaveEditor', function () {
  beforeEach(function () {
    module('contentful/test');
    const createConfirm = this.$inject('navigation/confirmLeaveEditor');
    this.save = sinon.stub().resolves();
    this.confirm = createConfirm(this.save);

    this.dialog = $('<div class="client">');
    this.dialog.appendTo('body');

    // TODO this should be a global stub for contentful/test
    const icons = this.$inject('icons');
    icons['close'] = '<img>';
  });

  afterEach(function () {
    this.dialog.remove();
  });

  pit('confirms leave when "Save" is clicked', function () {
    const confirmation = this.confirm();
    this.$apply();
    this.dialog.find('button[ui-command="actions.save"]').click();
    this.$apply();
    return confirmation
    .then(function (confirmed) {
      expect(confirmed).toEqual({saved: true});
    });
  });

  it('runs the save action when "Save" is clicked', function () {
    this.confirm();
    this.$apply();
    this.dialog.find('button[ui-command="actions.save"]').click();
    this.$apply();
    sinon.assert.calledOnce(this.save);
  });

  pit('saves and confirms leave when "Enter" is pressed', function () {
    const confirmation = this.confirm();
    this.$apply();
    this.dialog.trigger(_.extend($.Event('keyup'), {
      keyCode: this.$inject('keycodes').ENTER
    }));
    this.$apply();
    sinon.assert.calledOnce(this.save);
    return confirmation
    .then(function (confirmed) {
      expect(confirmed).toEqual({saved: true});
    });
  });

  pit('cancels leave when save action is rejected', function () {
    const confirmation = this.confirm();
    this.save.rejects('ERROR');
    this.$apply();
    this.dialog.find('button[ui-command="actions.save"]').click();
    this.$apply();
    return confirmation
    .then(function () {
      throw new Error('should not resolve');
    }, function (error) {
      expect(error).toEqual('ERROR');
    });
  });

  pit('confirms leave when "Discard" is clicked', function () {
    const confirmation = this.confirm();
    this.$apply();
    this.dialog.find('button[ui-command="actions.discard"]').click();
    this.$apply();
    return confirmation
    .then(function (confirmed) {
      expect(confirmed).toEqual({discarded: true});
    });
  });

  pit('cancels leave when "Cancel" icon is clicked', function () {
    const confirmation = this.confirm();
    this.$apply();
    this.dialog.find('button[ui-command="actions.cancel"]').click();
    this.$apply();
    return confirmation
    .then(function (confirmed) {
      expect(confirmed).toEqual(false);
    });
  });
});
