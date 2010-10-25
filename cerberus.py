from cerberus import cerberus

if __name__ == '__main__':
  cerberus.debug = True
  cerberus.run(port=5100)
