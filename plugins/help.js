// Generated by CoffeeScript 1.10.0

/*

插件支持两个方法调用
 init(robot)
 received(content,send,robot,message)
 stop(robot)
 
 1.直接使用 
 module.exports = func 为快捷隐式调用 received 方法
 2.或
 module.exports = {
   init:      init_func       # 初始化调用
   received:  received_func   # 接受消息
   stop:      init_func       # 停止插件（比如端口占用）
 }
 */

(function() {
  var HELP_INFO, Path, VERSION_INFO, bundle, file_path, fs;

  HELP_INFO = "version/about   #版本信息和关于\nplugins         #查看载入的插件\ntime            #显示时间\necho 爱你        #重复后面的话\nhelp            #本内容\nuptime          #服务运行时间\nroll            #返回1-100随机值";

  fs = require('fs');

  Path = require('path');

  file_path = Path.join(__dirname, "..", "package.json");

  bundle = JSON.parse(fs.readFileSync(file_path));

  VERSION_INFO = "v" + bundle.version + " qqbot\nhttp://github.com/xhan/qqbot\n本工具还由 糗事百科 热血赞助！";


  /*
   @param content 消息内容
   @param send(content)  回复消息
   @param robot qqbot instance
   @param message 原消息对象
   */

  module.exports = function(content, send, robot, message) {
    var aday, ahour, day, hour, memory, minute, ref, ref1, ret, second, secs, t;
    if (content.match(/^help$/i)) {
      send(HELP_INFO);
    }
    if (content.match(/^VERSION|ABOUT$/i)) {
      send(VERSION_INFO);
    }
    if (content.match(/^plugins$/i)) {
      send("插件列表：\n" + robot.dispatcher.plugins.join('\r\n'));
    }
    if (content.match(/^time$/i)) {
      send("冥王星引力精准校时：" + new Date());
    }
    if (ret = content.match(/^echo (.*)/i)) {
      send(ret[1]);
    }
    if (content.match(/^uptime$/i)) {
      secs = process.uptime();
      ref = [86400, 3600], aday = ref[0], ahour = ref[1];
      ref1 = [secs / aday, secs % aday / ahour, secs % ahour / 60, secs % 60].map(function(i) {
        return parseInt(i);
      }), day = ref1[0], hour = ref1[1], minute = ref1[2], second = ref1[3];
      t = function(i) {
        return ("0" + i).slice(-2);
      };
      memory = process.memoryUsage().rss / 1024 / 1024;
      send("up " + day + " days, " + (t(hour)) + ":" + (t(minute)) + ":" + (t(second)) + " | mem: " + (memory.toFixed(1)) + "M");
    }
    if (content.match(/^roll$/i)) {
      return send(Math.round(Math.random() * 100));
    }
  };

}).call(this);
