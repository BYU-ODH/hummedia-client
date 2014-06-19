#!/bin/sh

mongo hummedia --eval "db.dropDatabase()"
mongoimport --db hummedia --collection annotations --file annotations.json
mongoimport --db hummedia --collection users --file users.json
mongoimport --db hummedia --collection assets --file assets.json
mongoimport --db hummedia --collection assetgroups --file assetgroups.json
