export const contentTypesCDA = [
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'bkp1t915hkvx',
        },
      },
      id: 'category',
      type: 'ContentType',
      createdAt: '2018-09-03T12:09:32.936Z',
      updatedAt: '2018-09-03T12:09:32.936Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
    },
    displayField: 'title',
    name: 'Category',
    description: 'This content type defines the structure of a product category',
    fields: [
      {
        id: 'title',
        name: 'Title',
        type: 'Text',
        localized: false,
        required: true,
        disabled: false,
        omitted: false,
      },
      {
        id: 'icon',
        name: 'Icon',
        type: 'Link',
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
        linkType: 'Asset',
      },
      {
        id: 'categoryDescription',
        name: 'Description',
        type: 'Text',
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
      },
    ],
  },
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'bkp1t915hkvx',
        },
      },
      id: 'product',
      type: 'ContentType',
      createdAt: '2018-09-03T12:09:31.697Z',
      updatedAt: '2018-09-03T12:09:31.697Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
    },
    displayField: 'productName',
    name: 'Product',
    description: 'This content type defines the structure of a product entry',
    fields: [
      {
        id: 'productName',
        name: 'Product name',
        type: 'Text',
        localized: false,
        required: true,
        disabled: false,
        omitted: false,
      },
      {
        id: 'slug',
        name: 'Slug',
        type: 'Symbol',
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
      },
      {
        id: 'productDescription',
        name: 'Description',
        type: 'Text',
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
      },
      {
        id: 'sizetypecolor',
        name: 'Size/Type/Color',
        type: 'Symbol',
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
      },
      {
        id: 'image',
        name: 'Image',
        type: 'Array',
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
        items: {
          type: 'Link',
          validations: [],
          linkType: 'Asset',
        },
      },
      {
        id: 'tags',
        name: 'Tags',
        type: 'Array',
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
        items: {
          type: 'Symbol',
          validations: [],
        },
      },
      {
        id: 'categories',
        name: 'Categories',
        type: 'Array',
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
        items: {
          type: 'Link',
          validations: [
            {
              linkContentType: ['category'],
            },
          ],
          linkType: 'Entry',
        },
      },
      {
        id: 'price',
        name: 'Price',
        type: 'Number',
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
      },
      {
        id: 'brand',
        name: 'Brand',
        type: 'Link',
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
        linkType: 'Entry',
      },
      {
        id: 'quantity',
        name: 'Quantity',
        type: 'Integer',
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
      },
      {
        id: 'sku',
        name: 'SKU',
        type: 'Symbol',
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
      },
      {
        id: 'website',
        name: 'Available at',
        type: 'Symbol',
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
      },
    ],
  },
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'bkp1t915hkvx',
        },
      },
      id: 'brand',
      type: 'ContentType',
      createdAt: '2018-09-03T12:09:34.111Z',
      updatedAt: '2018-09-03T12:09:34.111Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
    },
    displayField: 'companyName',
    name: 'Brand',
    description: 'This content type defines the structure of a brand / product manufacturer entry',
    fields: [
      {
        id: 'companyName',
        name: 'Company name',
        type: 'Text',
        localized: false,
        required: true,
        disabled: false,
        omitted: false,
      },
      {
        id: 'logo',
        name: 'Logo',
        type: 'Link',
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
        linkType: 'Asset',
      },
      {
        id: 'companyDescription',
        name: 'Description',
        type: 'Text',
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
      },
      {
        id: 'website',
        name: 'Website',
        type: 'Symbol',
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
      },
      {
        id: 'twitter',
        name: 'Twitter',
        type: 'Symbol',
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
      },
      {
        id: 'email',
        name: 'Email',
        type: 'Symbol',
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
      },
      {
        id: 'phone',
        name: 'Phone #',
        type: 'Array',
        localized: false,
        required: false,
        disabled: false,
        omitted: false,
        items: {
          type: 'Symbol',
          validations: [],
        },
      },
    ],
  },
];

