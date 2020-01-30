import validateTargetState from './validateTargetState';

describe('validateTargetState', () => {
  it('accepts empty target states', () => {
    [null, undefined, {}, { EditorInterface: null }, { EditorInterface: [] }].forEach(
      targetState => {
        expect(() => validateTargetState(targetState)).not.toThrow();
      }
    );
  });

  it('rejects unknown entity types', () => {
    expect(() => validateTargetState({ WebhookDefinition: [] })).toThrow();
  });

  describe('controls validation', () => {
    it('accepts empty controls', () => {
      [[], undefined, null].forEach(controls => {
        expect(() => {
          validateTargetState({
            EditorInterface: {
              someCtId: { controls }
            }
          });
        }).not.toThrow();
      });
    });

    it('accepts controls for multiple CTs with defined field IDs', () => {
      expect(() => {
        validateTargetState({
          EditorInterface: {
            someCtId: {
              controls: [{ fieldId: 'title' }, { fieldId: 'hello-world' }]
            },
            otherCt: {
              controls: [{ fieldId: 'test' }]
            }
          }
        });
      }).not.toThrow();
    });

    it('rejects invalid controls', () => {
      [
        {}, // no field ID
        { fieldId: 123 }, // field ID not a string
        { fieldId: '' } // field ID is empty
      ].forEach(control => {
        expect(() => {
          validateTargetState({
            EditorInterface: {
              someCtId: { controls: [control] }
            }
          });
        }).toThrow();
      });
    });
  });

  describe('sidebar validation', () => {
    it('accepts empty sidebar', () => {
      [undefined, null].forEach(sidebar => {
        expect(() => {
          validateTargetState({
            EditorInterface: {
              someCtId: { sidebar }
            }
          });
        }).not.toThrow();
      });
    });

    it('accepts position for multiple CTs', () => {
      expect(() => {
        validateTargetState({
          EditorInterface: {
            someCtId: {
              sidebar: { position: 1 }
            },
            otherCt: {
              sidebar: { position: 7 }
            }
          }
        });
      }).not.toThrow();
    });

    it('accepts sidebar set to true', () => {
      expect(() => {
        validateTargetState({
          EditorInterface: {
            someCtId: { sidebar: true }
          }
        });
      }).not.toThrow();
    });

    it('rejects invalid sidebar', () => {
      [
        { position: 'TEST' }, // position is not a number
        { position: 1.23 }, // position is not an integer
        { position: -1 } // position is a negative number
      ].forEach(sidebar => {
        expect(() => {
          validateTargetState({
            EditorInterface: {
              someCtId: { sidebar }
            }
          });
        }).toThrow();
      });
    });
  });

  describe('editor validation', () => {
    it('accepts empty editor', () => {
      [null, undefined].forEach(editor => {
        expect(() => {
          validateTargetState({
            EditorInterface: {
              someCtId: { editor }
            }
          });
        }).not.toThrow();
      });
    });

    it('accepts editor set to true', () => {
      expect(() => {
        validateTargetState({
          EditorInterface: {
            someCtId: { editor: true }
          }
        });
      }).not.toThrow();
    });

    it('reject invalid editor', () => {
      expect(() => {
        validateTargetState({
          EditorInterface: {
            someCtId: { editor: 'BOOM' }
          }
        });
      }).toThrow();
    });
  });

  it('allows to define all properties on multiple CTs', () => {
    expect(() => {
      validateTargetState({
        EditorInterface: {
          someCtId: {
            fields: [{ fieldId: 'title' }, { fieldId: 'hello' }],
            editor: true
          },
          otherCt: {
            fields: [{ fieldId: 'author' }],
            sidebar: {
              position: 3
            }
          },
          yetAnotherCt: {
            sidebar: true,
            editor: true
          }
        }
      });
    }).not.toThrow();
  });
});
