
(function() {
  var fs = require('fs');
  var os = require("os");
  var https = require("https");
  var http = require('http');
  var crypto = require('crypto');
  var querystring = require('querystring');
  var Url = require('url');
  var Path = require('path');
  var Log = require('log');
  var encryptPass = require('./encrypt');

  var all_cookies = [];

  var int = function(v) {
    return parseInt(v);
  };

  var log = new Log('debug');

  var md5 = function(str) {
    var md5sum = crypto.createHash('md5');
    return md5sum.update(str.toString()).digest('hex');
  };

  var all_cookies_str = function() {
      var str = "";
      for(var i=0; i<all_cookies.length; i++) {
          str += all_cookies[i].split(' ')[0];
      }
      return str;
  };
    
  exports.cookies = function(cookies) {
    if (cookies) {
      all_cookies = cookies;
    }
    return all_cookies;
  };

  exports.prepare_login = function(callback) {
      var url = 'https://ui.ptlogin2.qq.com/cgi-bin/login?daid=164&target=self&style=16&mibao_css=m_webqq&appid=501004106&enable_qlogin=0&no_verifyimg=1&s_url=http%3A%2F%2Fw.qq.com%2Fproxy.html&f_url=loginerroralert&strong_login=1&login_state=10&t=20131024001';
      body = '';
    return https.get(url, function(resp) {
      if(resp.headers['set-cookie'] !== undefined)
        all_cookies = all_cookies.concat(resp.headers['set-cookie']);
      resp.on('data', function(chunk) {
        return body += chunk;
      });
      return resp.on('end', function() {
        return callback([]);
      });
    }).on("error", function(e) {
      return log.error(e);
    });
  };
    
  exports.check_qq_verify = function(qq, callback) {
    var options = {
      host: 'ssl.ptlogin2.qq.com',
      path: '/ptqrlogin?webqq_type=10&remember_uin=1&login2qq=1&aid=501004106&u1=http%3A%2F%2Fw.qq.com%2Fproxy.html%3Flogin2qq%3D1%26webqq_type%3D10&ptredirect=0&ptlang=2052&daid=164&from_ui=1&pttype=1&dumy=&fp=loginerroralert&action=0-0-' + (Math.random() * 900000 + 1000000) +'&mibao_css=m_webqq&t=undefined&g=1&js_type=0&js_ver=10138&login_sig=&pt_randsalt=0',
      headers: {
        'Cookie': all_cookies_str() + 'RK=OfeLBai4FB; ptcz=ad3bf14f9da2738e09e498bfeb93dd9da7540dea2b7a71acfb97ed4d3da4e277; pgv_pvi=911366144; ETK=; ptisp=ctc; pgv_info=ssid=s2810019118; pgv_pvid=1051433466; qrsig=hJ9GvNx*oIvLjP5I5dQ19KPa3zwxNI62eALLO*g2JLbKPYsZIRsnbJIxNe74NzQQ',
        'Referer':'https://ui.ptlogin2.qq.com/cgi-bin/login?daid=164&target=self&style=16&mibao_css=m_webqq&appid=501004106&enable_qlogin=0&no_verifyimg=1&s_url=http%3A%2F%2Fw.qq.com%2Fproxy.html&f_url=loginerroralert&strong_login=1&login_state=10&t=20131024001'
      }
    };
    var body = '';
    return https.get(options, function(resp) {
      if(resp.headers['set-cookie'] !== undefined)
        all_cookies = all_cookies.concat(resp.headers['set-cookie']);
      resp.on('data', function(chunk) {
        return body += chunk;
      });
      return resp.on('end', function() {
        var ret = body.match(/\'(.*?)\'/g).map(function(i) {
          var last = i.length - 2;
          return i.substr(1, last);
        });
        return callback(ret);
      });
    }).on("error", function(e) {
      return log.error(e);
    });
  };

  exports.get_qr_code = function(qq, host, port, cap_cd, callback) {
    var url = "https://ssl.ptlogin2.qq.com/ptqrshow?appid=501004106&e=0&l=M&s=5&d=72&v=4&t=" + Math.random();
    var body = '';
    return https.get(url, function(resp) {
      if(resp.headers['set-cookie'] !== undefined)
        all_cookies = all_cookies.concat(resp.headers['set-cookie']);
      resp.setEncoding('binary');
      resp.on('data', function(chunk) {
        return body += chunk;
      });
      return resp.on('end', function() {
        create_img_server(host, port, body, resp.headers);
        return callback();
      });
    }).on("error", function(e) {
      log.error(e);
      return callback(e);
    });
  };

  exports.finish_verify_code = function() {
    return stop_img_server();
  };

  var img_server = null;

  var create_img_server = function(host, port, body, origin_headers) {
    if (img_server) {
      return;
    }

    var dir_path = Path.join(os.homedir(), ".tmp");
    if(! fs.existsSync(dir_path)) fs.mkdirSync(dir_path);

    var file_path = Path.join(os.homedir(), ".tmp", "qrcode.jpg");
    fs.writeFileSync(file_path, body, 'binary');

    if (process.platform !== 'darwin') {
        img_server = http.createServer(function(req, res) {
          res.writeHead(200, origin_headers);
          return res.end(body, 'binary');
        });
        return img_server.listen(port);
    } else {
        return;
    }
  };

  var stop_img_server = function() {
    if (img_server) {
      img_server.close();
    }
    return img_server = null;
  };

  exports.check_sig = function(url, callback) {
    var body = '';
    return http.get(url, function(resp) {
      if(resp.headers['set-cookie'] !== undefined)
        all_cookies = all_cookies.concat(resp.headers['set-cookie']);
      resp.on('data', function(chunk) {
        return body += chunk;
      });
      return resp.on('end', function() {
        return callback(body);
      });
    }).on("error", function(e) {
      log.error(e);
      return callback(e);
    });
  };

  exports.login_token = function(client_id, psessionid, callback) {
    if(! client_id) client_id = parseInt(Math.random() * 89999999) + 10000000;
    else client_id = parseInt(client_id);

    if(! psessionid) psessionid = null;

    var ptwebqq = all_cookies.filter(function(item) {
      return item.match(/ptwebqq/);
    }).pop().replace(/ptwebqq\=(.*?);.*/, '$1');
    var r = {
      status: "online",
      ptwebqq: ptwebqq,
      clientid: "" + client_id,
      psessionid: psessionid
    };
    r = JSON.stringify(r);
    var data = querystring.stringify({
      r: r
    });
    var body = '';
    var options = {
      host: 'd.web2.qq.com',
      path: '/channel/login2',
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.9; rv:27.0) Gecko/20100101 Firefox/27.0',
        'Referer': 'http://d.web2.qq.com/proxy.html?v=20110331002&callback=1&id=3',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Content-Length': Buffer.byteLength(data),
        'Cookie': all_cookies
      }
    };
    var req = http.request(options, function(resp) {
      log.debug("login token response: " + resp.statusCode);
      resp.on('data', function(chunk) {
        return body += chunk;
      });
      return resp.on('end', function() {
        var ret;
        ret = JSON.parse(body);
        return callback(ret, client_id, ptwebqq);
      });
    });
    req.write(data);
    return req.end();
  };

  /*
      全局登录函数，如果有验证码会建立一个 http-server ，同时写入 tmp/*.jpg (osx + open. 操作)
      http-server 的端口和显示地址可配置
      @param options {account,password,port,host}
      @callback( cookies , auth_options ) if login success
   */

  exports.login = function(options, callback) {
    var auth, opt, pass, qq, ref, ref1;
    ref = [exports, options], auth = ref[0], opt = ref[1];
    ref1 = [opt.account, opt.password], qq = ref1[0], pass = ref1[1];
      
    return auth.prepare_login(function(result){
        log.info('登录 step0 二维码检测');
        return auth.check_qq_verify(qq, function(result) {
          var bits, need_verify, pass_encrypted, verifySession, verify_code;
          need_verify = result[0], verify_code = result[1], bits = result[2], verifySession = result[3];
          if (int(need_verify) == 65) {
            log.info("登录 step0.5 获取二维码");
            return auth.get_qr_code(qq, opt.host, opt.port, verify_code, function(error) {
              if (process.platform === 'darwin') {
                var file_path = Path.join(os.homedir(), ".tmp", "qrcode.jpg");
                require('child_process').exec('open ' + file_path);
                log.notice("请用 手机QQ 扫描该二维码");
              } else {
                log.notice("打开该地址->", "http://" + opt.host + ":" + opt.port);
              }

              return auth.prompt("手机QQ扫描二维码后, 回车继续: ", function(code) {
                log.info("登录 step1 等待二维码校验结果");
                return auth.check_qq_verify(qq, function(ret) {
                    if( int(ret[0]) == 0 && ret[2].match(/^http/)) {
                        console.log( ret[5] + ret[4] );
                        
                        log.info("登录 step2 cookie获取");
                        return auth.check_sig(ret[2], function(ret){
                            log.info("登录 step3 token 获取");
                            return auth.login_token(null, null, function(ret, client_id, ptwebqq) {
                              var auth_options;
                              if (ret.retcode === 0) {
                                log.info('登录 token 获取成功');
                                auth_options = {
                                  psessionid: ret.result.psessionid,
                                  clientid: client_id,
                                  ptwebqq: ptwebqq,
                                  uin: ret.result.uin,
                                  vfwebqq: ret.result.vfwebqq
                                };
                                console.log( auth_options );
                                return callback(all_cookies, auth_options);
                              } else {
                                log.info("登录失败");
                                return log.error(ret);
                              }
                            });
                        });
                    } else {
                        log.error("登录 step1 failed", ret);
                        return;
                    }
                });
              });
            });
          } else {
            console.log(result);
          }
        });
    });
  };

  exports.prompt = function(title, callback) {
    process.stdin.resume();
    process.stdout.write(title);
    process.on("data", function(data) {
        callback(data);
        return process.stdin.pause();
    });
    process.stdin.on("data", function(data) {
      data = data.toString().trim();
        callback(data);
        return process.stdin.pause();
    });
    return process.stdin.on('end', function() {
      process.stdout.write('end');
      return callback();
    });
  };

}).call(this);
