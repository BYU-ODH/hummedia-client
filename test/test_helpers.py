from subprocess import Popen

def reload_db():
  # @TODO iterate through each file from filesystem instead of this list
  cmd = 'mongoimport --drop --db hummedia -c {0} /var/www/api/db/{0}.json'
  for coll in ['annotations','assetgroups','assets','users']:
    process = Popen(['vagrant', 'ssh', '-c', cmd.format(coll)])
    process.wait()
