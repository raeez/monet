import imaplib

if __name__ == '__main__':

  server = imaplib.IMAP4_SSL('imap.gmail.com', 993)
  server.login('raeez.lorgat@gmail.com', 'cala6aka')
  status, count = server.select('Inbox') #gets INBOX

  st, da = server.fetch(count[0], '(UID BODY[TEXT])')
  print "%s : %r" % (st, da)

  r, data = server.search(None, "ALL")
  print "raw_data: %r" % data
  data = data[0].split()

  for id in data:
    s, d = server.fetch(id, '(UID BODY[TEXT])')
    print "%s : %r" % (s, d)


  server.close()
  server.logout()
