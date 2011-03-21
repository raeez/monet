# -*- coding: utf-8 -*-

from celery.task import task
from PIL import Image as PIL
from memoize.model import Photo

@task
def thumbnail(filename, path, _id):
  thumb_size = (1000000, 175)
  img = PIL.open(path)
  img.thumbnail(thumb_size, PIL.ANTIALIAS)
  img.save(path)
  width, height = img.size
  size = (width, height)
  Photo.atomic_set({ "_id" : _id },
                   { "processed" : True,
                     "dimensions" : size,
                     "filename" : filename })
