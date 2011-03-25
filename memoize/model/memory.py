# -*- coding: utf-8 -*-

from lib.db.container import Container
from lib.db.model import mandatory, optional, pointer
from monet.model import User

class Memory(Container):

  @mandatory(str, name=None)
  def val_filename(self):
    assert len(self.name) < 255, "name must be less than 255 characters long"

  @mandatory(list, artifacts=[])
  def val_artifacts(self):
    assert isinstance(self.artifacts, list)
