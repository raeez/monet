import lib.config
lib.config.DEBUG = True
from gaia import gaia

if __name__ == '__main__':
  gaia.debug = True
  gaia.run(port=5300)
