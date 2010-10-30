from setuptools import setup, find_packages

setup(
  name='manhattan',
  version='0.14',
  long_description=__doc__,
  packages=find_packages(),
  include_package_data=True,
  zip_safe=False,
  install_requires=['Flask>=0.6', 'pymongo']
     )
