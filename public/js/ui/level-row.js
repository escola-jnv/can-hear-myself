// Linha com nome, cor e 5 botões de nível.
function levelRow(opts) {
  var row = document.createElement('div'); row.className = 'row';
  var name = document.createElement('div'); name.className = 'name';
  name.innerHTML = '<span class="chip" style="background:' + opts.color + '"></span>' + opts.name;
  var steps = document.createElement('div'); steps.className = 'steps';
  for (var i = 0; i < 5; i++) (function (step) {
    var b = document.createElement('button'); b.textContent = step;
    if (step === opts.active) { b.className = 'on'; b.style.background = opts.color; }
    b.onclick = function () { opts.onSelect(step); };
    steps.appendChild(b);
  })(i);
  row.appendChild(name); row.appendChild(steps);
  return row;
}
