var fs = require('fs'),
    jsonBackend = require('./json-backend');

var jsonFile = __dirname + "/../data/records.json";

var data;

var loadRecords = function () {
    if (fs.existsSync(jsonFile)) {
        // File from version < 0.4
        data = jsonBackend.getAllData();
    }
}

exports.getSettings = function () {
    throw "not implemented";
};

// Object of all the settings excluding hash
exports.setSettings = function (settings) {
    throw "not implemented";
};

exports.setHash = function (hash) {
    throw "not implemented";
};

exports.getRecordsMetadata = function () {
    throw "not implemented";
};

exports.getRecord = function (id) {
    throw "not implemented";
};

exports.addRecord = function (record) {
    throw "not implemented";
};

exports.updateRecord = function (record) {
    throw "not implemented";
};

exports.deleteRecord = function (record) {
    throw "not implemented";
};
