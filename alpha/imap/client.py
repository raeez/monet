# -*- coding: utf-8 -*-

import imaplib
import re

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

  def mailbox_list(self):
    out = []

    list_response_pattern = re.compile(r'\((?P<flags>.*?)\) "(?P<delimiter>.*)" (?P<name>.*)')
    def parse_list_response(l):
      flags, delimiter, mboxname = list_response_pattern.match(l).groups()
      mboxname = mboxname.strip('"')
      return (flags, delimiter, mboxname)

    resp, data = self.server.list()
    for d in data:
      out.append(parse_list_response(d))
    return out

  def num_messages(self, box):
    resp, data = self.server.select(box)
    return int(data[0])

  def messages(self, box):
    out = []

    if box != 'INBOX':
      return []

    r, d = self.server.select(box)
    resp, [data] = self.server.search(None, 'ALL')

    for num in data.split():
      t, m = self.server.fetch(num, '(BODY.PEEK[HEADER])')
      for resp_part in m:
        if isinstance(resp_part, tuple):
          out.append(resp_part[1])
          print resp_part[1]
    return out

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

  def __del__(self):
    self.server.close()
    self.server.logout()
