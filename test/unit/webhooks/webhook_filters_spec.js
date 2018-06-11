import {
  CONSTRAINT_NAMES,
  CONSTRAINT_TYPES,
  transformFiltersToList,
  transformListToFilters
} from 'app/Webhooks/FiltersState';

describe('Webhook filters directive', function () {
  describe('transforming between flat lists and nested constraint objects', function () {
    it('transforms nested constraint objects to a flat list', function () {
      const transformed = transformFiltersToList([
        { equals: [{ doc: 'sys.id' }, '123'] },
        { not: { equals: [{ doc: 'sys.id' }, '123'] } },
        { in: [{ doc: 'sys.environment.sys.id' }, ['master', 'staging']] },
        { not: { in: [{ doc: 'sys.environment.sys.id' }, ['master', 'staging']] } },
        { regexp: [{ doc: 'sys.contentType.sys.id' }, { pattern: 'foobar' }] },
        { not: { regexp: [{ doc: 'sys.contentType.sys.id' }, { pattern: 'foobar' }] } }
      ]);

      expect(CONSTRAINT_TYPES[transformed[0].constraint].name).toBe(CONSTRAINT_NAMES.EQUALS);
      expect(CONSTRAINT_TYPES[transformed[0].constraint].negated).toBeUndefined();
      expect(transformed[0].path).toBe('sys.id');
      expect(transformed[0].value).toBe('123');

      expect(CONSTRAINT_TYPES[transformed[1].constraint].name).toBe(CONSTRAINT_NAMES.EQUALS);
      expect(CONSTRAINT_TYPES[transformed[1].constraint].negated).toBe(true);
      expect(transformed[1].path).toBe('sys.id');
      expect(transformed[1].value).toBe('123');

      expect(CONSTRAINT_TYPES[transformed[2].constraint].name).toBe(CONSTRAINT_NAMES.IN);
      expect(CONSTRAINT_TYPES[transformed[2].constraint].negated).toBeUndefined();
      expect(transformed[2].path).toBe('sys.environment.sys.id');
      expect(transformed[2].value).toBe('master, staging');

      expect(CONSTRAINT_TYPES[transformed[3].constraint].name).toBe(CONSTRAINT_NAMES.IN);
      expect(CONSTRAINT_TYPES[transformed[3].constraint].negated).toBe(true);
      expect(transformed[3].path).toBe('sys.environment.sys.id');
      expect(transformed[3].value).toBe('master, staging');

      expect(CONSTRAINT_TYPES[transformed[4].constraint].name).toBe(CONSTRAINT_NAMES.REGEXP);
      expect(CONSTRAINT_TYPES[transformed[4].constraint].negated).toBeUndefined();
      expect(transformed[4].path).toBe('sys.contentType.sys.id');
      expect(transformed[4].value).toBe('foobar');

      expect(CONSTRAINT_TYPES[transformed[5].constraint].name).toBe(CONSTRAINT_NAMES.REGEXP);
      expect(CONSTRAINT_TYPES[transformed[5].constraint].negated).toBe(true);
      expect(transformed[5].path).toBe('sys.contentType.sys.id');
      expect(transformed[5].value).toBe('foobar');
    });


    it('transforms flat list to constraint objects', function () {
      const transformed = transformListToFilters([
        { constraint: 0, path: 'sys.id', value: '123' },
        { constraint: 1, path: 'sys.id', value: '123' },
        { constraint: 2, path: 'sys.contentType.sys.id', value: '1  , , 2 , 3, 4,5' },
        { constraint: 3, path: 'sys.contentType.sys.id', value: '1  , , 2 , 3, 4,5' },
        { constraint: 4, path: 'sys.environment.sys.id', value: 'foobar' },
        { constraint: 5, path: 'sys.environment.sys.id', value: 'foobar' }
      ]);

      expect(transformed[0].equals[0].doc, 'sys.id');
      expect(transformed[0].equals[1], '123');

      expect(transformed[1].not.equals[0].doc, 'sys.id');
      expect(transformed[1].not.equals[1], '123');

      expect(transformed[2].in[0].doc, 'sys.contentType.sys.id');
      expect(transformed[2].in[1], ['1', '2', '3', '4', '5']);

      expect(transformed[3].not.in[0].doc, 'sys.contentType.sys.id');
      expect(transformed[3].not.in[1], ['1', '2', '3', '4', '5']);

      expect(transformed[4].regexp[0].doc, 'sys.environment.sys.id');
      expect(transformed[4].regexp[1].pattern, 'foobar');

      expect(transformed[5].not.regexp[0].doc, 'sys.environment.sys.id');
      expect(transformed[5].not.regexp[1].pattern, 'foobar');
    });
  });


  describe('can be listed / modified in the UI', function () {
    beforeEach(function () {
      module('contentful/test');

      this.pathEl = i => this.element.find('.path-select').get(i);
      this.constraintEl = i => this.element.find('.constraint-select').get(i);
      this.valueEl = i => this.element.find('.value-input').get(i);
      this.deleteEl = i => this.element.find('.webhook-filter .btn-link').get(i);
      this.totalFilters = () => this.element.find('.webhook-filter').length;

      this.compile = filters => {
        const data = { webhook: { filters: filters } };
        this.element = this.$compile('<cf-webhook-filters filters="filters" />', data);
        this.scope = this.element.scope();
      };
    });

    it('lists no filters when an empty array is given', function () {
      this.compile([]);
      expect(this.totalFilters()).toBe(0);
    });

    it('adds default filter if undefined, null (anything but list) given', function () {
      this.compile(undefined);
      expect(this.totalFilters()).toBe(1);
      expect(this.pathEl(0).value).toBe('sys.environment.sys.id');
      expect(this.constraintEl(0).value).toBe('0');
      expect(this.valueEl(0).value).toBe('master');
    });

    it('lists existing filters correctly', function () {
      this.compile([
        { in: [{ doc: 'sys.environment.sys.id' }, ['master', 'staging']] },
        { not: { regexp: [{ doc: 'sys.contentType.sys.id' }, { pattern: 'foobar' }] } }
      ]);

      expect(this.totalFilters()).toBe(2);
      expect(this.pathEl(0).value).toBe('sys.environment.sys.id');
      expect(this.constraintEl(0).value).toBe('2');
      expect(this.valueEl(0).value).toBe('master, staging');

      expect(this.pathEl(1).value).toBe('sys.contentType.sys.id');
      expect(this.constraintEl(1).value).toBe('5');
      expect(this.valueEl(1).value).toBe('foobar');
    });

    it('deletes a filter', function () {
      this.compile([
        { in: [{ doc: 'sys.environment.sys.id' }, ['master', 'staging']] },
        { not: { regexp: [{ doc: 'sys.contentType.sys.id' }, { pattern: 'foobar' }] } }
      ]);

      expect(this.totalFilters()).toBe(2);

      this.deleteEl(0).click();
      this.$apply();

      expect(this.totalFilters()).toBe(1);
      expect(this.pathEl(0).value).toBe('sys.contentType.sys.id');
      expect(this.constraintEl(0).value).toBe('5');
      expect(this.valueEl(0).value).toBe('foobar');
    });

    it('adds a new filter', function () {
      this.compile([
        { in: [{ doc: 'sys.environment.sys.id' }, ['master', 'staging']] },
        { not: { regexp: [{ doc: 'sys.contentType.sys.id' }, { pattern: 'foobar' }] } }
      ]);

      expect(this.totalFilters()).toBe(2);

      this.element.find('.webhook-filters .add-filter-btn').get(0).click();
      this.$apply();

      expect(this.totalFilters()).toBe(3);

      expect(this.pathEl(2).value).toBe('sys.environment.sys.id');
      expect(this.constraintEl(2).value).toBe('0');
      expect(this.valueEl(2).value).toBe('');
    });
  });
});
