import makeState from 'states/Base';
import {h} from 'utils/hyperscript';
import $location from '$location';
import * as Navigator from 'states/Navigator';
import {resolveLink} from './deeplink/resolver';

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
  loadingText: 'Redirecting...',
  controller: ['$scope', function ($scope) {
    const { link } = $location.search();

    resolveLink(link).then(({ path, params }) => {
      if (!path) {
        $scope.status = 'not_exist';
        $scope.context = { ready: true };
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
  }]
});

function createTemplate () {
  return h('.workbench', [
    h('div', {
      ngShow: 'status === "not_exist"',
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }
    }, [
      h('h3', {
        style: {
          marginTop: 0,
          marginBottom: '0.5em',
          fontSize: '2em',
          lineHeight: '1.2em'
        }
      }, [
        'The link you provided is broken or does not exist'
      ]),
      h('div', {
        style: {
          fontSize: '1.2em',
          lineHeight: '1.2em'
        }
      }, [
        'We are notified about it. You can contact our support or ',
        h('a', {
          uiSref: 'home'
        }, ['go to the main page']),
        '.'
      ])
    ]),
    h('div', {
      ngShow: '!status'
    }, [
      'Redirecting...'
    ])
  ]);
}
