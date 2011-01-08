# -*- coding: utf-8 -*-

from flask import Module, session, redirect, url_for, request, render_template
from stream.model import User
import bcrypt
from client.log import log

site = Module(__name__)

@site.route('/')
def index():
  log['request'].debug("request %s" % repr(request.path))
  if 'email' in session:
    return render_template('greeting.html')
  return render_template('index.html')

@site.route('/login', methods=['GET', 'POST'])
def login():
  log['request'].debug("request %s" % repr(request.path))
  if 'email' in session:
    return redirect(url_for('index'))
  elif request.method == 'POST':
    log['login'].debug("request %s" % repr(request.form))
    #auth
    user = User.find_one({'email' : request.form['email']})

    if user is None:
      return redirect(url_for('login'))

    if bcrypt.hashpw(request.form['password'], admin.password) == admin.password:
      session['email'] = request.form['email']
      log['login'].debug(session['email'])
      return redirect(url_for('index'))
  return render_template('login.html')

@site.route('/logout')
def logout():
  log['request'].debug("request %s" % repr(request.path))
  log['logout'].debug(session['email'])
  session.pop('email', None)
  return redirect(url_for('index'))