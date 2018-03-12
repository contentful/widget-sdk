/* eslint-disable quotes */

/**
 * @description This file exports missing fields for TEA during space template cloning
 * We get information about cloned spaces using CDA, and it means we are missing:
 * 1. description of content types
 * 2. fields' validations of content types
 * 3. editing interfaces (appearance - e.g. slug editor or url editor)
 *
 * This file is generated from exported JSON from TEA space:
 * https://github.com/contentful/content-models/blob/master/the-example-app/contentful-export.json
 * or specific commit - https://github.com/contentful/content-models/blob/25a53799b0b680326a868faf72cb1b59589b2855/the-example-app/contentful-export.json
 *
 * We pick description and validations of content types, and editing interfaces for all fields.
 * Ideally, this file should not change (maybe just slightly), and even in case of changes,
 * breaking changes are almost 100% excluded (because we use this template a lot to power example apps).
 *
 * This file was created using version of the JSON from 1 Feb.
 *
 * You can generate it by yourself using the following code:

 ```js
// original JSON file
const teaJSON = require('./exported-tes-json');
const {omit} = require('lodash');

const newContentTypes = teaJSON.contentTypes.reduce((contentTypes, contentType) => {
  return Object.assign({}, contentTypes, {
    [contentType.sys.id]: {
      description: contentType.description,
      validations: contentType.fields.reduce((validations, field) => {
        return field.validations && field.validations.length
          ? Object.assign({}, validations, {
            [field.id]: field.validations
          })
          : validations;
      }, {})
    }
  });
}, {});

const res = {
  contentTypes: newContentTypes,
  editorInterfaces: teaJSON.editorInterfaces.map(editingInterface => {
    return {
      sys: omit(editingInterface.sys, ['space', 'version', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy']),
      controls: editingInterface.controls
    };
  })
};

console.log(JSON.stringify(res, null, 2));
```

And then run it:

```sh
node process.js > processed-tea.json
```
 */

