#!/usr/bin/env node

var express = require('express');

var app = express();
var port = process.env.PORT || 3000;

// TODO: decide if to continue with __dirname
app.use(
    '/bower_components',
    express.static(__dirname + '/../bower_components')
);
app.use(
    express.static(__dirname + '/../www')
);

console.log("Listening... Get to http://localhost:" + port);
app.listen(port);


