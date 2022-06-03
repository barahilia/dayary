#!/usr/bin/env python
'''
The tool takes CSV export from MomentDiary and adds records to the Dayary
sqlite3 database
'''

from sys import argv
from os import system
import csv
import sqlite3


def encrypt(s, passphrase):
    enc = 'openssl enc -aes-256-cbc -e -k "' + passphrase + '" -base64 -A'
    enc += " -in in.dat -out out.dat"

    open("in.dat", 'w').write(s)
    system(enc)

    d = open('out.dat').read()
    # TODO: remove in.dat and out.dat
    return d


def main():
    if len(argv) != 2:
        print("Usage: moment2dayary.py passphrase")
        exit(1)

    passphrase = argv[1]
    records = []

    with open('b.csv', 'rb') as data:
        reader = csv.reader(data)
        reader.next()
        for row in reader:
            if row[3] == "TEXT":
                print("id", row[0], "created", row[2], "updated", row[9])

                record = row[2], row[9], encrypt(row[1], passphrase)
                records.append(record)

    conn = sqlite3.connect('records.sqlite')

    c = conn.cursor()
    c.executemany(
        'INSERT INTO Records(created, updated, text) VALUES (?,?,?)',
        records
    )

    conn.commit()


if __name__ == '__main__':
    main()
