import jestKefir from 'jest-kefir';
import * as Kefir from 'utils/kefir';
// import * as CmaDocument from './CmaDocument';

const kefirHelpers = jestKefir(Kefir); // https://github.com/kefirjs/jest-kefir
expect.extend(kefirHelpers.extensions);

// TODO: Run general Document.spec.js tests against CmaDocument. Entry point should be
//  in here (e.g. import { testGeneralDocumentBehavior } from 'Document.spec.js'

describe.skip('CmaDocument specific behavior', () => {
  // let doc;

  beforeEach(async () => {
    // doc = CmaDocument.create(ENTRY, 'fake/endpoint');
  });

  // ASSUMPTION: We do "optimistic updating"
  describe('initially', () => {
    it('triggers no CMA request for the next 5 sec.', () => {
      throwNotImplementedError();
    });
  })

  describe('immediately after setValueAt(fieldPath) on a field', () => {
    it('triggers no CMA request for the next 5 sec.', () => {
      throwNotImplementedError();
    });
  });

  describe('5 sec. after setValueAt(fieldPath) on a field', () => {
    it('triggers CMA request', () => {
      throwNotImplementedError();
    });
  });

  describe('multiple setValueAt() calls within 5s', () => {
    it('sends one CMA request', () => {
      throwNotImplementedError();
    });
  });

  // Also see basic test in `Document.spec.js`
  describe('snapshot normalization', () => {
    // While `Document` should not expose locales not known to `services/localeStore`,
    // we have to keep them on the `PUT` request when saving changes so that this data
    // does not get "magically" lost as a side-effect of editing an entry via the web app.
    it('persists unknown locales in CMA request', () => {
      throwNotImplementedError();
    });

    // In case of unknown fields we do not care as they should not ever existing in the
    // first place and a `PUT` request with a non-existing field (not known to the CT)
    // would simply fail.
    it('does not persist unknown fields in CMA request', () => {
      throwNotImplementedError();
    });
  });
});

function throwNotImplementedError() {
  throw new Error('Not implemented!');
}
