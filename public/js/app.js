// Fluxo: quem é você → instrumento → saída → mix. Lembra as respostas no celular.
(function () {
  var cfg, state, who = load();
  var currentGroup = null; // null: todos os grupos fechados; 'bateria': agrupador aberto
  var helpRequested = false;

  var INSTRUMENTS = ['Voz', 'Violão', 'Guitarra', 'Baixo', 'Bateria', 'Teclado', 'Outro'];
  var DEFAULT_AUXES = [
    { id: 1, name: 'DRUM' },
    { id: 2, name: 'BASS' },
    { id: 3, name: 'GUITARRA' },
    { id: 4, name: 'VIOLAO' },
    { id: 5, name: 'VOZ 1' },
    { id: 6, name: 'VOZ 2' },
    { id: 7, name: 'KEYS' }
  ];
  var INSTRUMENT_ICONS = {
    'Voz': 'mic-vocal',
    'Violão': 'guitar',
    'Guitarra': 'guitar-electric',
    'Baixo': 'clef-bass',
    'Bateria': 'drum-kit',
    'Teclado': 'piano',
    'Outro': 'music'
  };

  // Cores padrão e variações harmoniosas para peças de cada instrumento
  var INSTRUMENT_PIECE_COLORS = {
    'Bumbo': '#C2410C',       // Laranja escuro / grave
    'Caixa': '#F97316',       // Laranja principal da bateria
    'Chimbal': '#FDBA74',     // Laranja claro dourado / prato
    'Over / Tons': '#EA580C', // Laranja quente médio
    'Guitarra 1': '#FACC15',  // Amarelo claro
    'Guitarra 2': '#CA8A04',  // Amarelo escuro
    'Teclado L': '#4ADE80',   // Verde claro
    'Teclado R': '#16A34A',   // Verde escuro
    'Voz Líder': '#3B82F6',   // Azul vibrante
    'Backing 1': '#60A5FA',   // Azul claro
    'Backing 2': '#93C5FD',   // Azul celeste
    'Playback L': '#F472B6',  // Rosa claro
    'Playback R': '#DB2777'   // Rosa escuro
  };

  // Menu de ajuda com cores distintas, ícones específicos e "Vem Cá" no lugar de outro
  var HELP_PROBLEMS = [
    { id: 1, label: 'Não estou me ouvindo', icon: 'volume-x', color: '#EF4444' },
    { id: 2, label: 'Problema no fone', icon: 'headphones', color: '#F97316' },
    { id: 3, label: 'Problema no instrumento ou microfone', icon: 'mic-off', color: '#A855F7' },
    { id: 4, label: 'Música ou clique errado', icon: 'timer', color: '#EAB308' },
    { id: 5, label: 'Vem Cá', icon: 'hand', color: '#06B6D4' }
  ];

  function $(id) { return document.getElementById(id); }

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function show(id) {
    var s = document.querySelectorAll('.screen');
    for (var i = 0; i < s.length; i++) s[i].className = 'screen';
    $(id).className = 'screen on';
    refreshIcons();
  }

  function load() {
    try { return JSON.parse(localStorage.getItem('who')); } catch (e) { return null; }
  }
  function save(w) {
    try { localStorage.setItem('who', JSON.stringify(w)); } catch (e) {}
  }

  var DRUM_ORANGE_SHADES = [
    '#C2410C', // Laranja escuro / grave (KICK / Bumbo)
    '#EA580C', // Laranja vibrante (SNARE / Caixa)
    '#FB923C', // Laranja médio quente (SNARE FX / Tom 1)
    '#F97316', // Laranja principal da bateria
    '#F59E0B', // Âmbar alaranjado (TOM 2)
    '#D97706', // Âmbar escuro (SURDO)
    '#FDBA74', // Laranja claro metálico (OH L / Chimbal)
    '#FED7AA'  // Pêssego claro (OH R / Pratos)
  ];

  function getGroupIcon(group) {
    var n = (group.name || group.id || '').toLowerCase();
    if (n.indexOf('bater') !== -1) return 'drum-kit';
    if (n.indexOf('baixo') !== -1) return 'clef-bass';
    if (n.indexOf('guit') !== -1) return 'guitar-electric';
    if (n.indexOf('viol') !== -1) return 'guitar';
    if (n.indexOf('tecl') !== -1) return 'piano';
    if (n.indexOf('voz') !== -1 || n.indexOf('vocal') !== -1) return 'mic-vocal';
    if (n.indexOf('play') !== -1) return 'disc-3';
    return 'music';
  }

  function getPieceIcon(name) {
    var n = (name || '').toLowerCase();
    if (n.indexOf('bumbo') !== -1 || n.indexOf('kick') !== -1 || n.indexOf('bd') !== -1) return 'drum-kick';
    if (n.indexOf('caixa') !== -1 || n.indexOf('snare') !== -1 || n.indexOf('sd') !== -1) return 'drum-snare';
    if (n.indexOf('chimbal') !== -1 || n.indexOf('hihat') !== -1 || n.indexOf('hh') !== -1) return 'drum-hihat';
    if (n.indexOf('oh') !== -1 || n.indexOf('prato') !== -1 || n.indexOf('cymbal') !== -1 || n.indexOf('ride') !== -1 || n.indexOf('crash') !== -1) return 'drum-cymbal';
    if (n.indexOf('over') !== -1 || n.indexOf('ton') !== -1 || n.indexOf('tom') !== -1 || n.indexOf('surdo') !== -1) return 'drum-toms';
    return 'drum-kit';
  }

  function getPieceColor(group, pieceName, index) {
    var n = (pieceName || '').toLowerCase();
    if (group.id === 'bateria' || (group.name && group.name.toLowerCase().indexOf('bater') !== -1)) {
      if (n.indexOf('kick') !== -1 || n.indexOf('bumbo') !== -1) return '#C2410C';
      if (n.indexOf('snare fx') !== -1) return '#FB923C';
      if (n.indexOf('snare') !== -1 || n.indexOf('caixa') !== -1) return '#EA580C';
      if (n.indexOf('tom 1') !== -1) return '#F97316';
      if (n.indexOf('tom 2') !== -1) return '#F59E0B';
      if (n.indexOf('surdo') !== -1) return '#D97706';
      if (n.indexOf('oh l') !== -1 || n.indexOf('chimbal') !== -1 || n.indexOf('hihat') !== -1) return '#FDBA74';
      if (n.indexOf('oh r') !== -1 || n.indexOf('prato') !== -1) return '#FED7AA';
      return DRUM_ORANGE_SHADES[index % DRUM_ORANGE_SHADES.length];
    }
    if (INSTRUMENT_PIECE_COLORS[pieceName]) {
      return INSTRUMENT_PIECE_COLORS[pieceName];
    }
    var base = group.color || '#F97316';
    return base;
  }

  function list(el, items, onPick) {
    el.innerHTML = '';
    items.forEach(function (it) {
      var b = document.createElement('button');
      if (it && it.html) {
        b.innerHTML = it.html;
      } else {
        b.textContent = (it && it.label) ? it.label : it;
      }
      if (it && it.cls) b.className = it.cls;
      b.onclick = function () { onPick(it, b); };
      el.appendChild(b);
    });
    refreshIcons();
  }

  function askPerson() {
    var people = [];
    try { people = JSON.parse(localStorage.getItem('people')) || []; } catch (e) {}
    list($('people'), people, function (p) {
      who = { person: p };
      askInstrument();
    });
    $('new-person').onclick = function () {
      var n = prompt('Seu nome');
      if (!n) return;
      people.push(n);
      try { localStorage.setItem('people', JSON.stringify(people)); } catch (e) {}
      who = { person: n };
      askInstrument();
    };
    show('s-person');
  }

  function askInstrument() {
    var el = $('instruments');
    el.innerHTML = '';
    INSTRUMENTS.forEach(function (inst) {
      var card = document.createElement('div');
      card.className = 'instrument-card';
      var iconName = INSTRUMENT_ICONS[inst] || 'music';
      var iconSvg = (window.Icons && typeof window.Icons.get === 'function')
        ? window.Icons.get(iconName)
        : '<i data-lucide="' + iconName + '"></i>';

      card.innerHTML =
        '<div class="instrument-card-icon">' + iconSvg + '</div>' +
        '<div class="instrument-card-label">' + inst + '</div>';
      card.onclick = function () {
        who.instrument = inst;
        askAux();
      };
      el.appendChild(card);
    });
    show('s-instrument');
  }

  function askAux() {
    var rawList = (cfg && Array.isArray(cfg.auxes) && cfg.auxes.length > 0) ? cfg.auxes : DEFAULT_AUXES;
    var items = rawList.map(function (a) {
      var name = a.name ? a.name.trim() : '';
      var hasCustomName = name && name.toLowerCase() !== ('aux ' + a.id);
      var html = '<span class="ch-pill">Aux ' + a.id + '</span>' + (hasCustomName ? ' <span class="aux-name">' + name + '</span>' : '');
      var label = hasCustomName ? ('Aux ' + a.id + ' (' + name + ')') : ('Aux ' + a.id);
      return { id: a.id, name: name || ('Aux ' + a.id), label: label, html: html, cls: 'aux-btn' };
    });
    list($('auxes'), items, function (a, b) {
      who.aux = a.id;
      if (b) {
        b.innerHTML = '<span class="ch-pill">Aux ' + a.id + '</span> <span>Entrando em ' + a.name + '...</span>';
      }
      join();
    });
    show('s-aux');
  }

  function detectDevice() {
    var ua = navigator.userAgent || '';
    if (/Android/i.test(ua)) {
      var m = ua.match(/Android[^;]+;\s*([^;)]+)\s*(?:Build|[;)])/i);
      if (m && m[1] && m[1].trim().toLowerCase() !== 'k' && m[1].trim().length > 2) {
        return m[1].trim();
      }
      return 'Android';
    }
    if (/iPhone/i.test(ua)) {
      var v = ua.match(/OS (\d+[_.]\d+)/);
      return 'iPhone' + (v ? ' (iOS ' + v[1].replace('_', '.') + ')' : '');
    }
    if (/iPad/i.test(ua)) return 'iPad';
    if (/Windows/i.test(ua)) return 'PC Windows';
    if (/Macintosh/i.test(ua)) return 'Mac';
    return 'Celular / Web';
  }

  function join() {
    save(who);
    Socket.send({
      type: 'join',
      person: who.person,
      instrument: who.instrument,
      aux: who.aux,
      device: detectDevice()
    });
  }

  function renderBreadcrumb() {
    var bar = $('breadcrumb-bar');
    if (!currentGroup) {
      bar.innerHTML = '';
      bar.style.display = 'none';
    } else {
      bar.style.display = 'block';
      var group = (cfg.groups || []).find(function (g) { return g.id === currentGroup; });
      var groupName = group ? group.name : currentGroup;
      var groupIcon = group ? getGroupIcon(group) : 'drum-kit';
      var iconSvg = (window.Icons && typeof window.Icons.get === 'function')
        ? window.Icons.get(groupIcon)
        : '<i data-lucide="drum"></i>';

      bar.innerHTML =
        '<nav class="breadcrumb">' +
          '<button class="bc-link" id="bc-back" title="Voltar para todos os canais">' +
            '<i data-lucide="chevron-left"></i>' +
            '<span>Mix</span>' +
          '</button>' +
          '<span class="bc-sep"><i data-lucide="chevron-right"></i></span>' +
          '<span class="bc-current">' +
            iconSvg +
            '<span>' + groupName + '</span>' +
          '</span>' +
        '</nav>';

      var backBtn = $('bc-back');
      if (backBtn) {
        backBtn.onclick = function () {
          currentGroup = null;
          renderMix();
        };
      }
    }
  }

  function renderMix() {
    // Top bar: identificação e status conectado logo na frente do nome
    var instIcon = INSTRUMENT_ICONS[who.instrument] || 'music';
    var topIconSvg = (window.Icons && typeof window.Icons.get === 'function')
      ? window.Icons.get(instIcon)
      : '<i data-lucide="' + instIcon + '"></i>';

    $('who-icon').innerHTML = topIconSvg;
    $('who-name').textContent = who.person + ' · ' + who.instrument;
    var auxList = (cfg && Array.isArray(cfg.auxes) && cfg.auxes.length > 0) ? cfg.auxes : DEFAULT_AUXES;
    var auxObj = auxList.find(function (a) { return a.id === who.aux; });
    var auxCustomName = (auxObj && auxObj.name && auxObj.name.trim().toLowerCase() !== ('aux ' + who.aux)) ? (' · ' + auxObj.name) : '';
    $('who-aux').textContent = 'Aux ' + who.aux + auxCustomName;

    // Linhas fixas (Master, Clique, Talkback)
    var fixed = $('fixed');
    fixed.innerHTML = '';
    [
      ['master', 'Master', '#F5A524', 'volume-2'],
      ['click', 'Clique', '#94A3B8', 'timer'],
      ['talkback', 'Talkback', '#94A3B8', 'headset']
    ].forEach(function (f) {
      fixed.appendChild(levelRow({
        name: f[1],
        color: f[2],
        icon: f[3],
        active: (state.fixed && state.fixed[f[0]] !== undefined) ? state.fixed[f[0]] : 3,
        onSelect: function (s) {
          Socket.send({ type: 'setFixedLevel', target: f[0], step: s });
        }
      }));
    });

    // Barra de navegação breadcrumb (só exibe quando dentro do agrupador)
    renderBreadcrumb();

    var groupsEl = $('groups');
    groupsEl.innerHTML = '';

    if (!currentGroup) {
      // 1. Visão Geral: Bateria e grupos fechados sem texto explicativo
      (cfg.groups || []).forEach(function (g) {
        var gIcon = getGroupIcon(g);
        var hasSubchannels = g.channels && g.channels.length > 1;
        var chevron = hasSubchannels
          ? '<span class="row-chevron"><i data-lucide="chevron-right"></i></span>'
          : null;

        var row = levelRow({
          name: g.name,
          color: g.color,
          icon: gIcon,
          badge: chevron,
          active: (state.groups && state.groups[g.id] !== undefined) ? state.groups[g.id] : 3,
          onTitleClick: hasSubchannels ? function () {
            currentGroup = g.id;
            renderMix();
          } : null,
          onSelect: function (s) {
            Socket.send({ type: 'setGroupLevel', group: g.id, step: s });
          }
        });
        groupsEl.appendChild(row);
      });
    } else {
      // 2. Agrupador aberto (ex: Bateria): Peças individuais com variações da cor do instrumento
      var group = (cfg.groups || []).find(function (g) { return g.id === currentGroup; });
      if (group) {
        var gIcon = getGroupIcon(group);

        // Volume geral do grupo
        var masterGroupRow = levelRow({
          name: group.name,
          color: group.color,
          icon: gIcon,
          active: (state.groups && state.groups[group.id] !== undefined) ? state.groups[group.id] : 2,
          onSelect: function (s) {
            Socket.send({ type: 'setGroupLevel', group: group.id, step: s });
          }
        });
        groupsEl.appendChild(masterGroupRow);

        // Peças individuais com variações de cor e ícones detalhados
        var channels = group.channels || [];
        channels.forEach(function (ch, idx) {
          var chName = (cfg.channelNames && cfg.channelNames[ch]) ? cfg.channelNames[ch] : ('Canal ' + ch);
          var pieceIcon = getPieceIcon(chName);
          var pieceColor = getPieceColor(group, chName, idx);
          // Regra 1: Volume da peça é independente do grupo (não cai de volta para o master)
          var currentStep = (state.channels && state.channels[ch] !== undefined)
            ? state.channels[ch]
            : 2;

          var pieceRow = levelRow({
            name: chName,
            color: pieceColor,
            icon: pieceIcon,
            className: 'piece-row',
            active: currentStep,
            onSelect: function (s) {
              Socket.send({ type: 'setChannelLevel', channel: ch, step: s });
            }
          });
          groupsEl.appendChild(pieceRow);
        });
      }
    }

    show('s-mix');
    refreshIcons();
  }

  // Renderização do menu de ajuda no meio da tela
  function renderHelpMenu() {
    var el = $('reasons');
    el.innerHTML = '';
    HELP_PROBLEMS.forEach(function (p) {
      var btn = document.createElement('button');
      btn.className = 'help-reason-btn';
      btn.style.setProperty('--reason-color', p.color);

      var iconSvg = (window.Icons && typeof window.Icons.get === 'function')
        ? window.Icons.get(p.icon)
        : '<i data-lucide="' + p.icon + '"></i>';

      btn.innerHTML =
        '<span class="reason-icon-chip" style="background:' + p.color + '22; color:' + p.color + '; border:1px solid ' + p.color + '55;">' +
          iconSvg +
        '</span>' +
        '<span class="reason-label">' + p.label + '</span>';

      btn.onclick = function () {
        Socket.send({ type: 'help', reason: p.id });
        $('help-sheet').className = 'sheet';
        helpRequested = true;
        var topBtn = $('help-btn');
        if (topBtn) {
          topBtn.className = 'help-btn pending';
          topBtn.innerHTML = '<i data-lucide="clock"></i><span>Solicitada</span>';
          refreshIcons();
        }
      };
      el.appendChild(btn);
    });
    refreshIcons();
  }

  // Eventos WebSocket
  Socket.on('state', function (m) {
    state = m;
    if (m.who) who = Object.assign(who || {}, m.who);
    renderMix();
    if (m.warning === 'limite') alert('Um canal chegou no volume máximo.');
  });
  Socket.on('error', function (m) {
    alert('Aviso do servidor: ' + (m.message || 'Erro inesperado'));
  });
  Socket.on('auxTaken', function (m) {
    alert('A Aux ' + m.aux + ' já está com ' + m.by + '.');
    askAux();
  });
  Socket.on('mixer', function (m) {
    $('offline').className = m.connected ? 'warn' : 'warn on';
    $('dot').className = m.connected ? 'dot' : 'dot off';
    $('dot').textContent = m.connected ? '● Conectado' : '● Sem mesa';
  });
  Socket.on('close', function () {
    $('offline').className = 'warn on';
    $('dot').className = 'dot off';
    $('dot').textContent = '● Sem conexão';
  });
  Socket.on('song', function (s) {
    $('song-name').textContent = s.name || 'Nenhuma música';
    $('song-meta').textContent = (s.key || '') + (s.bpm ? ' · ' + s.bpm + ' BPM' : '');
    if (navigator.vibrate) navigator.vibrate(200);
  });
  Socket.on('helpUpdate', function (m) {
    var btn = $('help-btn');
    if (m.status === 'visto') {
      alert('Técnico a caminho.');
      if (btn) {
        btn.className = 'help-btn pending';
        btn.innerHTML = '<i data-lucide="check-circle"></i><span>A caminho</span>';
        refreshIcons();
      }
    } else if (m.status === 'resolvido') {
      helpRequested = false;
      if (btn) {
        btn.className = 'help-btn';
        btn.innerHTML = '<i data-lucide="circle-help"></i><span>Ajuda</span>';
        refreshIcons();
      }
    }
  });
  Socket.on('configUpdate', function (m) {
    if (m.config) {
      cfg = m.config;
      if (state && who && who.aux) renderMix();
    }
  });

  // Modal de ajuda
  renderHelpMenu();

  // Salvar minha mix: o servidor guarda por pessoa + instrumento + aux e recarrega ao entrar
  $('save-mix-btn').onclick = function () {
    Socket.send({ type: 'savePreset' });
  };
  Socket.on('presetSaved', function () {
    var b = $('save-mix-btn');
    if (!b) return;
    b.className = 'save-btn saved';
    b.innerHTML = '<i data-lucide="check"></i><span>Salvo</span>';
    refreshIcons();
    setTimeout(function () {
      b.className = 'save-btn';
      b.innerHTML = '<i data-lucide="save"></i><span>Salvar</span>';
      refreshIcons();
    }, 2500);
  });

  $('help-btn').onclick = function () {
    $('help-sheet').className = 'sheet on';
    refreshIcons();
  };
  $('help-cancel').onclick = function () {
    $('help-sheet').className = 'sheet';
  };

  // Fechar modal ao clicar fora da caixa (backdrop)
  $('help-sheet').onclick = function (e) {
    if (e.target === $('help-sheet')) {
      $('help-sheet').className = 'sheet';
    }
  };

  // Inicialização
  var x = new XMLHttpRequest();
  x.open('GET', '/api/config');
  x.onload = function () {
    cfg = JSON.parse(x.responseText);
    Socket.connect();
    Socket.send({ type: 'hello', role: 'musician' });
    if (who && who.aux) {
      var auxList = (cfg && Array.isArray(cfg.auxes) && cfg.auxes.length > 0) ? cfg.auxes : DEFAULT_AUXES;
      var auxObj = auxList.find(function (a) { return a.id === who.aux; });
      var auxLabel = (auxObj && auxObj.name && auxObj.name.trim().toLowerCase() !== ('aux ' + who.aux))
        ? ('Aux ' + who.aux + ' (' + auxObj.name + ')')
        : ('Aux ' + who.aux);
      $('again-text').textContent = who.person + ', ' + who.instrument + ', ' + auxLabel + '. Continuar?';
      $('again-yes').onclick = join;
      $('again-no').onclick = askPerson;
      show('s-again');
    } else {
      askPerson();
    }
  };
  x.send();
})();
