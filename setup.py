from setuptools import setup

setup(
  name='manhattan',
  version='0.1',
  long_description=__doc__,
  packages=['cerberus', 'hermes', 'gaia', 'lib'],
  include_package_data=True,
  zip_safe=False,
  install_requires=['Flask>=0.6']
     )
