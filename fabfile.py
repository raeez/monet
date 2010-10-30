from fabric.api import *

env.user = 'ubuntu'
env.hosts = ['project-manhattan.com']

def pack():
  local('python setup.py sdist --formats=gztar', capture=False)

def deploy():
  dist = local ('python setup.py --fullname').strip() # release name and version
  put('sdist/%s.tar.gz' % dist, '/tmp/manhattan.tar.gz')
  run('mkdir /tmp/manhattan')
  with cd('/tmp/manhattan'):
    run('tar xzf /tmp/manhattan.tar.gz')
  run('styx.python setp.py install')
  run('rm -rf /tmp/manhattan /tmp/manhattan.tar.gz')
  run('touch /var/www/cerberus.fcgi')
  run('touch /var/www/hermes.fcgi')
  run('touch /var/www/gaia.fcgi')

def bootstrap():
  
