#!/usr/bin/python2.7

# The tool takes CSV export from MomentDiary and adds records to the Dayary
# sqlite3 database


from sys import argv
from os import system
import csv

# TODO: b.csv and records.sqlite should be arguments too

if len(argv) != 2:
    print "Usage: moment2dayary.py passphrase"
    exit(1)

PASSWORD = argv[1]

def encrypt(s):
    enc = 'openssl enc -aes-256-cbc -e -k "' + PASSWORD + '" -base64 -A'
    enc += " -in in.dat -out out.dat"

    open("in.dat", 'w').write(s)
    system(enc)

    d = open('out.dat').read()
    # TODO: remove in.dat and out.dat
    return d


records = []

with open('b.csv', 'rb') as data:
    reader = csv.reader(data)
    reader.next()
    for row in reader:
        if row[3] == "TEXT":
            print "id", row[0], "created", row[2], "updated", row[9]
            records.append( ( row[2], row[9], encrypt(row[1]) ) )

import sqlite3
conn = sqlite3.connect('records.sqlite')

c = conn.cursor()
c.executemany('INSERT INTO Records(created, updated, text) VALUES (?,?,?)', records)

conn.commit()

