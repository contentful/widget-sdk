require 'tilt/template'

module Tilt
  class CommonJSTemplate < Template
    def prepare
    end

    def evaluate(scope, locals, &block)
      if (scope.pathname.dirname+'package.json').exist?
        deps = `node -e "mdeps=require('module-deps'),through=require('through');mdeps('#{scope.pathname}').pipe(through(function(d){ console.log(d.id); }))"`
        deps.lines.reject{|line| line =~ /module-deps/}.drop(1).each{|path| scope.depend_on path.strip}
        # TODO also throw an error if browserify fucks up
        @output ||= `#{Rails.root}/node_modules/.bin/browserify -d #{scope.pathname}`
      else
        data
      end
    end

  end
end
