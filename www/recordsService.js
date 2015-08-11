var recordsService = function (dbService) {

    // TODO: this service might become redundant after dbService is operational

    var service = {};

    // Local representation of the records db/collection
    // Text here is encrypted and decrypted only by the users - viewer & editor
    // Get returns a copy of the object to guard against accidental change
    // that won't persist.
    var records = [];


    service.records = function () {
        return records;
    };

    service.getAll = function (callback) {
        // TODO: complete this.
        if (_.any(records)) {
            callback(null, records);
            return;
        }

        // TODO: call this once automatically at service init or call
        // from app.run
        dbService.getAllRecords(function (error, data) {
            if (error) {
                callback(true);
                return;
            }

            data = _.sortBy(data, 'created');
            data = data.reverse();

            records = data;
            callback(null, records);
        });
    };

    service.addRecord = function (record, callback) {
        dbService.addRecord(record, function (error, newRecord) {
            if (error) {
                callback(error);
            }
            else {
                records.unshift(newRecord);
                callback(null, newRecord);
            }
        });
    };

    service.getRecord = function (id, callback) {
        var record = _.findWhere(records, {id: id});

        if (record.text) {
            callback(null, _.clone(record));
            return;
        }

        dbService.getRecord(id, function (error, data) {
            if (error) {
                callback(error);
            }
            else {
                _.extend(record, data);
                callback(null, data);
            }
        });
    };

    service.updateRecord = function (record, callback) {
        dbService.updateRecord(record, function (error) {
            if (error) {
                callback(error);
            }
            else {
                var internalRecord = _.findWhere(records, {id: record.id});
                _.extend(internalRecord, record);

                callback(null);
            }
        });
    };

    service.deleteRecord = function (record, callback) {
        dbService.deleteRecord(record.id, function (error) {
            if (error) {
                callback(error);
            }
            else {
                records = _.without(records, record);
                callback(null);
            }
        });
    };


    return service;
};