export const entriesCDA = [
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'bkp1t915hkvx',
        },
      },
      id: '5KsDBWseXY6QegucYAoacS',
      type: 'Entry',
      createdAt: '2018-09-03T12:09:55.895Z',
      updatedAt: '2018-09-03T12:09:55.895Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
      contentType: {
        sys: {
          type: 'Link',
          linkType: 'ContentType',
          id: 'product',
        },
      },
    },
    fields: {
      productName: {
        'en-US': 'Playsam Streamliner Classic Car, Espresso',
      },
      slug: {
        'en-US': 'playsam-streamliner-classic-car-espresso',
      },
      productDescription: {
        'en-US':
          "A classic Playsam design, the Streamliner Classic Car has been selected as Swedish Design Classic by the Swedish National Museum for its inventive style and sleek surface. It's no wonder that this wooden car has also been a long-standing favorite for children both big and small!",
      },
      sizetypecolor: {
        'en-US': 'Length: 135 mm | color: espresso, green, or icar (white)',
      },
      image: {
        'en-US': [
          {
            sys: {
              type: 'Link',
              linkType: 'Asset',
              id: 'wtrHxeu3zEoEce2MokCSi',
            },
          },
        ],
      },
      tags: {
        'en-US': ['wood', 'toy', 'car', 'sweden', 'design'],
      },
      categories: {
        'en-US': [
          {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: '24DPGBDeGEaYy8ms4Y8QMQ',
            },
          },
        ],
      },
      price: {
        'en-US': 44,
      },
      brand: {
        'en-US': {
          sys: {
            type: 'Link',
            linkType: 'Entry',
            id: 'JrePkDVYomE8AwcuCUyMi',
          },
        },
      },
      quantity: {
        'en-US': 56,
      },
      sku: {
        'en-US': 'B001R6JUZ2',
      },
      website: {
        'en-US': 'http://www.amazon.com/dp/B001R6JUZ2/',
      },
    },
  },
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'bkp1t915hkvx',
        },
      },
      id: 'JrePkDVYomE8AwcuCUyMi',
      type: 'Entry',
      createdAt: '2018-09-03T12:09:56.290Z',
      updatedAt: '2018-09-03T12:09:56.290Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
      contentType: {
        sys: {
          type: 'Link',
          linkType: 'ContentType',
          id: 'brand',
        },
      },
    },
    fields: {
      companyName: {
        'en-US': 'Playsam',
      },
      logo: {
        'en-US': {
          sys: {
            type: 'Link',
            linkType: 'Asset',
            id: '4zj1ZOfHgQ8oqgaSKm4Qo2',
          },
        },
      },
      companyDescription: {
        'en-US':
          'Playsam is the leading Scandinavian design company for executive wooden toy gift. Scandinavian design playful creativity, integrity and sophistication are Playsam. Scandinavian design and wooden toy makes Playsam gift lovely to the world of design since 1984.',
      },
      website: {
        'en-US': 'http://playsam.com/',
      },
    },
  },
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'bkp1t915hkvx',
        },
      },
      id: '24DPGBDeGEaYy8ms4Y8QMQ',
      type: 'Entry',
      createdAt: '2018-09-03T12:09:56.692Z',
      updatedAt: '2018-09-03T12:09:56.692Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
      contentType: {
        sys: {
          type: 'Link',
          linkType: 'ContentType',
          id: 'category',
        },
      },
    },
    fields: {
      title: {
        'en-US': 'Toys',
      },
      icon: {
        'en-US': {
          sys: {
            type: 'Link',
            linkType: 'Asset',
            id: '6t4HKjytPi0mYgs240wkG',
          },
        },
      },
      categoryDescription: {
        'en-US': 'Shop for toys, games, educational aids',
      },
    },
  },
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'bkp1t915hkvx',
        },
      },
      id: '3DVqIYj4dOwwcKu6sgqOgg',
      type: 'Entry',
      createdAt: '2018-09-03T12:09:54.737Z',
      updatedAt: '2018-09-03T12:09:54.737Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
      contentType: {
        sys: {
          type: 'Link',
          linkType: 'ContentType',
          id: 'product',
        },
      },
    },
    fields: {
      productName: {
        'en-US': 'Hudson Wall Cup',
      },
      slug: {
        'en-US': 'hudson-wall-cup',
      },
      productDescription: {
        'en-US': 'Wall Hanging Glass Flower Vase and Terrarium',
      },
      sizetypecolor: {
        'en-US': '3 x 3 x 5 inches; 5.3 ounces',
      },
      image: {
        'en-US': [
          {
            sys: {
              type: 'Link',
              linkType: 'Asset',
              id: 'Xc0ny7GWsMEMCeASWO2um',
            },
          },
        ],
      },
      tags: {
        'en-US': ['vase', 'flowers', 'accessories'],
      },
      categories: {
        'en-US': [
          {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: '7LAnCobuuWYSqks6wAwY2a',
            },
          },
        ],
      },
      price: {
        'en-US': 11,
      },
      brand: {
        'en-US': {
          sys: {
            type: 'Link',
            linkType: 'Entry',
            id: '651CQ8rLoIYCeY6G0QG22q',
          },
        },
      },
      quantity: {
        'en-US': 101,
      },
      sku: {
        'en-US': 'B00E82D7I8',
      },
      website: {
        'en-US': 'http://www.amazon.com/dp/B00E82D7I8/',
      },
    },
  },
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'bkp1t915hkvx',
        },
      },
      id: '651CQ8rLoIYCeY6G0QG22q',
      type: 'Entry',
      createdAt: '2018-09-03T12:09:57.150Z',
      updatedAt: '2018-09-03T12:09:57.150Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
      contentType: {
        sys: {
          type: 'Link',
          linkType: 'ContentType',
          id: 'brand',
        },
      },
    },
    fields: {
      companyName: {
        'en-US': 'Normann Copenhagen',
      },
      logo: {
        'en-US': {
          sys: {
            type: 'Link',
            linkType: 'Asset',
            id: '3wtvPBbBjiMKqKKga8I2Cu',
          },
        },
      },
      companyDescription: {
        'en-US':
          'Normann Copenhagen is a way of living - a mindset. We love to challenge the conventional design rules. This is why you will find traditional materials put into untraditional use such as a Stone Hook made of Icelandic stones, a vase made out of silicon and last but not least a dog made out of plastic.',
      },
      website: {
        'en-US': 'http://www.normann-copenhagen.com/',
      },
      twitter: {
        'en-US': 'https://twitter.com/NormannCPH',
      },
      email: {
        'en-US': 'normann@normann-copenhagen.com',
      },
      phone: {
        'en-US': ['+45 35 55 44 59'],
      },
    },
  },
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'bkp1t915hkvx',
        },
      },
      id: '4BqrajvA8E6qwgkieoqmqO',
      type: 'Entry',
      createdAt: '2018-09-03T12:09:54.288Z',
      updatedAt: '2018-09-03T12:09:54.288Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
      contentType: {
        sys: {
          type: 'Link',
          linkType: 'ContentType',
          id: 'product',
        },
      },
    },
    fields: {
      productName: {
        'en-US': 'SoSo Wall Clock',
      },
      slug: {
        'en-US': 'soso-wall-clock',
      },
      productDescription: {
        'en-US':
          'The newly released SoSo Clock from Lemnos marries simple, clean design and bold, striking features. Its saturated marigold face is a lively pop of color to white or grey walls, but would also pair nicely with navy and maroon. Where most clocks feature numbers at the border of the clock, the SoSo brings them in tight to the middle, leaving a wide space between the numbers and the slight frame. The hour hand provides a nice interruption to the black and yellow of the clock - it is featured in a brilliant white. Despite its bold color and contrast, the SoSo maintains a clean, pure aesthetic that is suitable to a variety of contemporary interiors.',
      },
      sizetypecolor: {
        'en-US': '10" x 2.2"',
      },
      image: {
        'en-US': [
          {
            sys: {
              type: 'Link',
              linkType: 'Asset',
              id: 'KTRF62Q4gg60q6WCsWKw8',
            },
          },
        ],
      },
      tags: {
        'en-US': ['home décor', 'clocks', 'interior design', 'yellow', 'gifts'],
      },
      categories: {
        'en-US': [
          {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: '7LAnCobuuWYSqks6wAwY2a',
            },
          },
        ],
      },
      price: {
        'en-US': 120,
      },
      brand: {
        'en-US': {
          sys: {
            type: 'Link',
            linkType: 'Entry',
            id: '4LgMotpNF6W20YKmuemW0a',
          },
        },
      },
      quantity: {
        'en-US': 3,
      },
      sku: {
        'en-US': 'B00MG4ULK2',
      },
      website: {
        'en-US': 'http://store.dwell.com/soso-wall-clock.html',
      },
    },
  },
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'bkp1t915hkvx',
        },
      },
      id: '4LgMotpNF6W20YKmuemW0a',
      type: 'Entry',
      createdAt: '2018-09-03T12:09:57.481Z',
      updatedAt: '2018-09-03T12:09:57.481Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
      contentType: {
        sys: {
          type: 'Link',
          linkType: 'ContentType',
          id: 'brand',
        },
      },
    },
    fields: {
      companyName: {
        'en-US': 'Lemnos',
      },
      logo: {
        'en-US': {
          sys: {
            type: 'Link',
            linkType: 'Asset',
            id: '2Y8LhXLnYAYqKCGEWG4EKI',
          },
        },
      },
      companyDescription: {
        'en-US':
          'TAKATA Lemnos Inc. was founded in 1947 as a brass casting manufacturing industry in Takaoka-city, Toyama Prefecture, Japan and we launched out into the full-scale business trade with Seiko Clock Co., Ltd. since 1966.\n\nWe entered into the development for the original planning from late 1980 and "Lemnos Brand" recognized as the global design clock by a masterpiece "HOLA" designed by Kazuo KAWASAKI which released in 1989.\n\nAfterwards, we made a lot of projects with well-known designers who took in active in Japan and overseas such as Riki WATANABE, Kazuo KAWASAKI, Shin AZUMI, Tomoko AZUMI, Kanae TSUKAMOTO etc. and we made announcement of their fine works abounding in artistry and prominent designs. In addition, we realized to make a special project by the collaboration with Andrea Branzi, a well-known architect in the world.\n\nLemnos brand products are now highly praised from the design shops and the interior shops all over the world.\n\nIn recent years, we also have been given high priority to develop interior accessories making full use of our traditional techniques by the founding manufacturer and we always focus our minds on the development for the new Lemnos products in the new market.\n\nOur Lemnos products are made carefully by our craftsmen finely honed skillful techniques in Japan. They surely bring out the attractiveness of the materials to the maximum and create fine products not being influenced on the fashion trend accordingly. TAKATA Lemnos Inc. definitely would like to be innovative and continuously propose the beauty lasts forever.',
      },
      website: {
        'en-US': 'http://www.lemnos.jp/en/',
      },
      email: {
        'en-US': 'info@acgears.com',
      },
      phone: {
        'en-US': ['+1 212 260 2269'],
      },
    },
  },
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'bkp1t915hkvx',
        },
      },
      id: '6dbjWqNd9SqccegcqYq224',
      type: 'Entry',
      createdAt: '2018-09-03T12:09:55.326Z',
      updatedAt: '2018-09-03T12:09:55.326Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
      contentType: {
        sys: {
          type: 'Link',
          linkType: 'ContentType',
          id: 'product',
        },
      },
    },
    fields: {
      productName: {
        'en-US': 'Whisk Beater',
      },
      slug: {
        'en-US': 'whisk-beater',
      },
      productDescription: {
        'en-US':
          'A creative little whisk that comes in 8 different colors. Handy and easy to clean after use. A great gift idea.',
      },
      sizetypecolor: {
        'en-US': '0.8 x 0.8 x 11.2 inches; 1.6 ounces',
      },
      image: {
        'en-US': [
          {
            sys: {
              type: 'Link',
              linkType: 'Asset',
              id: '10TkaLheGeQG6qQGqWYqUI',
            },
          },
        ],
      },
      tags: {
        'en-US': ['kitchen', 'accessories', 'whisk', 'scandinavia', 'design'],
      },
      categories: {
        'en-US': [
          {
            sys: {
              type: 'Link',
              linkType: 'Entry',
              id: '7LAnCobuuWYSqks6wAwY2a',
            },
          },
        ],
      },
      price: {
        'en-US': 22,
      },
      brand: {
        'en-US': {
          sys: {
            type: 'Link',
            linkType: 'Entry',
            id: '651CQ8rLoIYCeY6G0QG22q',
          },
        },
      },
      quantity: {
        'en-US': 89,
      },
      sku: {
        'en-US': 'B0081F2CCK',
      },
      website: {
        'en-US': 'http://www.amazon.com/dp/B0081F2CCK/',
      },
    },
  },
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'bkp1t915hkvx',
        },
      },
      id: '7LAnCobuuWYSqks6wAwY2a',
      type: 'Entry',
      createdAt: '2018-09-03T12:09:53.644Z',
      updatedAt: '2018-09-03T12:09:53.644Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
      contentType: {
        sys: {
          type: 'Link',
          linkType: 'ContentType',
          id: 'category',
        },
      },
    },
    fields: {
      title: {
        'en-US': 'Home & Kitchen',
      },
      icon: {
        'en-US': {
          sys: {
            type: 'Link',
            linkType: 'Asset',
            id: '6m5AJ9vMPKc8OUoQeoCS4o',
          },
        },
      },
      categoryDescription: {
        'en-US': 'Shop for furniture, bedding, bath, vacuums, kitchen products, and more',
      },
    },
  },
];

