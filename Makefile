export PATH := ./node_modules/.bin:${PATH}

.PHONY: build build-pages lint clean test-unit test-integration

# Compile the API from the lib directory into dist/cf-widget-api.js
build:
	webpack

lint:
	eslint lib/

clean:
	rm -rf dist/*

build-pages: gh-pages build
	$(MAKE) -C gh-pages

gh-pages:
	git clone git@github.com:contentful/widget-sdk $@
	cd $@
	git checkout $@

test: test-unit test-integration

test-unit:
	_mocha test/unit/**/*.js

test-integration:
	_mocha test/integration/**/*.js
