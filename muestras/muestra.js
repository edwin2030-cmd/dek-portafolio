/* Muestra interactiva: catalogo + pedido (vista previa del mensaje de WhatsApp) */
(function () {
  const D = window.MUESTRA;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = (n) => '$' + n.toFixed(2);
  const carro = new Map();
  let cat = 'Todo';

  const cats = ['Todo', ...new Set(D.items.map((i) => i.cat))];
  $('#filtros').innerHTML = cats.map((c) => `<button type="button" data-cat="${esc(c)}" class="${c === cat ? 'on' : ''}">${esc(c)}</button>`).join('');

  function pintar() {
    $('#filtros').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.cat === cat));
    $('#grid').innerHTML = D.items.map((it, i) => ({ it, i })).filter(({ it }) => cat === 'Todo' || it.cat === cat).map(({ it, i }) => {
      const n = carro.get(i) || 0;
      return `<article class="item"><div class="ic" aria-hidden="true">${it.ic}</div><h3>${esc(it.n)}</h3><p>${esc(it.d || '')}</p>
        <div class="pie"><span class="precio">${it.p ? `${it.desde ? '<small>desde </small>' : ''}${money(it.p)}${it.u ? `<small> ${esc(it.u)}</small>` : ''}` : `<small>${esc(it.u || 'A cotizar')}</small>`}</span>
        <button type="button" class="mas ${n ? 'en' : ''}" data-add="${i}">${n ? `✓ ${n} en ${D.modo === 'cita' ? 'solicitud' : 'pedido'}` : D.modo === 'cita' ? 'Solicitar' : 'Agregar'}</button></div></article>`;
    }).join('');
    const total = [...carro].reduce((a, [i, n]) => a + D.items[i].p * n, 0), cant = [...carro.values()].reduce((a, b) => a + b, 0);
    $('#carrito').classList.toggle('ver', cant > 0);
    $('#c-txt').innerHTML = `<b>${cant} ${cant === 1 ? 'artículo' : 'artículos'}</b> · ${D.modo === 'cita' ? 'aprox. ' : ''}${money(total)}`;
  }

  function mensaje() {
    const lineas = [...carro].map(([i, n]) => `• ${n} x ${D.items[i].n} — ${D.items[i].p ? money(D.items[i].p * n) : 'a cotizar'}`);
    const total = [...carro].reduce((a, [i, n]) => a + D.items[i].p * n, 0);
    const nombre = $('#m-nombre')?.value.trim() || 'María Gómez';
    const extra = $('#m-extra')?.value.trim() || D.extraEj;
    return D.modo === 'cita'
      ? `Hola ${D.nombre} 👋, quiero una cita para:\n${lineas.join('\n')}\nTotal aproximado: ${money(total)}\n\nNombre: ${nombre}\n${D.extraLbl}: ${extra}`
      : `Hola ${D.nombre} 👋, quiero hacer este pedido:\n${lineas.join('\n')}\n*Total: ${money(total)}*\n\nNombre: ${nombre}\n${D.extraLbl}: ${extra}`;
  }

  function abrir() {
    const filas = [...carro].map(([i, n]) => `<div class="fila"><span>${esc(D.items[i].n)}</span><span class="cant"><button type="button" data-menos="${i}" aria-label="Quitar uno">−</button>${n}<button type="button" data-add="${i}" aria-label="Agregar uno">+</button></span></div>`).join('');
    $('#hoja').innerHTML = `<h3>${D.modo === 'cita' ? 'Su solicitud de cita' : 'Su pedido'}</h3>
      <p class="muted">Así funciona: el cliente elige, pone su nombre y el mensaje le llega a <b>su WhatsApp</b> ya escrito.</p>
      ${filas}
      <label style="display:block;margin-top:12px;font-size:14px">Nombre<input id="m-nombre" placeholder="María Gómez" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:10px;font:inherit;margin-top:4px"></label>
      <label style="display:block;margin-top:10px;font-size:14px">${esc(D.extraLbl)}<input id="m-extra" placeholder="${esc(D.extraEj)}" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:10px;font:inherit;margin-top:4px"></label>
      <p class="muted" style="margin:16px 0 8px">Mensaje que le llegaría a ${esc(D.nombre)}${D.tel ? ' (' + esc(D.tel) + ')' : ''}:</p>
      <div class="chat"><div class="burbuja" id="m-msg"></div></div>
      <div class="acciones"><button type="button" class="btn l" data-cerrar>Seguir viendo</button>
      <a class="btn c" href="${D.waPropuesta}" target="_blank" rel="noopener">Quiero esto para mi negocio</a></div>`;
    const upd = () => { $('#m-msg').innerHTML = esc(mensaje()) + '<small>' + new Date().toTimeString().slice(0, 5) + ' ✓✓</small>'; };
    $('#hoja').querySelectorAll('input').forEach((x) => x.addEventListener('input', upd));
    upd();
    $('#modal').classList.add('ver');
  }

  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-cat]'); if (c) { cat = c.dataset.cat; pintar(); return; }
    const a = e.target.closest('[data-add]'); if (a) { const i = +a.dataset.add; carro.set(i, (carro.get(i) || 0) + 1); pintar(); if ($('#modal').classList.contains('ver')) abrir(); return; }
    const m = e.target.closest('[data-menos]'); if (m) { const i = +m.dataset.menos, n = (carro.get(i) || 0) - 1; n > 0 ? carro.set(i, n) : carro.delete(i); pintar(); carro.size ? abrir() : $('#modal').classList.remove('ver'); return; }
    if (e.target.closest('#ver-pedido')) { abrir(); return; }
    if (e.target.closest('[data-cerrar]') || e.target.id === 'modal') $('#modal').classList.remove('ver');
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#modal').classList.remove('ver'); });
  pintar();
})();
