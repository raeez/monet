# -*- coding: utf-8 -*-

from flask import Module, session, redirect, url_for, request, render_template, flash, abort
from flaskext.uploads import UploadNotAllowed
from memoize.model import User
from memoize.upload.helpers import get_memory, get_photo, create_memory, upload_photo, build_memory_stream, claimed, claim_memory
from lib.db.objectid import ObjectId
import bcrypt

from client.log import log

main_module = Module(__name__)

###########
## INDEX ##
###########

@main_module.route('/')
def index():
  log['request'].debug("request %s" % repr(request.path))

  if 'email' in session:
    return redirect(url_for('stream'))
  return render_template('index.html')

###########
## USERS ##
###########

@main_module.route('/new_user', methods=['GET', 'POST'])
def new_user():
    if not request.form['email'] or not request.form['password'] or not request.form['confirm']:
        abort(400)

    username = request.form['email']
    password = request.form['password']
    confirm = request.form['confirm']

    if pasword != confirm:
        abort(400)

    u = User()
    u.email = username
    u.password = bcrypt.hashpw(password, password)
    u.save()

    session['email'] = u.email
    session['id'] = str(u._id)
    session['password'] = password
    log['login'].debug(session['email'])

    return

@main_module.route('/check_for_email', methods=['GET', 'POST'])
def check_for_email():
    if not request.form['email']:
        abort(400)
    user = User.find_one({'email' : request.form['email']})

    if user is None:
        return 0
    else:
        return 1

@main_module.route('/login', methods=['GET', 'POST'])
def login():
  log['request'].debug("request %s" % repr(request.path))

  if 'email' in session:
    return redirect(request.referrer)
  elif request.method == 'POST':
    log['login'].debug("request %s" % repr(request.form))
    #auth
    user = User.find_one({'email' : request.form['email']})

    #if this user has not logged in before
    if user is None:
      flash('null')
      return redirect(url_for('login', claim=claim))

    if bcrypt.hashpw(request.form['password'], user.password) == user.password:
      session['email'] = request.form['email']
      session['id'] = str(user._id)
      session['password'] = request.form['password']
      log['login'].debug(session['email'])
      return redirect(request.referrer)
  return redirect(request.referrer)

@main_module.route('/claim/<id>', methods=['GET'])
def claim(id):
  m = get_memory(id)
  if m:
    return claim_memory(m)
  abort(400)


@main_module.route('/logout')
def logout():
  log['request'].debug("request %s" % repr(request.path))
  log['logout'].debug(session['email'])
  session.pop('email', None)
  return redirect(url_for('index'))

###################
## NOT LOGGED IN ##
###################

@main_module.route('/create', methods=['POST'])
def create():
  return upload_photo(request.form.get('memory_id', None))

@main_module.route('/new', methods=['GET'])
def new():
  return render_template('index.html')

@main_module.route('/memory/<id>', methods=['GET'])
def memory(id):
  m = get_memory(id)

  if not m:
    abort(404)
  else:
    if 'email' in session:
      claim_memory(m)

    from client.app import client as app
    show_hidden = request.args.get('show_hidden', '0')
    items = []
    for i in m.items:
      p = get_photo(i)

      if p.visible == 0:
        if show_hidden == '1':
          pass
        else:
          continue

      item = dict()
      item['id'] = p._id
      item['title'] = p.title
      item['url'] = app.photos.url(p.filename)
      item['visible'] = int(p.visible)
      items.append(item)
    return render_template('memory.html', memory={'claimed' : not (not m.user), 'id' : m._id, 'name' : m.name, 'items' : items, 'visible' : show_hidden})

@main_module.route('/toggle_visibility', methods=['POST'])
def toggle_visibility():
    if not request.form['visibility'] or not request.form['id']:
        abort(400)

    try:
        visibility = int(request.form['visibility'])
    except ValueError:
        abort(403)

    p = get_photo(request.form['id'])
    if p:
        if visibility == 1:
            p.visible = 0
        elif visibility == 0:
            p.visible = 1
        else:
            abort(403)
        p.save()
        return 1

    abort(403)

@main_module.route('/rename_memory', methods=['POST'])
def rename():
  if not request.form['new_name'] or not request.form['id']:
    abort(400)

  m = get_memory(request.form['id'])
  if m:
    if claimed(m):
      if ('email' in session) and (m.user == session['id']):
        m.name = request.form['new_name']
        m.save()
        return m.name
    else:
      m.name = request.form['new_name']
      m.save()
      return m.name

  abort(403)

###############
## LOGGED IN ##
###############

@main_module.route('/stream')
def stream():
  log['request'].debug("request %s" % repr(request.path))

  if 'email' not in session and 'id' not in session:
    return redirect(url_for('login'))

  return render_template('stream.html', stream=build_memory_stream())