export const assetsCDA = [
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'bkp1t915hkvx',
        },
      },
      id: 'Xc0ny7GWsMEMCeASWO2um',
      type: 'Asset',
      createdAt: '2018-09-03T12:09:51.630Z',
      updatedAt: '2018-09-03T12:09:51.630Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
    },
    fields: {
      title: {
        'en-US': 'Hudson Wall Cup ',
      },
      description: {
        'en-US': 'Merchandise image',
      },
      file: {
        'en-US': {
          url:
            '//images.ctfassets.net/bkp1t915hkvx/Xc0ny7GWsMEMCeASWO2um/7f77503e0b29ca95e308b09f266a694e/jqvtazcyfwseah9fmysz.jpg',
          details: {
            size: 48751,
            image: {
              width: 600,
              height: 600,
            },
          },
          fileName: 'jqvtazcyfwseah9fmysz.jpg',
          contentType: 'image/jpeg',
        },
      },
    },
  },
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'bkp1t915hkvx',
        },
      },
      id: '4zj1ZOfHgQ8oqgaSKm4Qo2',
      type: 'Asset',
      createdAt: '2018-09-03T12:09:48.445Z',
      updatedAt: '2018-09-03T12:09:48.445Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
    },
    fields: {
      title: {
        'en-US': 'Playsam',
      },
      description: {
        'en-US': 'Brand logo',
      },
      file: {
        'en-US': {
          url:
            '//images.ctfassets.net/bkp1t915hkvx/4zj1ZOfHgQ8oqgaSKm4Qo2/15823b4af955910282bad4052d62d597/playsam.jpg',
          details: {
            size: 7003,
            image: {
              width: 100,
              height: 100,
            },
          },
          fileName: 'playsam.jpg',
          contentType: 'image/jpeg',
        },
      },
    },
  },
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'bkp1t915hkvx',
        },
      },
      id: 'KTRF62Q4gg60q6WCsWKw8',
      type: 'Asset',
      createdAt: '2018-09-03T12:09:48.026Z',
      updatedAt: '2018-09-03T12:09:48.026Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
    },
    fields: {
      title: {
        'en-US': 'SoSo Wall Clock',
      },
      description: {
        'en-US': 'by Lemnos',
      },
      file: {
        'en-US': {
          url:
            '//images.ctfassets.net/bkp1t915hkvx/KTRF62Q4gg60q6WCsWKw8/a39ad069279a4a36e364f2e5df577aa5/soso.clock.jpg',
          details: {
            size: 66927,
            image: {
              width: 1000,
              height: 1000,
            },
          },
          fileName: 'soso.clock.jpg',
          contentType: 'image/jpeg',
        },
      },
    },
  },
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'bkp1t915hkvx',
        },
      },
      id: '2Y8LhXLnYAYqKCGEWG4EKI',
      type: 'Asset',
      createdAt: '2018-09-03T12:09:52.201Z',
      updatedAt: '2018-09-03T12:09:52.201Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
    },
    fields: {
      title: {
        'en-US': 'Lemnos',
      },
      description: {
        'en-US': 'company logo',
      },
      file: {
        'en-US': {
          url:
            '//images.ctfassets.net/bkp1t915hkvx/2Y8LhXLnYAYqKCGEWG4EKI/3bab5dd0660644e6848bbcab32f20b1a/lemnos-logo.jpg',
          details: {
            size: 7149,
            image: {
              width: 175,
              height: 32,
            },
          },
          fileName: 'lemnos-logo.jpg',
          contentType: 'image/jpeg',
        },
      },
    },
  },
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'bkp1t915hkvx',
        },
      },
      id: '1MgbdJNTsMWKI0W68oYqkU',
      type: 'Asset',
      createdAt: '2018-09-03T12:09:50.697Z',
      updatedAt: '2018-09-03T12:09:50.697Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
    },
    fields: {
      title: {
        'en-US': 'Chive logo',
      },
      description: {
        'en-US': 'Brand logo',
      },
      file: {
        'en-US': {
          url:
            '//images.ctfassets.net/bkp1t915hkvx/1MgbdJNTsMWKI0W68oYqkU/6cf40f2ef04a3d50d3e5768f3da790ce/9ef190c59f0d375c0dea58b58a4bc1f0.jpeg',
          details: {
            size: 44089,
            image: {
              width: 500,
              height: 500,
            },
          },
          fileName: '9ef190c59f0d375c0dea58b58a4bc1f0.jpeg',
          contentType: 'image/jpeg',
        },
      },
    },
  },
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'bkp1t915hkvx',
        },
      },
      id: '10TkaLheGeQG6qQGqWYqUI',
      type: 'Asset',
      createdAt: '2018-09-03T12:09:50.046Z',
      updatedAt: '2018-09-03T12:09:50.046Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
    },
    fields: {
      title: {
        'en-US': 'Whisk beaters',
      },
      description: {
        'en-US': 'Merchandise photo',
      },
      file: {
        'en-US': {
          url:
            '//images.ctfassets.net/bkp1t915hkvx/10TkaLheGeQG6qQGqWYqUI/ae0b7669f45556d16ce627b589cbd6ce/ryugj83mqwa1asojwtwb.jpg',
          details: {
            size: 28435,
            image: {
              width: 450,
              height: 600,
            },
          },
          fileName: 'ryugj83mqwa1asojwtwb.jpg',
          contentType: 'image/jpeg',
        },
      },
    },
  },
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'bkp1t915hkvx',
        },
      },
      id: 'wtrHxeu3zEoEce2MokCSi',
      type: 'Asset',
      createdAt: '2018-09-03T12:09:49.189Z',
      updatedAt: '2018-09-03T12:09:49.189Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
    },
    fields: {
      title: {
        'en-US': 'Playsam Streamliner',
      },
      description: {
        'en-US': 'Merchandise photo',
      },
      file: {
        'en-US': {
          url:
            '//images.ctfassets.net/bkp1t915hkvx/wtrHxeu3zEoEce2MokCSi/63f9fe1bbc51ea842c133d6e08621776/quwowooybuqbl6ntboz3.jpg',
          details: {
            size: 27187,
            image: {
              width: 600,
              height: 446,
            },
          },
          fileName: 'quwowooybuqbl6ntboz3.jpg',
          contentType: 'image/jpeg',
        },
      },
    },
  },
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'bkp1t915hkvx',
        },
      },
      id: '6t4HKjytPi0mYgs240wkG',
      type: 'Asset',
      createdAt: '2018-09-03T12:09:48.832Z',
      updatedAt: '2018-09-03T12:09:48.832Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
    },
    fields: {
      title: {
        'en-US': 'Toys',
      },
      description: {
        'en-US': 'Category icon set',
      },
      file: {
        'en-US': {
          url:
            '//images.ctfassets.net/bkp1t915hkvx/6t4HKjytPi0mYgs240wkG/cadf96ee42020f49d009f06366500fcc/toys_512pxGREY.png',
          details: {
            size: 6744,
            image: {
              width: 128,
              height: 128,
            },
          },
          fileName: 'toys_512pxGREY.png',
          contentType: 'image/png',
        },
      },
    },
  },
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'bkp1t915hkvx',
        },
      },
      id: '3wtvPBbBjiMKqKKga8I2Cu',
      type: 'Asset',
      createdAt: '2018-09-03T12:09:49.632Z',
      updatedAt: '2018-09-03T12:09:49.632Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
    },
    fields: {
      title: {
        'en-US': 'Normann Copenhagen',
      },
      description: {
        'en-US': 'Brand logo',
      },
      file: {
        'en-US': {
          url:
            '//images.ctfassets.net/bkp1t915hkvx/3wtvPBbBjiMKqKKga8I2Cu/8a83fa4fdc507e9fa2204c2dde371b64/zJYzDlGk.jpeg',
          details: {
            size: 12302,
            image: {
              width: 353,
              height: 353,
            },
          },
          fileName: 'zJYzDlGk.jpeg',
          contentType: 'image/jpeg',
        },
      },
    },
  },
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'bkp1t915hkvx',
        },
      },
      id: '6s3iG2OVmoUcosmA8ocqsG',
      type: 'Asset',
      createdAt: '2018-09-03T12:09:51.072Z',
      updatedAt: '2018-09-03T12:09:51.072Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
    },
    fields: {
      title: {
        'en-US': 'House icon',
      },
      description: {
        'en-US': 'Category icon set',
      },
      file: {
        'en-US': {
          url:
            '//images.ctfassets.net/bkp1t915hkvx/6s3iG2OVmoUcosmA8ocqsG/8088579989b15fa5ed664e2048b61bc9/1418244847_Streamline-18-256__1_.png',
          details: {
            size: 4244,
            image: {
              width: 250,
              height: 250,
            },
          },
          fileName: '1418244847_Streamline-18-256 (1).png',
          contentType: 'image/png',
        },
      },
    },
  },
  {
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: 'bkp1t915hkvx',
        },
      },
      id: '6m5AJ9vMPKc8OUoQeoCS4o',
      type: 'Asset',
      createdAt: '2018-09-03T12:09:52.580Z',
      updatedAt: '2018-09-03T12:09:52.580Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      revision: 1,
    },
    fields: {
      title: {
        'en-US': 'Home and Kitchen',
      },
      description: {
        'en-US': 'category icon',
      },
      file: {
        'en-US': {
          url:
            '//images.ctfassets.net/bkp1t915hkvx/6m5AJ9vMPKc8OUoQeoCS4o/6ca853eb9ab928a7e6d1228de728a942/1418244847_Streamline-18-256.png',
          details: {
            size: 2977,
            image: {
              width: 256,
              height: 256,
            },
          },
          fileName: '1418244847_Streamline-18-256.png',
          contentType: 'image/png',
        },
      },
    },
  },
];

export const spaceCDA = {
  sys: {
    type: 'Space',
    id: 'bkp1t915hkvx',
  },
  name: '[v2] Product Calatogue',
  locales: [
    {
      code: 'en-US',
      default: true,
      name: 'U.S. English',
      fallbackCode: null,
    },
  ],
};
