describe('ShallowObjectDiff', () => {
  beforeEach(function() {
    module('contentful/test');
    this.shallowObjectDiff = this.$inject('utils/ShallowObjectDiff').default;
  });

  it('should return a shallow diff of input object', function() {
    let changes = this.shallowObjectDiff({}, { a: 10 });
    expect(changes).toEqual({ a: 10 });

    changes = this.shallowObjectDiff({ a: 10 }, { a: 20 });
    expect(changes).toEqual({ a: 20 });

    changes = this.shallowObjectDiff({ a: 10 }, { a: 10, b: true });
    expect(changes).toEqual({ b: true });

    changes = this.shallowObjectDiff({}, {});
    expect(changes).toEqual({});

    changes = this.shallowObjectDiff();
    expect(changes).toEqual({});
  });
});
