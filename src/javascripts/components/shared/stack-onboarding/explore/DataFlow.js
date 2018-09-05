import React from 'react';
import PropTypes from 'prop-types';

import { name as IframeHighlightHOCModule } from './IframeHighlightHOC';

export const name = 'data-flow-onboarding';

angular.module('contentful').factory(name, [
  'require',
  function(require) {
    const IframeHighlightHOC = require(IframeHighlightHOCModule);
    const Icon = require('ui/Components/Icon.es6').default;

    class DataFlow extends React.Component {
      static propTypes = {
        onHover: PropTypes.func,
        onLeave: PropTypes.func,
        active: PropTypes.string
      };

      parseStyle = style => {
        return {
          top: parseFloat(style.top),
          left: parseFloat(style.left)
        };
      };

      // this function renders lines between parents and children
      // it will automatically draw correct lines, so you can
      // play around with other boxes' position, without worrying
      // about connections
      renderLine = (style, parentStyle) => {
        if (parentStyle) {
          const numberedStyle = this.parseStyle(style);
          const numberedParentStyle = this.parseStyle(parentStyle);

          // line which comes from the parent
          const leftLineStyle = {
            height: '1px',
            left: `calc(${parentStyle.left} + 180px)`,
            top: `calc(${parentStyle.top} + 33px)`,
            right: `calc(100% - ${style.left} + ${numberedStyle.left -
              numberedParentStyle.left}% / 2 - 90px)`
          };

          // line which goes into the child
          const rightLineStyle = {
            height: '1px',
            left: `calc(${style.left} - ${numberedStyle.left -
              numberedParentStyle.left}% / 2 + 90px)`,
            top: `calc(${style.top} + 33px)`,
            right: `${100 - numberedStyle.left}%`
          };

          const upVertical = `calc(${style.top} + 33px)`;
          const bottomVertical = `calc(${parentStyle.top} + 33px)`;

          // line which connects one from the parent and one from the child
          const verticalLineStyle = {
            left: `calc(${style.left} - ${numberedStyle.left -
              numberedParentStyle.left}% / 2 + 90px)`,
            width: '1px',
            top: numberedStyle.top < numberedParentStyle.top ? upVertical : bottomVertical,
            bottom: `calc(100% - 33px - ${
              numberedStyle.top < numberedParentStyle.top ? parentStyle.top : style.top
            })`
          };

          return (
            <React.Fragment>
              <div className="modern-stack-onboarding--data-flow-line" style={leftLineStyle} />
              <div className="modern-stack-onboarding--data-flow-line" style={verticalLineStyle} />
              <div className="modern-stack-onboarding--data-flow-line" style={rightLineStyle} />
            </React.Fragment>
          );
        }
      };

      renderElem = (elem, { level = 0, position = 0 } = {}, parentStyle) => {
        const { onHover, onLeave, active } = this.props;
        const titleClassName = 'modern-stack-onboarding--data-flow-elem-title';
        const modifier = level === 0 ? 1 : 1 / level;

        // These numbers are purely empirical, feel free to play around
        // with them. They are in charge of pushing blocks around
        // Right now they are tailored for 3 nested children, but it can
        // be generalized, depending on the maximum nesting level
        const style = {
          top: `${25 + position * modifier * 20}%`,
          left: `${35 * level}%`
        };

        return (
          <React.Fragment key={`${level}.${position}`}>
            {this.renderLine(style, parentStyle)}
            <div
              key={elem.title}
              style={style}
              className={'modern-stack-onboarding--data-flow-elem'}
              onMouseEnter={elem.item && (() => onHover(elem.item))}
              onMouseLeave={elem.item && onLeave}>
              <div className={`${titleClassName} ${titleClassName}__${elem.color || 'blue'}`}>
                {elem.title}
              </div>
              <div className="modern-stack-onboarding--data-flow-elem-subtitle">
                {elem.subtitle}
              </div>
              {elem.item &&
                elem.item === active && <div className={'modern-stack-onboarding--active-data'} />}
            </div>
            {elem.children &&
              elem.children.map((child, i) => {
                // lift element a bit if it is a single child
                const numberOfChildren = elem.children.length === 1 ? 2 : elem.children.length;
                return this.renderElem(
                  child,
                  {
                    level: level + 1,
                    position: position * 2 + i - (numberOfChildren - 1) / 2
                  },
                  style
                );
              })}
          </React.Fragment>
        );
      };

      render() {
        const JohnDoeBlock = {
          title: 'John Doe',
          subtitle: 'content type: person',
          item: 'person'
        };

        const PersonsBlock = {
          title: 'Person',
          subtitle: 'collection of authors',
          item: 'person',
          children: [JohnDoeBlock]
        };

        const StaticSitesArticleBlock = {
          title: 'Static sites are great',
          subtitle: 'content type: blogPost',
          item: 'static-sites-are-great'
        };

        const HelloWorldArticleBlock = {
          title: 'Hello world',
          subtitle: 'content type: blogPost',
          item: 'hello-world'
        };

        const WebhooksArticleBlock = {
          title: 'Automate with webhooks',
          subtitle: 'content type: blogPost',
          item: 'automate-with-webhooks'
        };

        const BlogPostsBlock = {
          title: 'Blog Posts',
          subtitle: 'collection of articles',
          item: 'articles',
          children: [StaticSitesArticleBlock, HelloWorldArticleBlock, WebhooksArticleBlock]
        };

        const structure = {
          title: 'App',
          subtitle: 'Application shell',
          item: 'all',
          children: [PersonsBlock, BlogPostsBlock]
        };

        return (
          <div className="modern-stack-onboarding--data-flow-container">
            <Icon
              name="icon-onboarding-contentful-req-res"
              className="modern-stack-onboarding--data-flow-diagram"
            />
            {this.renderElem(structure)}
          </div>
        );
      }
    }

    return IframeHighlightHOC(DataFlow);
  }
]);
