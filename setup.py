# -*- coding: utf-8 -*-

from setuptools import setup, find_packages

setup(
  name = 'collate',
  version = '0.17',
  packages = find_packages(),
  include_package_data = True,
  zip_safe = False,

  author = 'Raeez Lorgat',
  author_email = 'raeez@mit.edu',
  description = 'Collate photo sharing',

  install_requires=['Flask>=0.6', 'pymongo', 'py-bcrypt', 'gunicorn', 'eventlet', 'greenlet']
)
