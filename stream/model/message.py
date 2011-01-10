# -*- coding: utf-8 -*-

from lib.db.container import Container
from lib.db.model import mandatory, optional

class Message(Container):

  @mandatory(int, id=None)
  def val_id(self):
    assert id > 0, "Message id must be greater than 0"

  @mandatory(basestring, subject=None)
  def val_name(self):
    assert len(self.subject) < 255, "subject length is too long"

  @mandatory(basestring, body=None)
  def val_body(self):
    assert len(self.body) < 1000000, "body length is too long"

  @mandatory(basestring, sender=None)
  def val_sender(self):
    pass

  @mandatory(list, to=[])
  def val_to(self):
    pass

  @optional(list, cc=None)
  def val_cc(self):
    pass

  @optional(list, bcc=None)
  def val_bcc(self):
    pass

  @mandatory(bool, read=False)
  def val_read(self):
    pass

  @mandatory(int, timestamp=None)
  def val_timestamp(self):
    pass
