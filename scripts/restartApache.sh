#!/bin/bash

updatedTime=0;

while true
do
  for fileName in /var/www/api/flask/hummedia/*.py
  do
     previousSaveTime=`stat --printf=%Y $fileName | cut -d. -f1`
     if [ $updatedTime -lt $previousSaveTime ]
     then
	updatedTime=$previousSaveTime;
	sudo service apache2 restart
	break;
     fi
  done
  
  sleep 5
done