export default {
  "contentTypes": {
    "category": {
      "description": "Categories can be applied to Courses and Lessons. Assigning Multiple categories is also possible.",
      "validations": {
        "slug": [
          {
            "unique": true
          }
        ]
      }
    },
    "lessonImage": {
      "description": "An image to be used as a module in a lesson.",
      "validations": {
        "title": [
          {
            "regexp": {
              "pattern": ".+>.+",
              "flags": null
            },
            "message": "For module titles, please use the form parent > description as this title is internal only and helps to identify the module."
          }
        ]
      }
    },
    "lessonCopy": {
      "description": "A markdown module to be used in a lesson.",
      "validations": {
        "title": [
          {
            "regexp": {
              "pattern": ".+>.+",
              "flags": null
            },
            "message": "Use the title format \"Topic name > keyword description\"."
          }
        ]
      }
    },
    "lesson": {
      "description": "A educational lesson, representing one section of a course.",
      "validations": {
        "slug": [
          {
            "unique": true
          }
        ]
      }
    },
    "layout": {
      "description": "A page consisting of freely configurable and rearrangeable content modules.",
      "validations": {
        "slug": [
          {
            "unique": true
          }
        ]
      }
    },
    "lessonCodeSnippets": {
      "description": "A code snippet module supporting all platforms to be used in a lesson.",
      "validations": {
        "title": [
          {
            "regexp": {
              "pattern": ".+>.+",
              "flags": null
            },
            "message": "Use the title format \"Topic name > keyword description\"."
          }
        ]
      }
    },
    "course": {
      "description": "A series of lessons designed to teach sets of concepts that enable students to master Contentful.",
      "validations": {
        "skillLevel": [
          {
            "in": [
              "beginner",
              "intermediate",
              "advanced"
            ]
          }
        ]
      }
    },
    "layoutCopy": {
      "description": "A block of text with a headline and a call to action to be shown on the landing page.",
      "validations": {
        "title": [
          {
            "regexp": {
              "pattern": ".+>.+",
              "flags": null
            },
            "message": "Use the title format \"Topic name > keyword description\"."
          }
        ],
        "ctaTitle": [
          {
            "size": {
              "min": 3,
              "max": 25
            }
          }
        ],
        "ctaLink": [
          {
            "regexp": {
              "pattern": "^(ftp|http|https):\\/\\/(\\w+:{0,1}\\w*@)?(\\S+)(:[0-9]+)?(\\/|\\/([\\w#!:.?+=&%@!\\-\\/]))?$"
            }
          }
        ],
        "visualStyle": [
          {
            "in": [
              "Default",
              "Emphasized"
            ]
          }
        ]
      }
    },
    "layoutHeroImage": {
      "description": "A hero image and header text.",
      "validations": {
        "title": [
          {
            "regexp": {
              "pattern": ".+>.+",
              "flags": null
            },
            "message": "Use the title format \"Topic name > keyword description\"."
          }
        ]
      }
    },
    "layoutHighlightedCourse": {
      "description": "A curated selection of highlighted courses.",
      "validations": {
        "title": [
          {
            "regexp": {
              "pattern": ".+>.+",
              "flags": null
            },
            "message": "Use the title format \"Topic name > keyword description\"."
          }
        ],
        "course": [
          {
            "linkContentType": [
              "course"
            ]
          }
        ]
      }
    }
  },
  "editorInterfaces": [
    {
      "sys": {
        "id": "default",
        "type": "EditorInterface",
        "contentType": {
          "sys": {
            "id": "category",
            "type": "Link",
            "linkType": "ContentType"
          }
        }
      },
      "controls": [
        {
          "fieldId": "title",
          "settings": {
            "helpText": "The name of the category; also the title for content editors to find entries in Contentful."
          },
          "widgetId": "singleLine"
        },
        {
          "fieldId": "slug",
          "settings": {
            "helpText": "An autogenerated url-safe and human-readable identifier for this category."
          },
          "widgetId": "slugEditor"
        }
      ]
    },
    {
      "sys": {
        "id": "default",
        "type": "EditorInterface",
        "contentType": {
          "sys": {
            "id": "lessonImage",
            "type": "Link",
            "linkType": "ContentType"
          }
        }
      },
      "controls": [
        {
          "fieldId": "title",
          "widgetId": "singleLine"
        },
        {
          "fieldId": "image",
          "widgetId": "assetLinkEditor"
        },
        {
          "fieldId": "caption",
          "widgetId": "singleLine"
        }
      ]
    },
    {
      "sys": {
        "id": "default",
        "type": "EditorInterface",
        "contentType": {
          "sys": {
            "id": "lessonCopy",
            "type": "Link",
            "linkType": "ContentType"
          }
        }
      },
      "controls": [
        {
          "fieldId": "title",
          "widgetId": "singleLine"
        },
        {
          "fieldId": "copy",
          "widgetId": "markdown"
        }
      ]
    },
    {
      "sys": {
        "id": "default",
        "type": "EditorInterface",
        "contentType": {
          "sys": {
            "id": "lesson",
            "type": "Link",
            "linkType": "ContentType"
          }
        }
      },
      "controls": [
        {
          "fieldId": "title",
          "settings": {
            "helpText": "The name of the lesson; also the title for content editors to find entries in Contentful."
          },
          "widgetId": "singleLine"
        },
        {
          "fieldId": "slug",
          "settings": {
            "helpText": "An autogenerated url-safe and human-readable identifier for this lesson."
          },
          "widgetId": "slugEditor"
        },
        {
          "fieldId": "modules",
          "settings": {
            "helpText": "Rearrangeable modules that contain the content of this lesson.",
            "bulkEditing": true
          },
          "widgetId": "entryLinksEditor"
        }
      ]
    },
    {
      "sys": {
        "id": "default",
        "type": "EditorInterface",
        "contentType": {
          "sys": {
            "id": "layout",
            "type": "Link",
            "linkType": "ContentType"
          }
        }
      },
      "controls": [
        {
          "fieldId": "title",
          "settings": {
            "helpText": "The name of the landing page; also the title for content editors to find entries in Contentful."
          },
          "widgetId": "singleLine"
        },
        {
          "fieldId": "slug",
          "settings": {
            "helpText": "An autogenerated url-safe and human-readable identifier for this landing page."
          },
          "widgetId": "slugEditor"
        },
        {
          "fieldId": "contentModules",
          "settings": {
            "helpText": "Rearrangeable content chunks representing the actual content of this landing page",
            "bulkEditing": true
          },
          "widgetId": "entryLinksEditor"
        }
      ]
    },
    {
      "sys": {
        "id": "default",
        "type": "EditorInterface",
        "contentType": {
          "sys": {
            "id": "lessonCodeSnippets",
            "type": "Link",
            "linkType": "ContentType"
          }
        }
      },
      "controls": [
        {
          "fieldId": "title",
          "settings": {
            "helpText": "The title for content editors to find entries in Contentful. It is not necessarily relevant for display in connected applications."
          },
          "widgetId": "singleLine"
        },
        {
          "fieldId": "curl",
          "widgetId": "markdown"
        },
        {
          "fieldId": "dotNet",
          "widgetId": "markdown"
        },
        {
          "fieldId": "javascript",
          "widgetId": "markdown"
        },
        {
          "fieldId": "java",
          "widgetId": "markdown"
        },
        {
          "fieldId": "javaAndroid",
          "widgetId": "markdown"
        },
        {
          "fieldId": "php",
          "widgetId": "markdown"
        },
        {
          "fieldId": "python",
          "widgetId": "markdown"
        },
        {
          "fieldId": "ruby",
          "widgetId": "markdown"
        },
        {
          "fieldId": "swift",
          "widgetId": "markdown"
        }
      ]
    },
    {
      "sys": {
        "id": "default",
        "type": "EditorInterface",
        "contentType": {
          "sys": {
            "id": "course",
            "type": "Link",
            "linkType": "ContentType"
          }
        }
      },
      "controls": [
        {
          "fieldId": "title",
          "settings": {
            "helpText": "The name of the course; also the title for content editors to find entries in Contentful."
          },
          "widgetId": "singleLine"
        },
        {
          "fieldId": "slug",
          "settings": {
            "helpText": "An autogenerated url-safe and human-readable identifier for this course."
          },
          "widgetId": "slugEditor"
        },
        {
          "fieldId": "image",
          "settings": {
            "helpText": "This image will be used for teasing the content within the app itself, search engines and on social media."
          },
          "widgetId": "assetLinkEditor"
        },
        {
          "fieldId": "shortDescription",
          "settings": {
            "helpText": "A condensed description, useful for displaying in list views."
          },
          "widgetId": "singleLine"
        },
        {
          "fieldId": "description",
          "settings": {
            "helpText": "The copy giving an overview of the course."
          },
          "widgetId": "markdown"
        },
        {
          "fieldId": "duration",
          "settings": {
            "helpText": "The duration, in minutes, it takes to finish this course."
          },
          "widgetId": "numberEditor"
        },
        {
          "fieldId": "skillLevel",
          "settings": {
            "helpText": "The target audiences' level in the learning journey that this course is designed for."
          },
          "widgetId": "dropdown"
        },
        {
          "fieldId": "lessons",
          "settings": {
            "helpText": "The lessons this course consists of.",
            "bulkEditing": false
          },
          "widgetId": "entryLinksEditor"
        },
        {
          "fieldId": "categories",
          "settings": {
            "helpText": "Specify the categories the course belongs to.",
            "bulkEditing": false
          },
          "widgetId": "entryCardsEditor"
        }
      ]
    },
    {
      "sys": {
        "id": "default",
        "type": "EditorInterface",
        "contentType": {
          "sys": {
            "id": "layoutCopy",
            "type": "Link",
            "linkType": "ContentType"
          }
        }
      },
      "controls": [
        {
          "fieldId": "title",
          "settings": {
            "helpText": "The title for content editors to find entries in Contentful. It is not necessarily relevant for display in connected applications."
          },
          "widgetId": "singleLine"
        },
        {
          "fieldId": "headline",
          "settings": {
            "helpText": "The short, emphasized headline of this copy module."
          },
          "widgetId": "singleLine"
        },
        {
          "fieldId": "copy",
          "settings": {
            "helpText": "The main textual content of this copy module."
          },
          "widgetId": "markdown"
        },
        {
          "fieldId": "ctaTitle",
          "settings": {
            "helpText": "The title to be set on the Call to Action button."
          },
          "widgetId": "singleLine"
        },
        {
          "fieldId": "ctaLink",
          "settings": {
            "helpText": "The link which the call to action directs your user to."
          },
          "widgetId": "urlEditor"
        },
        {
          "fieldId": "visualStyle",
          "settings": {
            "helpText": "The visual styling configuration for this module."
          },
          "widgetId": "dropdown"
        }
      ]
    },
    {
      "sys": {
        "id": "default",
        "type": "EditorInterface",
        "contentType": {
          "sys": {
            "id": "layoutHeroImage",
            "type": "Link",
            "linkType": "ContentType"
          }
        }
      },
      "controls": [
        {
          "fieldId": "title",
          "settings": {
            "helpText": "The title for content editors to find entries in Contentful. It is not necessarily relevant for display in connected applications."
          },
          "widgetId": "singleLine"
        },
        {
          "fieldId": "headline",
          "settings": {
            "helpText": "The short, emphasized headline of this hero module. An optional field."
          },
          "widgetId": "singleLine"
        },
        {
          "fieldId": "backgroundImage",
          "settings": {
            "helpText": "Full-size hero image displayed behind the headline."
          },
          "widgetId": "assetLinkEditor"
        }
      ]
    },
    {
      "sys": {
        "id": "default",
        "type": "EditorInterface",
        "contentType": {
          "sys": {
            "id": "layoutHighlightedCourse",
            "type": "Link",
            "linkType": "ContentType"
          }
        }
      },
      "controls": [
        {
          "fieldId": "title",
          "settings": {
            "helpText": "The title for content editors to find entries in Contentful. It is not necessarily relevant for display in connected applications."
          },
          "widgetId": "singleLine"
        },
        {
          "fieldId": "course",
          "settings": {
            "helpText": "A curated selection of highlighted courses."
          },
          "widgetId": "entryLinkEditor"
        }
      ]
    }
  ]
};
