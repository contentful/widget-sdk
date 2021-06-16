import { Document } from '@contentful/editorial-primitives';
import { createDocumentMock } from 'app/entity_editor/Document/__mocks__/createDocumentMock';
import noop from 'lodash/noop';
import { createCmaDocumentWithApiNames } from './createCmaDocumentWithApiNames';

jest.mock('services/localeStore', () => ({
  toInternalCode: jest.fn().mockImplementation(() => 'en-US'),
}));

let doc: Document;
let docWithApiNames: Document;

let entity;
beforeEach(() => {
  entity = {
    sys: {
      id: 'EID',
      type: 'Entry',
      version: 42,
    },
    fields: { id: { 'en-US': 'Old content' }, arrayId: { 'en-US': ['one', 'two'] } },
  };
  const fields = [
    { id: 'id', apiName: 'apiName' },
    { id: 'arrayId', apiName: 'arrayApiName' },
  ];

  doc = createDocumentMock().create(entity, {}, noop, fields);

  // @ts-expect-error only pass in a subset of ContentType
  docWithApiNames = createCmaDocumentWithApiNames(doc, { fields });
});

describe('getValueAt', () => {
  it('changes field id to api name for `path = []`', () => {
    const result = docWithApiNames.getValueAt([]);
    expect(result.fields).toMatchObject({ apiName: { 'en-US': 'Old content' } });
  });

  it("changes field id to api name for `path = ['fields']`", () => {
    const fields = docWithApiNames.getValueAt(['fields']);
    expect(fields).toMatchObject({ apiName: { 'en-US': 'Old content' } });
  });

  it("changes field id to api name for `path = ['fields', 'apiName']`", () => {
    const field = docWithApiNames.getValueAt(['fields', 'apiName']);
    expect(field).toMatchObject({ 'en-US': 'Old content' });
  });

  it("changes field id to api name for `path = ['fields', 'apiName', 'en-US']`", () => {
    const value = docWithApiNames.getValueAt(['fields', 'apiName', 'en-US']);
    expect(value).toBe('Old content');
  });

  it("changes field id to api name for `path = ['fields', 'apiName', 'de-DE']`", () => {
    const value = docWithApiNames.getValueAt(['fields', 'apiName', 'de-DE']);
    expect(value).toBe('Old content');
  });

  it('throws if requesting field id', () => {
    expect(() => docWithApiNames.getValueAt(['fields', 'id'])).toThrow();
  });
});

describe('setValueAt', () => {
  it("replaces api names with id for `path = ['fields']`", async () => {
    await docWithApiNames.setValueAt(['fields'], { apiName: { 'en-US': 'New content' } });
    expect(doc.getValueAt(['fields', 'id'])).toMatchObject({ 'en-US': 'New content' });
  });

  it("replaces api names with id for `path = ['fields', 'apiName']`", async () => {
    await docWithApiNames.setValueAt(['fields', 'apiName'], { 'en-US': 'New content' });
    expect(doc.getValueAt(['fields', 'id'])).toMatchObject({ 'en-US': 'New content' });
  });

  it("replaces api names with id for `path = ['fields', 'apiName', 'en-US']`", () => {
    docWithApiNames.setValueAt(['fields', 'apiName', 'en-US'], 'New content');
    expect(doc.getValueAt(['fields', 'id', 'en-US'])).toBe('New content');
  });

  it("replaces api names with id for `path = ['fields', 'apiName', 'de-DE']`", () => {
    docWithApiNames.setValueAt(['fields', 'apiName', 'de-DE'], 'New content');
    expect(doc.getValueAt(['fields', 'id', 'en-US'])).toBe('New content');
  });

  it('fails if setting field id', async () => {
    await expect(
      docWithApiNames.setValueAt(['fields', 'id'], { 'en-US': 'New content' })
    ).rejects.toBeTruthy();
    expect(doc.getValueAt(['fields', 'id'])).toMatchObject({ 'en-US': 'Old content' });
  });
});

describe('insertValueAt', () => {
  it("replaces api names with id for `path = ['fields', 'arrayApiName', 'en-US']`", async () => {
    await docWithApiNames.insertValueAt(['fields', 'arrayApiName', 'en-US'], 1, 'three');
    expect(doc.getValueAt(['fields', 'arrayId', 'en-US'])).toStrictEqual(['one', 'three', 'two']);
  });

  it("replaces api names with id for `path = ['fields', 'arrayApiName', 'de-DE']`", async () => {
    await docWithApiNames.insertValueAt(['fields', 'arrayApiName', 'de-DE'], 1, 'three');
    expect(doc.getValueAt(['fields', 'arrayId', 'en-US'])).toStrictEqual(['one', 'three', 'two']);
  });

  it('fails if setting field id', async () => {
    await expect(
      docWithApiNames.insertValueAt(['fields', 'arrayId', 'en-US'], 1, 'three')
    ).rejects.toBeTruthy();
    expect(doc.getValueAt(['fields', 'arrayId', 'en-US'])).toStrictEqual(['one', 'two']);
  });
});

describe('pushValueAt', () => {
  it("replaces api names with id for `path = ['fields', 'arrayApiName', 'en-US']`", async () => {
    await docWithApiNames.pushValueAt(['fields', 'arrayApiName', 'en-US'], 'three');
    expect(doc.getValueAt(['fields', 'arrayId', 'en-US'])).toStrictEqual(['one', 'two', 'three']);
  });

  it('fails if setting field id', async () => {
    await expect(
      docWithApiNames.pushValueAt(['fields', 'arrayId', 'en-US'], 'three')
    ).rejects.toBeTruthy();
    expect(doc.getValueAt(['fields', 'arrayId', 'en-US'])).toStrictEqual(['one', 'two']);
  });
});

describe('removeValueAt', () => {
  it("replaces api names with id for `path = ['fields', 'arrayApiName', 'en-US']`", async () => {
    await docWithApiNames.removeValueAt(['fields', 'apiName', 'en-US']);
    expect(doc.getValueAt(['fields', 'id', 'en-US'])).toBeUndefined();
  });

  it('fails if setting field id', async () => {
    await expect(
      docWithApiNames.removeValueAt(['fields', 'arrayId', 'en-US'])
    ).rejects.toBeTruthy();
    expect(doc.getValueAt(['fields', 'arrayId', 'en-US'])).not.toBeUndefined();
  });
});

describe('on', () => {
  it('triggers callback for changes to a field', async () => {
    const cb = jest.fn();
    docWithApiNames.on('entityChanged', cb);
    cb.mockReset();

    await doc.setValueAt(['fields', 'id', 'en-US'], 'new content');
    expect(cb).toBeCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: expect.objectContaining({
          apiName: { 'en-US': 'new content' },
        }),
      })
    );
  });
});

describe('data$', () => {
  it('streams changes to a field', async () => {
    const onValue = jest.fn();
    docWithApiNames.data$.observe(onValue);
    onValue.mockReset();

    await doc.setValueAt(['fields', 'id', 'en-US'], 'new content');
    expect(onValue).toBeCalledTimes(1);
    expect(onValue).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: expect.objectContaining({
          apiName: { 'en-US': 'new content' },
        }),
      })
    );
  });
});

describe('changes', () => {
  it('streams changed paths when changing a field', async () => {
    const onValue = jest.fn();
    docWithApiNames.changes.observe(onValue);
    onValue.mockReset();

    await doc.setValueAt(['fields', 'id', 'en-US'], 'new content');
    expect(onValue).toBeCalledTimes(1);
    expect(onValue).toHaveBeenCalledWith(['fields', 'apiName', 'en-US']);
  });
});
