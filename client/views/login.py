# -*- coding: utf-8 -*-

from flask import Module, session, redirect, url_for, request, render_template, flash
from collate.model import User
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
      flash('null')
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
  
  return render_template('summary.html')
