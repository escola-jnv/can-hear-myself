// Conexão WebSocket com reconexão automática. Sem sintaxe moderna, para celulares antigos.
var Socket = (function () {
  var ws, handlers = {}, queue = [];
  function connect() {
    ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);
    ws.onopen = function () { fire('open'); while (queue.length) ws.send(queue.shift()); };
    ws.onmessage = function (e) { var m = JSON.parse(e.data); fire(m.type, m); };
    ws.onclose = function () { fire('close'); setTimeout(connect, 2000); };
  }
  function fire(t, m) { (handlers[t] || []).forEach(function (h) { h(m); }); }
  return {
    connect: connect,
    on: function (t, h) { (handlers[t] = handlers[t] || []).push(h); },
    send: function (m) { var s = JSON.stringify(m); if (ws && ws.readyState === 1) ws.send(s); else queue.push(s); }
  };
})();
