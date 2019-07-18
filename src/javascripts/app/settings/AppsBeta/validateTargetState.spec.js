import validateTargetState from './validateTargetState.es6';

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

    it('accepts controls for multiple CTs with defined field IDs and settings', () => {
      expect(() => {
        validateTargetState({
          EditorInterface: {
            someCtId: {
              controls: [{ fieldId: 'title' }, { fieldId: 'hello-world', settings: { test: true } }]
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
        { settings: { test: true } }, // no field ID
        { fieldId: 123 }, // field ID not a string
        { fieldId: 'hello', settings: 'YOLO' } // settings not an object
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

    it('accepts position and settings for multiple CTs', () => {
      expect(() => {
        validateTargetState({
          EditorInterface: {
            someCtId: {
              sidebar: { settings: { test: true } }
            },
            otherCt: {
              sidebar: { position: 7, settings: { hello: 'world' } }
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
        { settings: 'YOLO' }, // settings are not an object
        { position: 'TEST' }, // position is not a number
        { position: 1.23 } // position is not an integer
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

    it('accepts settings for multiple CTs', () => {
      expect(() => {
        validateTargetState({
          EditorInterface: {
            someCtId: { editor: { settings: { test: true } } },
            otherCt: { editor: {} },
            yetAnotherCt: { editor: { settings: { hello: 'world' } } }
          }
        });
      }).not.toThrow();
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
            someCtId: { editor: { settings: 'BOO' } } // settings are not an object
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
            fields: [{ fieldId: 'title' }, { fieldId: 'hello', settings: { test: true } }],
            editor: true
          },
          otherCt: {
            fields: [{ fieldId: 'author' }],
            sidebar: {
              position: 3,
              settings: {
                num: 123,
                str: 'test'
              }
            }
          },
          yetAnotherCt: {
            sidebar: true,
            editor: { settings: { hello: 'world' } }
          }
        }
      });
    }).not.toThrow();
  });
});
