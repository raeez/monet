# -*- coding: utf-8 -*-

from celery.task import task
from PIL import Image as PIL
from monet.model import Photo
from monet import live
from monet import aws

@task
def thumbnail(filename, path, photo_id, memory_id):
  # upload full to aws
  full_content = open(path, 'r').read()
  full_url = aws.s3.put_image(filename+'_full', full_content)

  # resize the image
  thumb_size = (1000000, 175)
  img = PIL.open(path)
  img.thumbnail(thumb_size, PIL.ANTIALIAS)
  img.save(path)
  width, height = img.size
  size = (width, height)
  
  # upload thumb to aws
  thumb_content = open(path, 'r').read()
  thumb_url = aws.s3.put_image(filename+'_thumb', thumb_content)

  # update the db
  Photo.atomic_set({ "_id" : photo_id },
                   { "processed" : True,
                     "dimensions" : size,
                     "filename" : filename,
                     "full_url" : full_url,
                     "thumb_url" : thumb_url })

  # notify the live server
  live.notify_photo_update(photo_id, memory_id, thumb_url, full_url, (width, height))
