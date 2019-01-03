import makeState from 'states/Base.es6';
import { h } from 'utils/legacy-html-hyperscript/index.es6';
import * as Navigator from 'states/Navigator.es6';
import { resolveLink } from './deeplink/resolver.es6';
import { getModule } from 'NgRegistry.es6';

const $location = getModule('$location');

/**
 * @description deeplink route to point users to certain sections,
 * without knowing some details (e.g. navigate to API keys sections,
 * but without specifying their spaceId)
 *
 * Sometimes customer support has to describe "click here and there",
 * in order to explain how to get to some page. This is hard for every-
 * one, both for us and for customers, and this route should solve this
 * exact problem. It infers all parameters from previous usage, or just
 * picks the first one (e.g. first space from all available)
 *
 * @usage
 * https://app.contentful.com/deeplink?link=api
 */

export default makeState({
  name: 'deeplink',
  url: '/deeplink',
  template: createTemplate(),
  loadingText: 'Redirecting…',
  controller: [
    '$scope',
    $scope => {
      createController($scope);
    }
  ]
});

export function createController($scope) {
  const { link, ...otherParams } = $location.search();

  return resolveLink(link, otherParams).then(({ path, params, onboarding }) => {
    if (!path) {
      $scope.status = onboarding ? 'onboarding' : 'not_exist';
      $scope.context.ready = true;
    } else {
      Navigator.go({
        path,
        params,
        options: {
          location: 'replace'
        }
      });
    }
  });
}

function createTemplate() {
  return h('.workbench', [
    createScreen({
      condition: 'status === "onboarding"',
      dataTestId: 'deeplink-onboarding-error',
      title: `Unfortunately, we didn't find your onboarding space.`,
      subtitle: [
        h(
          'a',
          {
            uiSref: 'home'
          },
          ['Go to the main page']
        ),
        '.'
      ]
    }),
    createScreen({
      condition: 'status === "not_exist"',
      dataTestId: 'deeplink-generic-error',
      title: 'The link you provided is broken or does not exist',
      subtitle: [
        'We are notified about it. You can contact our support or ',
        h(
          'a',
          {
            uiSref: 'home'
          },
          ['go to the main page']
        ),
        '.'
      ]
    }),
    h(
      'div',
      {
        ngShow: '!status'
      },
      ['Redirecting…']
    )
  ]);
}

function createScreen({ condition, dataTestId, title, subtitle }) {
  return h(
    'div',
    {
      ngShow: condition,
      dataTestId,
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }
    },
    [
      h(
        'h3',
        {
          style: {
            marginTop: 0,
            marginBottom: '0.5em',
            fontSize: '2em',
            lineHeight: '1.2em'
          }
        },
        [title]
      ),
      h(
        'div',
        {
          style: {
            fontSize: '1.2em',
            lineHeight: '1.2em'
          }
        },
        subtitle
      )
    ]
  );
}
