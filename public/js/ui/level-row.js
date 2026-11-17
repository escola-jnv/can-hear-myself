// Linha com nome, cor, ícone opcional e 5 botões de nível.
function levelRow(opts) {
  var row = document.createElement('div');
  row.className = 'row' + (opts.className ? ' ' + opts.className : '');

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

  nameCol.innerHTML = iconHtml + '<div class="name-details">' + labelHtml + badgeHtml + '</div>';

  var steps = document.createElement('div');
  steps.className = 'steps';
  for (var i = 0; i < 5; i++) {
    (function (step) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = step;
      if (step === opts.active) {
        b.className = 'on';
        b.style.background = opts.color || 'var(--accent)';
        b.style.borderColor = opts.color || 'var(--accent)';
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
