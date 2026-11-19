// Linha com nome, cor, ícone opcional e botões de nível (0 a 10).
function levelRow(opts) {
  var row = document.createElement('div');
  row.className = 'row' + (opts.className ? ' ' + opts.className : '') + (opts.isPinned ? ' row-pinned' : '');

  var nameCol = document.createElement('div');
  nameCol.className = 'name' + (opts.onTitleClick ? ' clickable' : '');
  if (opts.onTitleClick) {
    nameCol.onclick = function (e) {
      opts.onTitleClick(e);
    };
  }

  var iconHtml = '';
  if (opts.icon) {
    var svgContent = (window.Icons && typeof window.Icons.get === 'function')
      ? window.Icons.get(opts.icon, 'row-icon')
      : '<i data-lucide="' + opts.icon + '"></i>';

    iconHtml = '<span class="icon-chip" style="background:' + (opts.color || '#F5A524') + '22; color:' + (opts.color || '#F5A524') + '; border: 1px solid ' + (opts.color || '#F5A524') + '55;">' +
      svgContent +
    '</span>';
  } else {
    iconHtml = '<span class="chip" style="background:' + (opts.color || 'var(--accent)') + '"></span>';
  }

  var labelHtml = '<span class="label-text">' + opts.name + '</span>';
  var badgeHtml = opts.badge ? '<span class="row-badge">' + opts.badge + '</span>' : '';

  var pinHtml = '';
  if (opts.onPinToggle) {
    var pinSvg = (window.Icons && typeof window.Icons.get === 'function')
      ? window.Icons.get('pin', 'pin-icon')
      : '<i data-lucide="pin"></i>';

    pinHtml = '<button type="button" class="pin-toggle-btn' + (opts.isPinned ? ' pinned' : '') + '" title="' + (opts.isPinned ? 'Desafixar do topo' : 'Fixar no topo') + '">' +
      pinSvg +
    '</button>';
  }

  nameCol.innerHTML = '<div class="row-title-wrap">' + iconHtml + '<div class="name-details">' + labelHtml + badgeHtml + '</div></div>' + pinHtml;

  if (opts.onPinToggle) {
    var pinBtn = nameCol.querySelector('.pin-toggle-btn');
    if (pinBtn) {
      pinBtn.onclick = function (e) {
        e.stopPropagation();
        opts.onPinToggle();
      };
    }
  }

  var steps = document.createElement('div');
  steps.className = 'steps';
  var maxStep = (opts.maxStep !== undefined) ? opts.maxStep : (window.CHM_MAX_STEP || 10);
  for (var i = 0; i <= maxStep; i++) {
    (function (step) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'step-btn' + (step === 0 ? ' step-0' : '');
      b.textContent = step;
      if (step === opts.active) {
        b.className += ' on';
        if (step > 0) {
          b.style.background = opts.color || 'var(--accent)';
          b.style.borderColor = opts.color || 'var(--accent)';
        }
      }
      b.onclick = function (e) {
        e.stopPropagation();
        opts.onSelect(step);
      };
      steps.appendChild(b);
    })(i);
  }

  row.appendChild(nameCol);
  row.appendChild(steps);
  return row;
}
