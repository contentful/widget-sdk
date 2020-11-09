import _ from 'lodash';
import * as entitySelector from './entitySelector';
import * as spaceContextMocked from 'ng/spaceContext';
import { ModalLauncher } from '@contentful/forma-36-react-components/dist/alpha';

let config;
let labels;

const resolveProps = (func) => {
  const { props } = func({ isShown: true, onClose: () => {} });
  config = props.config;
  labels = props.labels;
};

const modalLauncherOpen = jest
  .spyOn(ModalLauncher, 'open')
  .mockImplementation(() => Promise.resolve(true));

modalLauncherOpen.mockImplementation(resolveProps);

jest.mock('services/localeStore', () => ({
  getDefaultLocale: () => ({ code: 'de-DE' }),
}));

jest.mock('ng/spaceContext', () => ({
  publishedCTs: {
    fetch: jest.fn(),
  },
  getData: jest.fn().mockReturnValue('org-id'),
  getEnvironmentId: jest.fn().mockReturnValue('env-id'),
  getId: jest.fn().mockReturnValue('space-id'),
}));

describe('entitySelector', () => {
  function open(...args) {
    return entitySelector.openFromField(...args);
  }

  it('throws error if invalid entity type is provided', function () {
    expect(() => open({ linkType: 'Foobar' })).toThrowError("Unsupported entity type: 'Foobar'.");
  });

  describe('config preparation', () => {
    it('sets type of linked entity', async function () {
      await open({ linkType: 'Entry' });
      expect(config.entityType).toBe('Entry');
      await open({ linkType: 'Asset' });
      expect(config.entityType).toBe('Asset');
    });

    describe('setting min/max number of linked entities', () => {
      it('do not limit by default', async function () {
        await open({ linkType: 'Entry' });
        expect(config.min).toBe(1);
        expect(config.max).toBe(Infinity);
      });

      it('respects field items size constraint', async function () {
        await open({ linkType: 'Entry', itemValidations: [size(6, 12)] });
        expect(config.min).toBe(6);
        expect(config.max).toBe(12);
      });

      it('substracts current link count from limits', async function () {
        await open({ linkType: 'Entry', itemValidations: [size(3, 6)] }, 2);
        expect(config.min).toBe(1);
        expect(config.max).toBe(4);
      });

      it('uses 1 as minimal lower bound', async function () {
        await open({ linkType: 'Entry', itemValidations: [size(2, 6)] }, 2);
        expect(config.min).toBe(1);
        expect(config.max).toBe(4);
      });
    });

    describe('differentiating between single link and array of links', () => {
      it('checks for "Array" field type', async function () {
        await open({ linkType: 'Entry', type: 'Array' });
        expect(config.multiple).toBe(true);
        await open({ linkType: 'Entry', type: 'Link' });
        expect(config.multiple).toBe(false);
      });

      it('treats as a single link when only one entity can be selected', async function () {
        await open({ linkType: 'Entry', type: 'Array', itemValidations: [size(2, 2)] });
        expect(config.multiple).toBe(false);
      });
    });

    describe('processing validations', () => {
      it('defaults to an appropriate (empty) data structure', async function () {
        await open({ linkType: 'Entry' });
        expect(config.linkedContentTypeIds).toEqual([]);
        expect(config.linkedMimetypeGroups).toEqual([]);
      });

      it('extracts allowed linked entry content type IDs', async function () {
        const validation = { linkContentType: ['ctid1', 'ctid2'] };
        await open({ linkType: 'Entry', itemValidations: [validation] });
        expect(config.linkedContentTypeIds).toEqual(['ctid1', 'ctid2']);
      });

      it('extracts allowed asset MIMEtype groups', async function () {
        const validation = { linkMimetypeGroup: ['group1', 'group2'] };
        await open({ linkType: 'Asset', itemValidations: [validation] });
        expect(config.linkedMimetypeGroups).toEqual(['group1', 'group2']);
      });
    });
  });

  it('sets lables', async function () {
    await open({ linkType: 'Entry' });
    expect(labels.title).toBe('Insert existing entry');
    await open({ linkType: 'Entry', type: 'Array' });
    expect(labels.title).toBe('Insert existing entries');
    await open({ linkType: 'Asset' });
    expect(labels.title).toBe('Insert existing asset');
    await open({ linkType: 'Asset', type: 'Array' });
    expect(labels.title).toBe('Insert existing assets');
  });

  describe('opening from an extension', () => {
    function openFromExt(opts) {
      return entitySelector.openFromWidget(opts);
    }

    function resolveWith(value) {
      modalLauncherOpen.mockImplementation(async (func) => {
        resolveProps(func);
        return value;
      });
    }

    function rejectWith(err) {
      modalLauncherOpen.mockImplementation(async (func) => {
        resolveProps(func);
        throw err;
      });
    }

    it('selecting a single entity', async function () {
      resolveWith([{ test: true }]);
      const entry = await openFromExt({ entityType: 'Entry', multiple: false });
      expect(config.multiple).toBe(false);
      expect(entry).toEqual([{ test: true }]);
    });

    it('selecting many entities', async function () {
      const selected = [{ multiple: 1 }, { multiple: 2 }];
      resolveWith(selected);
      const entries = await openFromExt({ entityType: 'Entry', multiple: true });
      expect(config.multiple).toBe(true);
      expect(entries).toEqual(selected);
    });

    it('resolves with null if selection was skipped', async function () {
      rejectWith(undefined);
      expect(await openFromExt({ entityType: 'Entry' })).toBeNull();
    });

    it('rejects with an original error thrown in the process', async function () {
      rejectWith(new Error('selector error'));

      const err = await openFromExt({ entityType: 'Entry' }).catch(_.identity);
      expect(err.message).toBe('selector error');
    });

    describe('converting options to validations', () => {
      it('"contentTypes" option converted to validation', async function () {
        resolveWith([{ test: true }]);
        spaceContextMocked.publishedCTs.fetch.mockResolvedValue({});
        const ids = ['blogpost', 'cat'];
        await openFromExt({ entityType: 'Entry', contentTypes: ids });
        expect(config.linkedContentTypeIds).toEqual(ids);
      });
      it('"mix" and "max" options converted to validation', async function () {
        resolveWith([{ test: true }]);
        await openFromExt({ entityType: 'Entry', multiple: true, min: 2, max: 4 });
        expect(config.min).toBe(2);
        expect(config.max).toBe(4);
      });
    });

    describe('locale option', () => {
      it('uses provided locale', async function () {
        resolveWith([{ test: true }]);
        await openFromExt({ entityType: 'Entry', locale: 'co-DE' });
        expect(config.locale).toBe('co-DE');
      });

      it('uses default space locale if not provided', async function () {
        resolveWith([{ test: true }]);
        await openFromExt({ entityType: 'Entry' });
        expect(config.locale).toBe('de-DE');
      });
    });
  });
});

function size(min, max, key) {
  const t = {};
  t[key || 'size'] = { min: min, max: max };
  return t;
}
