# -*- coding: utf-8 -*-

from flask import Module, session, redirect, url_for, request, render_template
from alpha.model import User
import bcrypt
from client.log import log

login_module = Module(__name__)

@login_module.route('/')
def index():
  log['request'].debug("request %s" % repr(request.path))

  if 'email' in session:
    return redirect(url_for('summary'))
  
  return render_template('index.html')

@login_module.route('/login', methods=['GET', 'POST'])
def login():
  log['request'].debug("request %s" % repr(request.path))

  if 'email' in session:
    return redirect(url_for('index'))
  elif request.method == 'POST':
    log['login'].debug("request %s" % repr(request.form))
    #auth
    user = User.find_one({'email' : request.form['email']})

    #if this user has not logged in before
    if user is None:
      import stream.gmail.api #only support gmail for now # TODO catch exceptions here
      auth_tuple = (request.form['email'], request.form['password'])
      if stream.gmail.api.valid_gmail_account(auth_tuple):
        user = stream.gmail.api.link_gmail_account(auth_tuple)
      else:
        return redirect(url_for('login'))

    if bcrypt.hashpw(request.form['password'], user.password) == user.password:
      session['email'] = request.form['email']
      session['password'] = request.form['password']
      log['login'].debug(session['email'])
      return redirect(url_for('index'))
  return render_template('login.html')

@login_module.route('/logout')
def logout():
  log['request'].debug("request %s" % repr(request.path))
  log['logout'].debug(session['email'])
  session.pop('email', None)
  return redirect(url_for('index'))


@login_module.route('/summary')
def summary():
  log['request'].debug("request %s" % repr(request.path))

  if 'email' not in session:
    return redirect(url_for('login'))

  import stream.imap.client
  iclient = stream.imap.client.IMAPClient((session['email'], session['password']))
  data = []
  for m in iclient.mailbox_list():
    mailbox = {}
    mailbox['name'] = m[2]
    mailbox['messages'] = iclient.messages(mailbox['name'])
    data.append(mailbox)

  
  return render_template('summary.html', mboxes=data)