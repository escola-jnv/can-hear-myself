// Biblioteca de ícones musicais especializados e integração com Lucide
var Icons = (function () {
  var CUSTOM = {
    // 1. Bumbo (Kick Drum): Grande tambor circular frontal com batedor de pedal e pés angulados
    'drum-kick':
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="12" cy="11" r="7"/>' +
        '<circle cx="12" cy="11" r="3.5" stroke-dasharray="2 2" stroke-width="1.5"/>' +
        '<path d="M6.5 16.5L3.5 21"/>' +
        '<path d="M17.5 16.5L20.5 21"/>' +
        '<path d="M12 21v-4.5"/>' +
        '<circle cx="12" cy="15.5" r="1.5" fill="currentColor"/>' +
      '</svg>',

    // 2. Caixa (Snare Drum): Tambor raso com aro superior, esteira inferior e canoas de afinação
    'drum-snare':
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<ellipse cx="12" cy="7" rx="8.5" ry="3"/>' +
        '<path d="M3.5 7v8c0 1.66 3.8 3 8.5 3s8.5-1.34 8.5-3V7"/>' +
        '<path d="M7.5 9.5v5.5"/>' +
        '<path d="M12 10v6"/>' +
        '<path d="M16.5 9.5v5.5"/>' +
        '<path d="M6 16.8c2 .8 4 .8 6 .8s4 0 6-.8" stroke-dasharray="1.5 1.5"/>' +
      '</svg>',

    // 3. Chimbal (Hi-Hat): Pratos duplos de choque na máquina com presilha de topo e suporte
    'drum-hihat':
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M12 2v20"/>' +
        '<circle cx="12" cy="5" r="1.5" fill="currentColor"/>' +
        '<path d="M3.5 9.5c2.5-1.5 5.5-2 8.5-2s6 .5 8.5 2"/>' +
        '<path d="M3.5 13c2.5-1.5 5.5-2 8.5-2s6 .5 8.5 2"/>' +
        '<path d="M8 22l4-3 4 3"/>' +
      '</svg>',

    // 4. Over / Tons (Toms & Overheads): Dois tons montados + prato suspenso acima
    'drum-toms':
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M4.5 5c2.2-1 4.5-1.5 7.5-1.5s5.3.5 7.5 1.5"/>' +
        '<path d="M12 3.5v5.5"/>' +
        '<ellipse cx="7.5" cy="13.5" rx="3.5" ry="1.8"/>' +
        '<path d="M4 13.5v3.5c0 1 1.6 1.8 3.5 1.8s3.5-.8 3.5-1.8v-3.5"/>' +
        '<ellipse cx="16.5" cy="13.5" rx="3.5" ry="1.8"/>' +
        '<path d="M13 13.5v3.5c0 1 1.6 1.8 3.5 1.8s3.5-.8 3.5-1.8v-3.5"/>' +
      '</svg>',

    // 5. Prato Suspenso / Overhead (Cymbal / Ride / Crash)
    'drum-cymbal':
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M12 3.5v17.5"/>' +
        '<circle cx="12" cy="7" r="1.5" fill="currentColor"/>' +
        '<path d="M3 11c2.5-2 6-2.5 9-2.5s6.5.5 9 2.5"/>' +
        '<path d="M8 21l4-2 4 2"/>' +
      '</svg>',

    // 6. Bateria Geral (Drum Kit): Kit de bateria completo com bumbo, tons, chimbal e pratos
    'drum-kit':
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="12" cy="14" r="5.5"/>' +
        '<circle cx="12" cy="14" r="2.5" stroke-dasharray="1.5 1.5"/>' +
        '<ellipse cx="8.5" cy="6.5" rx="2.5" ry="1.2"/>' +
        '<path d="M6 6.5v2c0 .6 1.1 1.2 2.5 1.2s2.5-.6 2.5-1.2v-2"/>' +
        '<ellipse cx="15.5" cy="6.5" rx="2.5" ry="1.2"/>' +
        '<path d="M13 6.5v2c0 .6 1.1 1.2 2.5 1.2s2.5-.6 2.5-1.2v-2"/>' +
        '<path d="M2.5 9c1-.6 2-.8 3-.8s2 .2 3 .8"/>' +
        '<path d="M5.5 8.2v5"/>' +
        '<path d="M16 8.5c1-.6 2-.8 3-.8s2 .2 3 .8"/>' +
        '<path d="M19 7.7v5"/>' +
        '<path d="M7 19l-2 3"/>' +
        '<path d="M17 19l2 3"/>' +
      '</svg>'
  };

  return {
    get: function (name, cls) {
      if (CUSTOM[name]) {
        var svg = CUSTOM[name];
        if (cls) {
          svg = svg.replace('<svg ', '<svg class="' + cls + '" ');
        }
        return svg;
      }
      if (window.lucide && typeof window.lucide.svg === 'function') {
        return window.lucide.svg(name, cls);
      }
      return '<i data-lucide="' + name + '"' + (cls ? ' class="' + cls + '"' : '') + '></i>';
    }
  };
})();
