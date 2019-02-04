import { registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import Menu from 'components/CreateEntryButton/index.es6';

export default function register() {
  registerDirective('cfCreateEntryButton', () => ({
    link: function($scope, elem, attr) {
      $scope.$watchCollection(
        () => {
          const contentTypes = _.get($scope, attr.contentTypes, []);
          const disabled = contentTypes.length === 0;
          return {
            contentTypes,
            suggestedContentTypeId: _.get($scope, attr.suggestedContentTypeId),
            size: attr.size,
            style: attr.style,
            text: attr.text,
            hasPlusIcon: attr.hasPlusIcon,
            disabled
          };
        },
        props => {
          props = Object.assign({}, props, {
            onSelect: $scope.$eval(attr.onSelect)
          });

          ReactDOM.render(<Menu {...props} />, elem[0]);
        }
      );

      // Remember to unmount
      $scope.$on('$destroy', () => {
        ReactDOM.unmountComponentAtNode(elem[0]);
      });
    }
  }));
}
