// Painel do servidor: lê /api/status do servidor local a cada 2 s.
const API = 'http://localhost:3000';
async function refresh() {
  try {
    const s = await (await fetch(API + '/api/status')).json();
    document.getElementById('mixer-status').textContent = s.mixer.connected ? '● Mesa conectada' : '● Mesa desconectada';
    document.getElementById('mixer-status').style.color = s.mixer.connected ? 'var(--ok)' : 'var(--danger)';
    document.getElementById('mixer').textContent = `${s.mixer.model} · ${s.mixer.ip}`;
    document.getElementById('urls').textContent = s.urls.join('  ');
    document.getElementById('count').textContent = s.sessions.length;
    document.getElementById('sessions').innerHTML = s.sessions.map((x) => `<li>${x.person} · ${x.instrument} · Aux ${x.aux}</li>`).join('');
    document.getElementById('song').textContent = s.song ? `${s.song.name} · ${s.song.key} · ${s.song.bpm} BPM` : '—';
    document.getElementById('help').innerHTML = s.help.map((h) => `<li>${h.person} (Aux ${h.aux}): ${h.label} — ${h.status}</li>`).join('');
    document.getElementById('log').innerHTML = s.log.slice().reverse().map((l) =>
      `<li>${l.at.slice(11, 16)} — ${l.person} ${l.action}${l.target ? ' ' + l.target : ''}${l.value !== undefined ? ' → ' + l.value : ''}${l.aux ? ' (Aux ' + l.aux + ')' : ''}</li>`).join('');
  } catch { document.getElementById('mixer-status').textContent = 'Servidor parado'; }
}
refresh(); setInterval(refresh, 2000);
