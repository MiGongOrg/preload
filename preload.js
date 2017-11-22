/* ==========================================================
 * preload.js v20151217
 * ==========================================================
 * Copyright shihua
 * 359529568@qq.com
 * 移动端图片预加载模块
 * ========================================================== */

(function() {
  var p = function(option) {
    if (!option.items || !option.items.length || option.dev) {
      typeof option.callback === 'function' && option.callback.call(this);
      return;
    }
    this.itemsObj = option.itemsObj;
    this.items = option.items;
    this.prefix = option.prefix || '';
    this.callback = option.callback || null;
    this.process = option.process || null;
    this.bFinish = false;
    this.timer = null;
    this.percent = 0;
    this.despercent = 0;
    this.nCurIndex = 0;
    this.dev = option.dev || false;
    this.timeout = option.timeout || 60;
    this.startLoad();
    this.timeoutReload = {}; // 下载失败重新下载的时间延迟
    window.preload_one = this;
    window.bufferData = [];
    window.preloadBufferUrls = {};
  };
  p.prototype.startLoad = function() {
    var sf = this;
    sf.percent = 0;
    sf.load();
    setTimeout(function() {
      sf.bFinish = true;
    }, sf.timeout * 1000);
    return this;
  };
  p.prototype.load = function() {
    var sf = this;
    this.items.forEach(function(currItem) {
      if (!currItem) {
        sf._loadError();
      } else {
        sf.sendBufferAjax(currItem);
      }
    });
    sf.timer = setInterval(function() {
      sf.countNum();
    }, 30);
  };
  p.prototype._loadError = function() {
    var sf = this;
    !sf.bFinish && (sf.despercent = Math.floor((++sf.nCurIndex / nTotal) * 100));
  }
  p.prototype.sendBufferAjax = function(currItem) {
    var sf = this;
    var url = sf.prefix + sf.itemsObj[currItem];
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';
    request.onload = function(oEvent) {
      // 加载成功后清除延迟计时器
      clearTimeout(sf.timeoutReload[currItem]);
      sf.timeoutReload[currItem] = null;

      !sf.bFinish && (sf.despercent = Math.floor((++sf.nCurIndex / sf.items.length) * 100));
      var arrayBuffer = request.response;
      if (arrayBuffer) {
        var blob = new Blob([arrayBuffer], { type: "video/mp4" });
        window.preloadBufferUrls[currItem] = (window.URL || window.webkitURL).createObjectURL(blob)
      }
    };
    // 请求失败重试
    request.onerror = request.onabort = function() {
      console.log('重新下载：' + url)
      // 延迟重新下载，给每个视频一个独立的延迟，以防止改计时器被另外一个视频加载错误清除
      clearTimeout(sf.timeoutReload[currItem]);
      sf.timeoutReload[currItem] = null;
      sf.timeoutReload[currItem] = setTimeout(function() {
        sf.sendBufferAjax(currItem);
      }, 3000);
    }
    request.send();
  }
  p.prototype.countNum = function() {
    var sf = this;
    if (sf.bFinish) {
      sf.despercent = 100;
    }
    if (sf.percent == sf.despercent && sf.despercent < 100) return;
    sf.percent < sf.despercent && sf.percent++;
    typeof sf.process == 'function' && sf.process(sf.percent);
    sf.percent == 100 && sf.loadFinish();
  }
  p.prototype.loadFinish = function() {
    var sf = this;
    clearInterval(sf.timer);
    var r = this.callback;
    if (typeof r === "function") {
      r.call(sf);
    }
  };
  window.preload = p;
})(this);