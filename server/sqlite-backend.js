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

export.getSettings = function () {
    throw "not implemented";
};

// Object of all the settings excluding hash
export.setSettings = function (settings) {
    throw "not implemented";
};

export.setHash = function (hash) {
    throw "not implemented";
};

export.getRecordsMetadata = function () {
    throw "not implemented";
};

export.getRecord = function (id) {
    throw "not implemented";
};

export.addRecord = function (record) {
    throw "not implemented";
};

export.updateRecord = function (record) {
    throw "not implemented";
};

export.deleteRecord = function (record) {
    throw "not implemented";
};
