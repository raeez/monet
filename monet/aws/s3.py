IMAGE_BUCKET = 'monet-images'
SETTINGS_JSON = 'conf/aws.json'

def load_settings():
  if globals().get('settings', None) is None:
    with open(SETTINGS_JSON,'r') as f:
      import json
      return json.loads(f.read())

settings = load_settings()

def put_image(filename, content):
  from boto.s3.connection import S3Connection
  from boto.s3.key import Key
  conn = S3Connection(settings['access'], settings['secret'])
  b = conn.get_bucket(IMAGE_BUCKET)
  k = Key(b)
  k.key = filename.split('/')[::-1][0]
  k.set_metadata("Content-Type", 'images/jpeg')
  k.set_contents_from_string(content)
  k.set_acl("public-read") # fix, such that we don't expose everyone's photos
