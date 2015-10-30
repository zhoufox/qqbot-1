#!/usr/bin/env node

'use strict';

(function() {
  var log = new (require('log'))('debug');
  var auth = require("./src/qqauth_qrcode");
  var api = require("./src/qqapi");
  var QQBot = require("./src/qqbot");
  var defaults = require('./src/defaults');
  var config = require('./config');
  var KEY_COOKIES = 'qq-cookies';
  var KEY_AUTH = 'qq-auth';

  /*
   * 获取接口需要的cookie和token
   * @param isneedlogin : 是否需要登录，or本地获取
   * @param options     : 配置文件涉及的内容
   * @callback (cookies,auth_info)
   */

  var get_tokens = function(isneedlogin, options, callback) {
    var auth_info, cookies;
    if (isneedlogin) {
      return auth.login(options, function(cookies, auth_info) {
        defaults.data(KEY_COOKIES, cookies);
        defaults.data(KEY_AUTH, auth_info);
        defaults.save();
        return callback(cookies, auth_info);
      });
    } else {
      cookies = defaults.data(KEY_COOKIES);
      auth_info = defaults.data(KEY_AUTH);
      log.info("skip login");
      return callback(cookies, auth_info);
    }
  };

  var run = function() {
    "start qqbot...";
    var isneedlogin, params;
    params = process.argv.slice(-1)[0] || '';
    isneedlogin = params.trim() !== 'nologin';
    return get_tokens(isneedlogin, config, function(cookies, auth_info) {
      var bot;
      bot = new QQBot(cookies, auth_info, config);
      bot.on_die(function() {
        if (isneedlogin) {
          return run();
        }
      });
      return bot.update_all_members(function(ret) {
        var k, ref, ref1, v;
        if (!ret) {
          log.error("获取信息失败");
          process.exit(1);
        }
        console.log("Group List:");
        ref = bot.group_info.gnamelist;
        for (k in ref) {
          v = ref[k];
          console.log("    " + v.name + " (" + v.gid + ")");
        }
        console.log("Buddy List:");
        ref1 = bot.buddy_info.info;
        for (k in ref1) {
          v = ref1[k];
          console.log("    " + v.nick + " (" + v.uin + ")");
        }
        log.info("Entering runloop, Enjoy!");
        return bot.runloop();
      });
    });
  };

  run();

}).call(this);
