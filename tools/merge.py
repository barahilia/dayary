#!/usr/bin/env python3
from sys import argv
from json import load, dumps
import logging


def load_json(pathname):
    with open(pathname) as f:
        return load(f)


def merge(from_json, to_json):
    max_id = max(record['id'] for record in to_json)

    to_records = {
        record['created']: record
        for record in to_json
    }

    for from_record in from_json:
        from_created = from_record['created']
        to_record = to_records.get(from_created)

        if to_record is None:
            to_records[from_created] = from_record
            max_id += 1
            from_record['id'] = max_id
            logging.warning('newly added - %s', from_created)

        else:
            if from_record['updated'] > to_record['updated']:
                to_records[from_created]['updated'] = from_record['updated']
                to_records[from_created]['text'] = from_record['text']
                logging.warning('updated - %s', from_created)

            elif from_record['updated'] < to_record['updated']:
                logging.warning(
                    'target was updated later; no change - %s', from_created)

    return to_records


def main():
    if len(argv) != 3:
        print('usage: ./merge.py from.json to.json')
        print()
        print('merge dayary records from from.json to to.json')

        exit(-1)

    from_pathname, to_pathname = argv[1:]

    from_json = load_json(from_pathname)
    to_json = load_json(to_pathname)

    to_records = merge(from_json, to_json)

    output = sorted(to_records.values(), key=lambda record: record['id'])
    print(dumps(output))


if __name__ == '__main__':
    main()
