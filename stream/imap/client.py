# -*- coding: utf-8 -*-

import imaplib

class IMAPClient(object):
  def __init__(self, auth_tuple, hostname='imap.gmail.com', port=993):
    assert len(auth_tuple) == 2

    self.server = imaplib.IMAP4_SSL(hostname, port)
    try:
      self.server.login(auth_tuple[0], auth_tuple[1])
    except:
      self.valid = False
    else:
      self.valid = True

  def test(self):
    status, count = self.server.select('Inbox') #gets INBOX
    st, da = self.server.fetch(count[0], '(UID BODY[TEXT])')
    print "%s : %r" % (st, da)

    r, data = self.server.search(None, "ALL")
    print "raw_data: %r" % data
    data = data[0].split()

    for id in data:
      s, d = self.server.fetch(id, '(UID BODY[TEXT])')
      print "%s : %r" % (s, d)

  def close(self):
    self.server.close()
    self.server.logout()
