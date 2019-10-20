#!/bin/sh
base_dir=$(dirname $0)
repo_dir=$(readlink -f $base_dir/..)

phantomjs=$repo_dir/node_modules/phantomjs/lib/phantom/bin/phantomjs
testrunner=$repo_dir/node_modules/jasmine-reporters/bin/phantomjs-testrunner.js
html=$repo_dir/test/jasmine.html

$phantomjs $testrunner $html
