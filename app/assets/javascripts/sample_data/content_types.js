angular.module('contentful').constant('sampleContentTypes', {
  'sys': {
    'type': 'Array'
  },
  'total': 7,
  'skip': 0,
  'limit': 100,
  'items': [
    {
      'fields': [
        {
          'id': 'title',
          'name': 'Title',
          'type': 'Text',
          'required': true,
          'localized': false
        },
        {
          'id': 'ingredients',
          'name': 'Ingredients',
          'type': 'Array',
          'required': true,
          'localized': false,
          'items': {
            'type': 'Symbol'
          }
        },
        {
          'id': 'difficultyLevel',
          'name': 'Difficulty Level',
          'type': 'Integer',
          'required': false,
          'localized': false,
          'validations': [
            {
              'range': {
                'min': 1,
                'max': 10
              }
            }
          ]
        },
        {
          'id': 'serves',
          'name': 'Serves',
          'type': 'Integer',
          'required': true,
          'localized': false,
          'validations': [
            {
              'range': {
                'min': 1,
                'max': 4
              }
            }
          ]
        },
        {
          'id': 'preparation',
          'name': 'Preparation',
          'type': 'Text',
          'required': false,
          'localized': false
        },
        {
          'id': 'vegetarian',
          'name': 'Vegetarian',
          'type': 'Boolean',
          'required': false,
          'localized': false
        },
        {
          'id': 'lactose',
          'name': 'Lactose',
          'type': 'Boolean',
          'required': false,
          'localized': false
        },
        {
          'id': 'gluten',
          'name': 'Gluten',
          'type': 'Boolean',
          'required': false,
          'localized': false
        },
        {
          'id': 'calories',
          'name': 'Calories Per Person',
          'type': 'Integer',
          'required': false,
          'localized': false
        }
      ],
      'name': 'Recipe',
      'sys': {
        'space': {
          'sys': {
            'type': 'Link',
            'linkType': 'Space',
            'id': 'tjsdbq1gy9z7'
          }
        },
        'type': 'ContentType',
        'id': 'ChmjetmPAsGem6s4gSKWq',
        'revision': 3,
        'createdAt': '2013-06-19T08:12:05.323Z',
        'updatedAt': '2013-06-19T08:14:03.113Z'
      },
      'description': 'Simple recipes to make your life easier.',
      'displayField': 'title'
    },
    {
      'fields': [
        {
          'id': 'title',
          'name': 'Title',
          'type': 'Text',
          'required': true,
          'localized': false
        },
        {
          'id': 'question',
          'name': 'Question',
          'type': 'Text',
          'required': true,
          'localized': false
        },
        {
          'id': 'level',
          'name': 'Level',
          'type': 'Integer',
          'required': true,
          'localized': false,
          'validations': [
            {
              'range': {
                'min': 1,
                'max': 15
              }
            }
          ]
        },
        {
          'id': 'answer1',
          'name': 'Answer 1',
          'type': 'Text',
          'required': true,
          'localized': false
        },
        {
          'id': 'answer2',
          'name': 'Answer 2',
          'type': 'Text',
          'required': true,
          'localized': false
        },
        {
          'id': 'answer3',
          'name': 'Answer 3',
          'type': 'Text',
          'required': true,
          'localized': false
        },
        {
          'id': 'answer4',
          'name': 'Answer 4',
          'type': 'Text',
          'required': true,
          'localized': false
        },
        {
          'id': 'tag',
          'name': 'Tag',
          'type': 'Symbol',
          'required': true,
          'localized': false,
          'validations': [
            {
              'size': {
                'min': 3,
                'max': 11
              }
            }
          ]
        },
        {
          'id': 'prize',
          'name': 'Prize',
          'type': 'Number',
          'required': false,
          'localized': false
        },
        {
          'id': 'currency',
          'name': 'Currency',
          'type': 'Symbol',
          'required': false,
          'localized': false,
          'validations': [
            {
              'size': {
                'min': 3,
                'max': 3
              }
            }
          ]
        },
        {
          'id': 'correctAnswer',
          'name': 'Correct Answer',
          'type': 'Integer',
          'required': true,
          'localized': false
        }
      ],
      'name': 'Quiz Question',
      'sys': {
        'space': {
          'sys': {
            'type': 'Link',
            'linkType': 'Space',
            'id': 'tjsdbq1gy9z7'
          }
        },
        'type': 'ContentType',
        'id': '6Ku1uo32lqMYieci6ocUCs',
        'revision': 2,
        'createdAt': '2013-06-19T08:37:51.089Z',
        'updatedAt': '2013-06-19T08:40:27.427Z'
      },
      'description': 'Quiz questions for your entertainment',
      'displayField': 'title'
    },
    {
      'fields': [
        {
          'id': 'title',
          'name': 'Title',
          'type': 'Text',
          'required': true,
          'localized': false,
          'validations': [
            {'size': {'min': 0, 'max': 200}}
          ]
        },
        {
          'id': 'author',
          'name': 'Author',
          'type': 'Text',
          'required': false,
          'localized': false
        },
        {
          'id': 'post',
          'name': 'Post',
          'type': 'Text',
          'required': true,
          'localized': false
        },
        {
          'id': 'originalLink',
          'name': 'Original Link',
          'type': 'Text',
          'required': false,
          'localized': false
        },
        {
          'id': 'date',
          'name': 'Date',
          'type': 'Date',
          'required': true,
          'localized': false
        },
        {
          'id': 'tags',
          'name': 'Tags',
          'type': 'Array',
          'required': false,
          'localized': false,
          'items': {
            'type': 'Symbol'
          },
          'disabled': true
        },
        {
          'id': 'relatesPosts',
          'name': 'Related Posts',
          'type': 'Array',
          'required': false,
          'localized': false,
          'items': {
            'type': 'Link',
            'validations': [
              {'linkContentType': '7rpL7xxWykaMkuoWicgiKC'}
            ]
          }
        }
      ],
      'name': 'Blog Post',
      'sys': {
        'space': {
          'sys': {
            'type': 'Link',
            'linkType': 'Space',
            'id': 'tjsdbq1gy9z7'
          }
        },
        'type': 'ContentType',
        'id': '7rpL7xxWykaMkuoWicgiKC',
        'revision': 4,
        'createdAt': '2013-06-19T08:20:54.936Z',
        'updatedAt': '2013-06-19T08:26:54.201Z'
      },
      'description': 'Simple blog posts',
      'displayField': 'title'
    },
    {
      'fields': [
        {
          'id': 'title',
          'name': 'Title',
          'type': 'Text',
          'required': true,
          'localized': false
        },
        {
          'id': 'subtitle',
          'name': 'Subtitle',
          'type': 'Text',
          'required': false,
          'localized': false
        },
        {
          'id': 'lessonNumber',
          'name': 'Lesson Number',
          'type': 'Integer',
          'required': false,
          'localized': false
        },
        {
          'id': 'packNumber',
          'name': 'Pack Number',
          'type': 'Integer',
          'required': false,
          'localized': false
        },
        {
          'id': 'instructions',
          'name': 'Instructions',
          'type': 'Text',
          'required': false,
          'localized': false
        },
        {
          'id': 'difficulty',
          'name': 'Difficulty',
          'type': 'Integer',
          'required': false,
          'localized': false
        },
        {
          'id': 'featured',
          'name': 'Featured',
          'type': 'Boolean',
          'required': false,
          'localized': false
        }
      ],
      'name': 'Online Class',
      'sys': {
        'space': {
          'sys': {
            'type': 'Link',
            'linkType': 'Space',
            'id': 'tjsdbq1gy9z7'
          }
        },
        'type': 'ContentType',
        'id': '110jgloQOOqagEKAWw8Oeo',
        'revision': 2,
        'createdAt': '2013-06-19T09:00:58.026Z',
        'updatedAt': '2013-06-19T09:01:47.142Z'
      },
      'description': 'Online classes to kill your curiosity',
      'displayField': 'title'
    },
    {
      'fields': [
        {
          'id': 'name',
          'name': 'Name',
          'type': 'Text',
          'required': true,
          'localized': false
        },
        {
          'id': 'description',
          'name': 'Description',
          'type': 'Text',
          'required': false,
          'localized': false
        },
        {
          'id': 'address',
          'name': 'Address',
          'type': 'Text',
          'required': false,
          'localized': false
        },
        {
          'id': 'location',
          'name': 'Location',
          'type': 'Location',
          'required': false,
          'localized': false
        },
        {
          'id': 'telephone',
          'name': 'Telephone',
          'type': 'Integer',
          'required': false,
          'localized': false
        },
        {
          'id': 'website',
          'name': 'Website',
          'type': 'Text',
          'required': false,
          'localized': false
        },
        {
          'id': 'openOnSundays',
          'name': 'Open on Sundays',
          'type': 'Boolean',
          'required': false,
          'localized': false
        },
        {
          'id': 'vegetarianDishes',
          'name': 'Vegetarian Dishes',
          'type': 'Boolean',
          'required': false,
          'localized': false
        },
        {
          'id': 'averagePrice',
          'name': 'Average Price Per Person',
          'type': 'Number',
          'required': false,
          'localized': false
        },
        {
          'id': 'currency',
          'name': 'Currency',
          'type': 'Symbol',
          'required': false,
          'localized': false
        }
      ],
      'name': 'Restaurant',
      'sys': {
        'space': {
          'sys': {
            'type': 'Link',
            'linkType': 'Space',
            'id': 'tjsdbq1gy9z7'
          }
        },
        'type': 'ContentType',
        'id': '4BdEcNFPK8WqiWeOOgmsEo',
        'revision': 5,
        'createdAt': '2013-06-19T09:08:13.328Z',
        'updatedAt': '2013-06-19T09:14:53.910Z'
      },
      'description': 'One Restaurant Guide entry',
      'displayField': 'name'
    }
  ]
});
