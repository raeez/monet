from os.path import expanduser
from fabric.api import env, local, run, put, cd
from paramiko.config import SSHConfig
import string

DEPLOY_DIR = '~/manhattan'
TEMP_DIR = '/tmp/manhattan'

env.hosts = ['project-manhattan.com']

def annotate_hosts_with_ssh_config_info():
  def hostinfo(host, config):
    hive = config.lookup(host)
    if 'user' in hive:
      host = '%s@%s' % (hive['user'], host)
    if 'port' in hive:
      host = '%s:%s' % (host, hive['port'])
    return host

  try:
    config_file = file(expanduser('~/.ssh/config'))
  except IOError:
    pass
  else:
    config = SSHConfig()
    config.parse(config_file)
    keys = [config.lookup(host).get('identityfile', None) for host in env.hosts]
    env.key_filename = [key for key in keys if key is not None]
    env.hosts = [hostinfo(host, config) for host in env.hosts]

annotate_hosts_with_ssh_config_info()


def pack():
  local('python setup.py sdist --formats=gztar', capture=False)

def _deploy():
  ARCHIVE = 'manhattan.tar.gz'
  DIST = local ('python setup.py --fullname').strip() # release name and version
  print "Deploying %s" % DIST

  run('mkdir %s' % TEMP_DIR)
  put('dist/%s.tar.gz' % DIST, '%s/%s' % (TEMP_DIR, ARCHIVE))

  with cd(TEMP_DIR):
    run('tar xzf %s/%s -C .' % (TEMP_DIR, ARCHIVE))

    with cd(DIST):
      run('manhattan.python setup.py install')
  run('rm -rf %s' % TEMP_DIR)

  with cd(DEPLOY_DIR):
    run('sudo sh production')
    run('sudo sh list')

def seed_db():
  with cd(DEPLOY_DIR):
    run('manhattan.python seed.py')

def rebase(new=False):
  ITEMS = ['start', 'stop', 'restart', 'list', 'seed.py', 'bootstrap', 'production', 'fcgi', 'upstart', 'nginx']
  ARCHIVE = 'core.tar.gz'
  local('tar cvzf %s %s' % (ARCHIVE, string.join(ITEMS)))
  if new:
    run('mkdir %s' % DEPLOY_DIR)
  put(ARCHIVE, DEPLOY_DIR)
  local('rm %s' % ARCHIVE)

  with cd(DEPLOY_DIR):
    run('tar xf %s' % ARCHIVE)
    run('rm %s' % ARCHIVE)

def reconfig():
  rebase()
  with cd(DEPLOY_DIR):
    run('sudo sh production')
    run('sudo sh list')

def deploy():
  _deploy()

def bootstrap():
  rebase(new=True)

  with cd(DEPLOY_DIR):
    run('sudo sh bootstrap')

  _deploy()
  seed_db()

  with cd(DEPLOY_DIR):
    run('sudo sh list')
