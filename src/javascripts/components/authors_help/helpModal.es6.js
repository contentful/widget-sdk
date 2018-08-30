import { h } from 'utils/hyperscript';
import { open } from 'modalDialog';
import { default as backgroundIcon } from 'svg/header-illustration-wide.es6';
import { default as thumbsDownIcon } from 'svg/icon-thumbs-down.es6';
import { default as thumbsUpIcon } from 'svg/icon-thumbs-up.es6';

const prefix = `authors-help`;

export function openHelp(scope) {
  return open({
    scope,
    template: h('.modal-background', [
      h(`.modal-dialog.${prefix}__modal`, [
        h(`.${prefix}__banner`, [backgroundIcon]),
        h(`.${prefix}__container`, [
          h(`h3.${prefix}__title`, ['Hi {{ name }}. Welcome to Contentful.']),
          h(`.${prefix}__description`, ['Your place to create and manage content collaboratively']),
          h(`.${prefix}__line`),
          renderList(),
          h(`.${prefix}__footer`, [
            renderFeedback(),
            h(
              'button.btn-action',
              {
                ngClick: 'dialog.confirm()'
              },
              ['Continue']
            )
          ])
        ])
      ])
    ])
  });
}

function renderList() {
  return h(`ul.${prefix}__list`, [
    renderListElement('Deliver content to your audience, on any channel'),
    renderListElement('Store media assets such as images and videos in the cloud'),
    renderListElement('Manage content in multiple languages'),
    renderListElement([
      'Work smarter using our ',
      h(
        'a',
        {
          href:
            'https://www.contentful.com/blog/2017/11/28/work-smarter-with-our-new-search-features/',
          target: '_blank',
          ngClick: 'openLink("search")'
        },
        ['powerful search']
      ),
      ' and ',
      h(
        'a',
        {
          href: 'https://www.contentful.com/r/knowledgebase/markdown/',
          target: '_blank',
          ngClick: 'openLink("markdown")'
        },
        ['text formatting']
      )
    ])
  ]);
}

function renderListElement(rawText) {
  const text = Array.isArray(rawText) ? rawText : [rawText];
  return h(`li.${prefix}__list-elem`, text);
}

function renderFeedback() {
  return h(`.${prefix}__feedback`, [
    h(
      `.${prefix}__feedback-container`,
      {
        ngShow: 'needFeedback'
      },
      [
        'Was this helpful?',
        h(
          `.${prefix}__feedback-choice`,
          {
            ngClick: 'chooseFeedback("negative")'
          },
          [thumbsUpIcon]
        ),
        h(
          `.${prefix}__feedback-choice`,
          {
            ngClick: 'chooseFeedback("positive")'
          },
          [thumbsDownIcon]
        )
      ]
    ),
    h(
      `.${prefix}__feedback-thanks`,
      {
        ngShow: '!!feedback'
      },
      ['Thanks for your feedback!']
    )
  ]);
}
