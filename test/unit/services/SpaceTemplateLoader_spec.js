'use strict';

describe('Space Template loading service', () => {
  const sourceContentTypes = [
    {
      sys: {
        id: '68VvdXqINiM0MCoqwa8CQC',
        revision: 1,
        type: 'ContentType',
        locale: 'en-US',
        createdAt: '2014-12-03T16:31:33.179Z',
        updatedAt: '2014-12-03T16:31:51.674Z',
        space: {
          sys: {
            id: '4o9zrkqge2wv',
            type: 'Link',
            linkType: 'Space'
          }
        }
      },
      fields: [
        {
          name: 'Name',
          id: 'name',
          type: 'Text',
          required: true
        }
      ],
      name: 'Category',
      displayField: 'name'
    },
    {
      sys: {
        id: '1Lkju6MyzqSIcwEaAOeM4s',
        revision: 4,
        type: 'ContentType',
        locale: 'en-US',
        createdAt: '2014-12-03T16:30:13.990Z',
        updatedAt: '2014-12-04T11:36:31.381Z',
        space: {
          sys: {
            id: '4o9zrkqge2wv',
            type: 'Link',
            linkType: 'Space'
          }
        }
      },
      fields: [
        {
          name: 'Title',
          id: 'title',
          type: 'Text',
          required: true,
          localized: true
        },
        {
          name: 'Content',
          id: 'content',
          type: 'Text',
          localized: true
        },
        {
          name: 'Category',
          id: 'category',
          type: 'Link',
          linkType: 'Entry'
        },
        {
          name: 'Image',
          id: 'image',
          type: 'Link',
          linkType: 'Asset'
        }
      ],
      name: 'Post',
      displayField: 'title'
    }
  ];

  const sourceEntries = [
    {
      sys: {
        id: '4Gwo3bNWc8UW2ycWiswGsM',
        revision: 2,
        type: 'Entry',
        contentType: {
          sys: {
            id: '1Lkju6MyzqSIcwEaAOeM4s',
            type: 'Link',
            linkType: 'ContentType'
          }
        },
        createdAt: '2014-12-04T11:41:06.595Z',
        updatedAt: '2014-12-04T11:41:43.968Z',
        space: {
          sys: {
            id: '4o9zrkqge2wv',
            type: 'Link',
            linkType: 'Space'
          }
        }
      },
      fields: {
        content: { 'en-US': '...' },
        title: { 'en-US': 'Lick butt jump off balcony, onto stranger head' },
        category: {
          'en-US': {
            sys: {
              id: '5AMisZG9BmqqYWge0Acmik',
              revision: 1,
              type: 'Entry',
              locale: 'en-US',
              contentType: {
                sys: {
                  id: '68VvdXqINiM0MCoqwa8CQC',
                  type: 'Link',
                  linkType: 'ContentType'
                }
              },
              createdAt: '2014-12-04T11:37:12.087Z',
              updatedAt: '2014-12-04T11:37:19.040Z',
              space: {
                sys: {
                  id: '4o9zrkqge2wv',
                  type: 'Link',
                  linkType: 'Space'
                }
              }
            },
            fields: {
              name: 'Animals'
            }
          }
        },
        image: {
          'en-US': {
            sys: {
              id: '1C0dHUP04kAgYwm0G2WiQE',
              revision: 1,
              type: 'Asset',
              locale: 'en-US',
              createdAt: '2014-12-04T11:36:53.762Z',
              updatedAt: '2014-12-04T11:36:54.708Z',
              space: {
                sys: {
                  id: '4o9zrkqge2wv',
                  type: 'Asset'
                }
              }
            },
            fields: {
              file: {
                fileName: 'soon-cat-pillows.jpeg',
                contentType: 'image/jpeg',
                details: {
                  image: {
                    width: 258,
                    height: 196
                  },
                  size: 5923
                },
                url:
                  '//images.contentful.com/4o9zrkqge2wv/1C0dHUP04kAgYwm0G2WiQE/7e5ddcdeac0c632e6f19780c35dd55a9/soon-cat-pillows.jpeg'
              },
              title: 'soon-cat-pillows'
            }
          }
        }
      }
    },

    {
      sys: {
        id: '6kMpB6YZz2EeEuqYMqYQaM',
        revision: 2,
        type: 'Entry',
        contentType: {
          sys: {
            id: '1v2MUtzrg8oQAw0ogCwwE8',
            type: 'Link',
            linkType: 'ContentType'
          }
        },
        createdAt: '2014-12-04T16:44:42.603Z',
        updatedAt: '2014-12-04T16:53:08.092Z',
        space: {
          sys: {
            id: '4o9zrkqge2wv',
            type: 'Link',
            linkType: 'Space'
          }
        }
      },
      fields: {
        text: { 'en-US': 'akshdljashdlaihsd' },
        symbol: { 'en-US': 'content' },
        number: { 'en-US': 2 },
        decimal: { 'en-US': 2.2 },
        bool: { 'en-US': true },
        cal: { 'en-US': '2014-12-11T12:00+03:00' },
        loc: {
          'en-US': {
            lat: 51.08282186160978,
            lon: 8.600234985351562
          }
        },
        entry: {
          'en-US': {
            sys: {
              id: '5AMisZG9BmqqYWge0Acmik',
              revision: 1,
              type: 'Entry',
              locale: 'en-US',
              contentType: {
                sys: {
                  id: '68VvdXqINiM0MCoqwa8CQC',
                  type: 'Link',
                  linkType: 'ContentType'
                }
              },
              createdAt: '2014-12-04T11:37:12.087Z',
              updatedAt: '2014-12-04T11:37:19.040Z',
              space: {
                sys: {
                  id: '4o9zrkqge2wv',
                  type: 'Link',
                  linkType: 'Space'
                }
              }
            },
            fields: {
              name: 'Animals'
            }
          }
        },
        asset: {
          'en-US': {
            sys: {
              id: '5o4iPgRgYMmaGac8SckKCc',
              revision: 0,
              type: 'Asset',
              locale: 'en-US',
              createdAt: '2014-12-04T11:36:53.850Z',
              updatedAt: '2014-12-04T11:36:54.718Z',
              space: {
                sys: {
                  id: '4o9zrkqge2wv',
                  type: 'Link',
                  linkType: 'Space'
                }
              }
            },
            fields: {
              file: {
                fileName: 'soon-horse.jpg',
                contentType: 'image/jpeg',
                details: {
                  image: {
                    width: 400,
                    height: 279
                  },
                  size: 89415
                },
                url:
                  '//images.contentful.com/4o9zrkqge2wv/5o4iPgRgYMmaGac8SckKCc/ab03f95234ce91a878e27408192d35b5/soon-horse.jpg'
              },
              title: 'soon-horse'
            }
          }
        },
        obj: { 'en-US': { value: 123 } },
        entries: {
          'en-US': [
            {
              sys: {
                id: 'pBTk6jJsoSaWmCic0OAeO',
                revision: 1,
                type: 'Entry',
                locale: 'en-US',
                contentType: {
                  sys: {
                    id: '68VvdXqINiM0MCoqwa8CQC',
                    type: 'Link',
                    linkType: 'ContentType'
                  }
                },
                createdAt: '2014-12-04T11:37:26.526Z',
                updatedAt: '2014-12-04T11:37:30.896Z',
                space: {
                  sys: {
                    id: '4o9zrkqge2wv',
                    type: 'Link',
                    linkType: 'Space'
                  }
                }
              },
              fields: {
                name: 'Memes'
              }
            }
          ]
        },
        assets: {
          'en-US': [
            {
              sys: {
                id: '1GdRqUQ0V2yCU2Ee00eoq6',
                revision: 0,
                type: 'Asset',
                locale: 'en-US',
                createdAt: '2014-12-04T11:36:53.827Z',
                updatedAt: '2014-12-04T11:36:55.028Z',
                space: {
                  sys: {
                    id: '4o9zrkqge2wv',
                    type: 'Link',
                    linkType: 'Space'
                  }
                }
              },
              fields: {
                file: {
                  fileName: 'soon-cat-parrot.jpeg',
                  contentType: 'image/jpeg',
                  details: {
                    image: {
                      width: 350,
                      height: 230
                    },
                    size: 47757
                  },
                  url:
                    '//images.contentful.com/4o9zrkqge2wv/1GdRqUQ0V2yCU2Ee00eoq6/8a20a9aaf3ef74fc0fd5b3656e6bb975/soon-cat-parrot.jpeg'
                },
                title: 'soon-cat-parrot'
              }
            }
          ]
        },
        symbolList: { 'en-US': ['this', 'that', 'something'] }
      }
    },

    {
      sys: {
        id: '3rdct',
        revision: 1,
        type: 'Entry',
        contentType: {
          sys: {
            id: '1v2MUtzrg8oQAw0ogCwwE8',
            type: 'Link',
            linkType: 'ContentType'
          }
        }
      },
      fields: {
        entry: {
          'en-US': {
            sys: {
              id: '4thct',
              type: 'Entry',
              locale: 'en-US'
            }
          }
        },
        entries: {
          'en-US': [
            {
              sys: {
                id: '5thct',
                type: 'Entry',
                locale: 'en-US'
              }
            }
          ]
        }
      }
    },

    {
      sys: {
        id: '4thct',
        revision: 1,
        type: 'Entry',
        contentType: {
          sys: {
            id: '1v2MUtzrg8oQAw0ogCwwE8',
            type: 'Link',
            linkType: 'ContentType'
          }
        }
      },
      fields: {
        entry: {
          'en-US': {
            sys: {
              id: '5thct',
              type: 'Entry',
              locale: 'en-US'
            }
          }
        }
      }
    },

    {
      sys: {
        id: '5thct',
        revision: 1,
        type: 'Entry',
        contentType: {
          sys: {
            id: '1v2MUtzrg8oQAw0ogCwwE8',
            type: 'Link',
            linkType: 'ContentType'
          }
        }
      },
      fields: {}
    }
  ];

  const sourceAssets = [
    {
      sys: {
        id: '5o4iPgRgYMmaGac8SckKCc',
        revision: 0,
        type: 'Asset',
        createdAt: '2014-12-04T11:36:53.850Z',
        updatedAt: '2014-12-04T11:36:54.718Z',
        space: {
          sys: {
            id: '4o9zrkqge2wv',
            type: 'Link',
            linkType: 'Space'
          }
        }
      },
      fields: {
        file: {
          'en-US': {
            fileName: 'soon-horse.jpg',
            contentType: 'image/jpeg',
            details: {
              image: {
                width: 400,
                height: 279
              },
              size: 89415
            },
            url:
              '//images.contentful.com/4o9zrkqge2wv/5o4iPgRgYMmaGac8SckKCc/ab03f95234ce91a878e27408192d35b5/soon-horse.jpg'
          }
        },
        title: { 'en-US': 'soon-horse' }
      }
    },
    {
      sys: {
        id: '367wIzFbCwmWs6mQKeM6Mu',
        revision: 0,
        type: 'Asset',
        createdAt: '2014-12-04T11:36:53.794Z',
        updatedAt: '2014-12-04T11:36:54.632Z',
        space: {
          sys: {
            id: '4o9zrkqge2wv',
            type: 'Link',
            linkType: 'Space'
          }
        }
      },
      fields: {
        file: {
          'en-US': {
            fileName: 'soon-meme.jpg',
            contentType: 'image/jpeg',
            details: {
              image: {
                width: 500,
                height: 341
              },
              size: 26373
            },
            url:
              '//images.contentful.com/4o9zrkqge2wv/367wIzFbCwmWs6mQKeM6Mu/4f1c6ee48df8a13dc07552597cf99c48/soon-meme.jpg'
          }
        },
        title: { 'en-US': 'soon-meme' }
      }
    }
  ];

  const spaceData = {
    locales: [
      {
        default: true,
        code: 'en-US'
      }
    ]
  };

  beforeEach(function() {
    this.stubs = {
      newClient: sinon.stub()
    };

    module('contentful/test', $provide => {
      $provide.constant('contentfulClient', {
        newClient: this.stubs.newClient
      });
    });

    this.$rootScope = this.$inject('$rootScope');
    this.client = {
      contentTypes: sinon.stub(),
      entries: sinon.stub(),
      assets: sinon.stub(),
      space: sinon.stub()
    };

    this.stubs.newClient.returns(this.client);
    this.spaceTemplateLoader = this.$inject('services/SpaceTemplateLoader.es6');
  });

  afterEach(inject($log => {
    $log.assertEmpty();
  }));

  describe('gets template list from contentful', () => {
    beforeEach(function*() {
      this.client.entries.resolves([
        { fields: { id: 3, spaceId: 3 } },
        { fields: { id: 2, spaceId: 2, order: 1 } },
        { fields: { id: 1, spaceId: 1, order: 0 } }
      ]);
      this.returnedEntries = yield this.spaceTemplateLoader.getTemplatesList();
      this.$rootScope.$digest();
    });

    it('gets entries from client library', function() {
      sinon.assert.called(this.client.entries);
    });

    it('sorts entries by order field', function() {
      expect(this.returnedEntries[0].fields.id).toBe(1);
      expect(this.returnedEntries[1].fields.id).toBe(2);
      expect(this.returnedEntries[2].fields.id).toBe(3);
    });
  });

  describe('gets a template from contentful', () => {
    let template, templateInfo;

    beforeEach(function*() {
      templateInfo = {
        templateDeliveryApiKeys: [
          { fields: { name: 'first api key', description: 'first api key desc' } },
          { fields: { name: 'second api key', description: 'second api key desc' } }
        ]
      };

      this.client.contentTypes.returns(Promise.resolve(sourceContentTypes));
      this.client.entries.returns(Promise.resolve(sourceEntries));
      this.client.assets.returns(Promise.resolve(sourceAssets));
      this.client.space.returns(Promise.resolve(spaceData));

      yield this.spaceTemplateLoader.getTemplate(templateInfo).then(_template_ => {
        template = _template_;
      });
      this.$rootScope.$digest();
    });

    it('gets content types', function() {
      sinon.assert.called(this.client.contentTypes);
    });

    it('gets entries', function() {
      sinon.assert.called(this.client.entries);
    });

    it('gets assets', function() {
      sinon.assert.called(this.client.assets);
    });

    it('gets space', function() {
      sinon.assert.called(this.client.space);
    });

    it('returns a template', () => {
      expect(template).toBeDefined();
    });

    it('template has content types', () => {
      expect(template.contentTypes).toBeDefined();
    });

    it('template has entries', () => {
      expect(template.entries).toBeDefined();
    });

    it('template has assets', () => {
      expect(template.assets).toBeDefined();
    });

    it('first content type is formatted correctly', () => {
      expect(template.contentTypes[0]).toEqualObj({
        sys: {
          id: '68VvdXqINiM0MCoqwa8CQC'
        },
        fields: [
          {
            name: 'Name',
            id: 'name',
            type: 'Text',
            required: true
          }
        ],
        name: 'Category',
        displayField: 'name'
      });
    });

    it('second content type is formatted correctly', () => {
      expect(template.contentTypes[1]).toEqualObj({
        sys: {
          id: '1Lkju6MyzqSIcwEaAOeM4s'
        },
        fields: [
          {
            name: 'Title',
            id: 'title',
            type: 'Text',
            required: true,
            localized: true
          },
          {
            name: 'Content',
            id: 'content',
            type: 'Text',
            localized: true
          },
          {
            name: 'Category',
            id: 'category',
            type: 'Link',
            linkType: 'Entry'
          },
          {
            name: 'Image',
            id: 'image',
            type: 'Link',
            linkType: 'Asset'
          }
        ],
        name: 'Post',
        displayField: 'title'
      });
    });

    it('3rd entry has been reordered', () => {
      expect(template.entries[0].sys.id).toBe('3rdct');
    });

    it('4th entry has been reordered', () => {
      expect(template.entries[1].sys.id).toBe('4thct');
    });

    it('5th entry has been reordered', () => {
      expect(template.entries[2].sys.id).toBe('5thct');
    });

    it('first entry is formatted correctly', () => {
      expect(template.entries[4]).toEqualObj({
        sys: {
          id: '4Gwo3bNWc8UW2ycWiswGsM',
          contentType: {
            sys: {
              id: '1Lkju6MyzqSIcwEaAOeM4s'
            }
          }
        },
        fields: {
          content: { 'en-US': '...' },
          title: { 'en-US': 'Lick butt jump off balcony, onto stranger head' },
          category: {
            'en-US': {
              sys: {
                id: '5AMisZG9BmqqYWge0Acmik',
                type: 'Link',
                linkType: 'Entry'
              }
            }
          },
          image: {
            'en-US': {
              sys: {
                id: '1C0dHUP04kAgYwm0G2WiQE',
                type: 'Link',
                linkType: 'Asset'
              }
            }
          }
        }
      });
    });

    it('second entry is formatted correctly', () => {
      expect(template.entries[3]).toEqualObj({
        sys: {
          id: '6kMpB6YZz2EeEuqYMqYQaM',
          contentType: {
            sys: {
              id: '1v2MUtzrg8oQAw0ogCwwE8'
            }
          }
        },
        fields: {
          text: { 'en-US': 'akshdljashdlaihsd' },
          symbol: { 'en-US': 'content' },
          number: { 'en-US': 2 },
          decimal: { 'en-US': 2.2 },
          bool: { 'en-US': true },
          cal: { 'en-US': '2014-12-11T12:00+03:00' },
          loc: {
            'en-US': {
              lat: 51.08282186160978,
              lon: 8.600234985351562
            }
          },
          entry: {
            'en-US': {
              sys: {
                id: '5AMisZG9BmqqYWge0Acmik',
                type: 'Link',
                linkType: 'Entry'
              }
            }
          },
          asset: {
            'en-US': {
              sys: {
                id: '5o4iPgRgYMmaGac8SckKCc',
                type: 'Link',
                linkType: 'Asset'
              }
            }
          },
          obj: { 'en-US': { value: 123 } },
          entries: {
            'en-US': [
              {
                sys: {
                  id: 'pBTk6jJsoSaWmCic0OAeO',
                  type: 'Link',
                  linkType: 'Entry'
                }
              }
            ]
          },
          assets: {
            'en-US': [
              {
                sys: {
                  id: '1GdRqUQ0V2yCU2Ee00eoq6',
                  type: 'Link',
                  linkType: 'Asset'
                }
              }
            ]
          },
          symbolList: {
            'en-US': ['this', 'that', 'something']
          }
        }
      });
    });

    it('first asset is formatted correctly', () => {
      expect(template.assets[0]).toEqualObj({
        sys: {
          id: '5o4iPgRgYMmaGac8SckKCc'
        },
        fields: {
          title: {
            'en-US': 'soon-horse'
          },
          file: {
            'en-US': {
              fileName: 'soon-horse.jpg',
              contentType: 'image/jpeg',
              upload:
                'http://images.contentful.com/4o9zrkqge2wv/5o4iPgRgYMmaGac8SckKCc/ab03f95234ce91a878e27408192d35b5/soon-horse.jpg'
            }
          }
        }
      });
    });

    it('second asset is formatted correctly', () => {
      expect(template.assets[1]).toEqualObj({
        sys: {
          id: '367wIzFbCwmWs6mQKeM6Mu'
        },
        fields: {
          title: {
            'en-US': 'soon-meme'
          },
          file: {
            'en-US': {
              fileName: 'soon-meme.jpg',
              contentType: 'image/jpeg',
              upload:
                'http://images.contentful.com/4o9zrkqge2wv/367wIzFbCwmWs6mQKeM6Mu/4f1c6ee48df8a13dc07552597cf99c48/soon-meme.jpg'
            }
          }
        }
      });
    });

    it('has the first api key', () => {
      expect(template.apiKeys[0]).toEqualObj({
        name: 'first api key',
        description: 'first api key desc'
      });
    });

    it('has the second api key', () => {
      expect(template.apiKeys[1]).toEqualObj({
        name: 'second api key',
        description: 'second api key desc'
      });
    });

    it('template has space info', () => {
      expect(template.space).toBeDefined();
    });
  });
});
