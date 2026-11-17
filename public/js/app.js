// Fluxo: quem é você → instrumento → saída → mix. Lembra as respostas no celular.
(function () {
  var cfg, state, who = load();
  var INSTRUMENTS = ['Voz', 'Violão', 'Guitarra', 'Baixo', 'Bateria', 'Teclado', 'Outro'];
  var REASONS = ['Não estou me ouvindo', 'Problema no fone', 'Problema no instrumento ou microfone', 'Música ou clique errado', 'Outro'];

  function $(id) { return document.getElementById(id); }
  function show(id) { var s = document.querySelectorAll('.screen'); for (var i = 0; i < s.length; i++) s[i].className = 'screen'; $(id).className = 'screen on'; }
  function load() { try { return JSON.parse(localStorage.getItem('who')); } catch (e) { return null; } }
  function save(w) { try { localStorage.setItem('who', JSON.stringify(w)); } catch (e) {} }
  function list(el, items, onPick) {
    el.innerHTML = '';
    items.forEach(function (it) { var b = document.createElement('button'); b.textContent = it.label || it; if (it.cls) b.className = it.cls; b.onclick = function () { onPick(it); }; el.appendChild(b); });
  }

  function askPerson() {
    var people = []; try { people = JSON.parse(localStorage.getItem('people')) || []; } catch (e) {}
    list($('people'), people, function (p) { who = { person: p }; askInstrument(); });
    $('new-person').onclick = function () {
      var n = prompt('Seu nome'); if (!n) return;
      people.push(n); try { localStorage.setItem('people', JSON.stringify(people)); } catch (e) {}
      who = { person: n }; askInstrument();
    };
    show('s-person');
  }
  function askInstrument() { list($('instruments'), INSTRUMENTS, function (i) { who.instrument = i; askAux(); }); show('s-instrument'); }
  function askAux() {
    list($('auxes'), cfg.auxes.map(function (a) { return { label: a.name, id: a.id }; }), function (a) { who.aux = a.id; join(); });
    show('s-aux');
  }
  function join() { save(who); Socket.send({ type: 'join', person: who.person, instrument: who.instrument, aux: who.aux }); }

  function renderMix() {
    $('who-name').textContent = who.person + ' · ' + who.instrument;
    $('who-aux').textContent = 'Aux ' + who.aux;
    var fixed = $('fixed'); fixed.innerHTML = '';
    [['master', 'Master', '#F5A524'], ['click', 'Clique', '#94A3B8'], ['talkback', 'Talkback', '#94A3B8']].forEach(function (f) {
      fixed.appendChild(levelRow({ name: f[1], color: f[2], active: state.fixed[f[0]], onSelect: function (s) { Socket.send({ type: 'setFixedLevel', target: f[0], step: s }); } }));
    });
    var groups = $('groups'); groups.innerHTML = '';
    cfg.groups.forEach(function (g) {
      groups.appendChild(levelRow({ name: g.name, color: g.color, active: state.groups[g.id], onSelect: function (s) { Socket.send({ type: 'setGroupLevel', group: g.id, step: s }); } }));
    });
    show('s-mix');
  }

  Socket.on('state', function (m) { state = m; renderMix(); if (m.warning === 'limite') alert('Um canal chegou no volume máximo.'); });
  Socket.on('auxTaken', function (m) { alert('A ' + 'Aux ' + m.aux + ' já está com ' + m.by + '.'); askAux(); });
  Socket.on('mixer', function (m) { $('offline').className = m.connected ? 'warn' : 'warn on'; $('dot').className = m.connected ? 'dot' : 'dot off'; $('dot').textContent = m.connected ? '● Conectado' : '● Sem mesa'; });
  Socket.on('close', function () { $('offline').className = 'warn on'; });
  Socket.on('song', function (s) { $('song-name').textContent = s.name; $('song-meta').textContent = (s.key || '') + ' · ' + (s.bpm || '') + ' BPM'; if (navigator.vibrate) navigator.vibrate(200); });
  Socket.on('helpUpdate', function (m) { if (m.status === 'visto') alert('Técnico a caminho.'); });
  Socket.on('configUpdate', function (m) {
    if (m.config) {
      cfg = m.config;
      if (state && who && who.aux) renderMix();
    }
  });

  list($('reasons'), REASONS.map(function (r, i) { return { label: r, id: i + 1 }; }), function (r) { Socket.send({ type: 'help', reason: r.id }); $('help-sheet').className = 'sheet'; });
  $('help-btn').onclick = function () { $('help-sheet').className = 'sheet on'; };
  $('help-cancel').onclick = function () { $('help-sheet').className = 'sheet'; };

  var x = new XMLHttpRequest(); x.open('GET', '/api/config');
  x.onload = function () {
    cfg = JSON.parse(x.responseText);
    Socket.connect(); Socket.send({ type: 'hello', role: 'musician' });
    if (who && who.aux) {
      $('again-text').textContent = who.person + ', ' + who.instrument + ', Aux ' + who.aux + '. Continuar?';
      $('again-yes').onclick = join; $('again-no').onclick = askPerson; show('s-again');
    } else askPerson();
  };
  x.send();
})();
