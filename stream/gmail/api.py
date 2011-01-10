# -*- coding: utf-8 -*-


def valid_gmail_account(auth_tuple):
  assert len(auth_tuple) == 2

  import stream.imap.client

  ic = stream.imap.client.IMAPClient(auth_tuple)
  return ic.valid

def link_gmail_account(auth_tuple):
  assert len(auth_tuple) == 2

  import stream.model
  import bcrypt

  user = stream.model.User()
  user.email = auth_tuple[0]
  user.name = ''
  user.password = bcrypt.hashpw(auth_tuple[1], bcrypt.gensalt(10))
  user.save()
  return user
