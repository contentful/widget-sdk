'use strict';

describe('contextHistory service', function () {

  var ch, $stateParams;
  function e(id) { return {getId: _.constant(id)}; }

  beforeEach(function () {
    module('contentful/test');
    ch = this.$inject('contextHistory');
    ch.purge();
    $stateParams = this.$inject('$stateParams');
    $stateParams.addToContext = false;
  });

  describe('after init (empty state)', function () {
    it('is empty', function () {
      expect(ch.isEmpty()).toBe(true);
    });

    it('pop returns undefined', function () {
      expect(ch.pop()).toBeUndefined();
    });
  });

  describe('adding entities', function () {
    it('adds when empty and w/o addToContext flag', function () {
      ch.addEntity(e(1));
      expect(ch.getAll().length).toBe(1);
    });

    it('does not add when not empty and w/o addToContext flag', function () {
      ch.addEntity(e(1)); ch.addEntity(e(1));
      expect(ch.getLast().getId()).toBe(1);
    });

    it('adds when not empty but with addToContext flag', function () {
      $stateParams.addToContext = true;
      ch.addEntity(e(1)); ch.addEntity(e(2));
      expect(ch.getAll().length).toBe(2);
    });

    it('if adding already added entity, it is used as a new head', function () {
      $stateParams.addToContext = true;
      [e(1), e(2), e(3), e(4)].forEach(ch.addEntity);
      expect(ch.getAll().length).toBe(4);
      ch.addEntity(e(3));
      expect(ch.getAll().length).toBe(3);
      expect(ch.getLast().getId()).toBe(3);
      expect(ch.getAllButLast()[1].getId()).toBe(2);
    });
  });

  describe('getters', function () {
    beforeEach(function () {
      $stateParams.addToContext = true;
      [e(1), e(2), e(3)].forEach(ch.addEntity);
    });

    it('#getAll', function () {
      var all = ch.getAll();
      expect(all.length).toBe(3);
      expect(all[1].getId()).toBe(2);
    });

    it('#getLast', function () {
      expect(ch.getLast().getId()).toBe(3);
    });

    it('#getAllButLast', function () {
      var allButLast = ch.getAllButLast();
      expect(allButLast.length).toBe(2);
      expect(allButLast[1].getId()).toBe(2);
    });
  });

  describe('destructive operations', function () {
    beforeEach(function () {
      $stateParams.addToContext = true;
      [e(1), e(2), e(3)].forEach(ch.addEntity);
    });

    it('#pop', function () {
      expect(ch.getAll().length).toBe(3);
      var popped = ch.pop();
      expect(popped.getId()).toBe(3);
      expect(ch.getAll().length).toBe(2);
      expect(ch.getLast().getId()).toBe(2);
    });

    it('#purge', function () {
      expect(ch.getAll().length).toBe(3);
      ch.purge();
      expect(ch.getAll().length).toBe(0);
      expect(ch.isEmpty()).toBe(true);
    });
  });
});
