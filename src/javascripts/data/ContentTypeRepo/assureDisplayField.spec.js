import assureDisplayField from './assureDisplayField.es6';

describe('assureDisplayField', () => {
  it('does not change valid display field', () => {
    const ct = {
      displayField: 'ID',
      fields: [
        {
          id: 'ID',
          type: 'Symbol'
        }
      ]
    };
    assureDisplayField(ct);
    expect(ct.displayField).toEqual('ID');
  });

  it('removes display field if field type cannot be displayed', () => {
    const ct = {
      displayField: 'ID',
      fields: [
        {
          id: 'ID',
          type: 'non displayable'
        }
      ]
    };
    assureDisplayField(ct);
    expect(ct.displayField).toBeUndefined();
  });

  it('removes display field if it points to missing field', () => {
    const ct = {
      displayField: 'ID',
      fields: [
        {
          id: 'ANOTHER ID',
          type: 'non displayable'
        }
      ]
    };
    assureDisplayField(ct);
    expect(ct.displayField).toBeUndefined();
  });

  it('changes invalid display field to first applicable field', () => {
    const ct = {
      displayField: 'ID',
      fields: [
        {
          id: 'FIRST ID',
          type: 'non displayable'
        },
        {
          id: 'SECOND ID',
          type: 'Symbol'
        },
        {
          id: 'THIRD ID',
          type: 'Symbol'
        }
      ]
    };
    assureDisplayField(ct);
    expect(ct.displayField).toEqual('SECOND ID');
  });

  it('retains null as value if no applicable field was found', () => {
    const ct = {
      displayField: null,
      fields: [
        {
          id: 'fieldid',
          type: 'non-displayable'
        }
      ]
    };
    assureDisplayField(ct);
    expect(ct.displayField).toBeNull();
  });
});
