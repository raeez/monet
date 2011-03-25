# -*- coding: utf-8 -*-

from setuptools import setup, find_packages

setup(
  name = 'monet',
  version = '0.19',
  packages = find_packages(),
  include_package_data = True,
  zip_safe = False,

  author = 'Raeez Lorgat',
  author_email = 'raeez@mit.edu',
  description = 'monet live streaming',

  install_requires=['Flask>=0.6',
                    'pymongo',
                    'py-bcrypt',
                    'gunicorn',
                    'gevent',
                    'eventlet',
                    'celery',
                    'flask-uploads',
                    'pyzmq']
)
