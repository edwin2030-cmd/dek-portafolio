(() => {
  const CLAVE = 'faro-demo-v1';
  const copia = (o) => JSON.parse(JSON.stringify(o));
  let E = cargar();

  function cargar() {
    try { const g = JSON.parse(localStorage.getItem(CLAVE)); if (g && g.productos) return g; } catch {}
    return copia(window.DATOS_INICIALES);
  }
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(E)); } catch {} };

  // ---------- utilidades ----------
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const r2 = (n) => Math.round(n * 100) / 100;
  const dinero = (n) => (n < 0 ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dineroCorto = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const entero = (n) => n.toLocaleString('en-US');
  const dia = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
  const HOY = dia(new Date());
  const fechaCorta = (t) => new Date(t).toLocaleDateString('es-PA', { day: 'numeric', month: 'short' }).replace('.', '');
  const hora = (t) => new Date(t).toLocaleTimeString('es-PA', { hour: 'numeric', minute: '2-digit' });
  const cuando = (t) => (dia(t) === HOY ? 'Hoy, ' + hora(t) : fechaCorta(t) + ', ' + hora(t));
  const producto = (c) => E.productos.find((p) => p.codigo === c);
  const cliente = (id) => E.clientes.find((c) => c.id === id);
  const saldo = (id) => r2(E.movimientos.filter((m) => m.cliente === id).reduce((s, m) => s + m.monto, 0));
  const estado = (p) => (p.existencia === 0 ? 'agotado' : p.existencia < p.minimo ? 'bajo' : 'bien');
  const TONOS = [176, 28, 210, 330, 95, 260];
  const avatar = (c) => { const i = E.clientes.indexOf(c); const h = TONOS[i % TONOS.length]; const ini = c.nombre.split(' ').slice(0, 2).map((w) => w[0]).join(''); return `<span class="avatar" style="background:hsl(${h} 45% 90%);color:hsl(${h} 45% 25%)">${esc(ini)}</span>`; };

  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('ver');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('ver'), 2600);
  }

  // ventas por día de los últimos 14 días, calculadas de las filas
  function porDia() {
    const dias = [];
    for (let d = 13; d >= 0; d--) { const f = new Date(HOY); f.setDate(f.getDate() - d); dias.push(f.getTime()); }
    return dias.map((t) => {
      const vs = E.ventas.filter((v) => dia(v.fecha) === t);
      return { t, total: r2(vs.reduce((s, v) => s + v.total, 0)), tickets: vs.length };
    });
  }

  // ---------- guías ----------
  const GUIAS = {
    resumen: `<p>Es lo primero que ve el dueño al abrir el sistema: cómo va el día, sin hacer cuentas.</p>
      <ol><li>Arriba, lo vendido hoy, los tickets, lo que te deben y lo que hay que pedir.</li>
      <li>La gráfica compara los últimos 14 días. Toca «Tickets» para cambiarla.</li>
      <li>«Por reponer» avisa qué productos están bajo el mínimo antes de que se acaben.</li></ol>`,
    vender: `<p>La caja. El cajero toca los productos y el sistema suma solo.</p>
      <ol><li>Toca un producto para agregarlo. Usa + y − para la cantidad.</li>
      <li>Elige cómo paga: efectivo, Yappy, tarjeta o fiado.</li>
      <li>Al cobrar, la existencia baja sola y la venta aparece en el resumen y en los reportes.</li></ol>
      <p>Pruébalo: haz una venta y luego mira el Resumen.</p>`,
    inventario: `<p>Todo lo que hay en la tienda, con lo que queda y el mínimo que quieres tener.</p>
      <ol><li>Filtra por «Por reponer» o «Agotados» para saber qué pedir al proveedor.</li>
      <li>Cuando llega mercancía, «Recibir» la suma a la existencia.</li>
      <li>Se puede añadir lo que tu negocio necesite: proveedores, costos, códigos de barra.</li></ol>`,
    clientes: `<p>El cuaderno del fiado, pero sin perder páginas.</p>
      <ol><li>Cada cliente tiene su saldo: lo que compró fiado menos lo que ha abonado.</li>
      <li>Toca un cliente para ver sus movimientos.</li>
      <li>Registra un abono y el saldo se actualiza al instante.</li></ol>`,
    reportes: `<p>Las cuentas del negocio, listas para mirar o mandar al contador.</p>
      <ol><li>Ventas de cada día de las últimas dos semanas; hoy va marcado.</li>
      <li>Lo que más se vende, para comprar mejor.</li>
      <li>Cuánto entró por cada forma de pago y cuánto se ganó sobre el costo.</li></ol>`,
  };

  // ---------- vistas ----------
  const vistas = {};

  vistas.resumen = (c) => {
    const d = porDia(); const hoy = d.at(-1); const ayer = d.at(-2);
    const fiado = r2(E.clientes.reduce((s, x) => s + saldo(x.id), 0));
    const reponer = E.productos.filter((p) => estado(p) !== 'bien').sort((a, b) => a.existencia / a.minimo - b.existencia / b.minimo);
    const agotados = reponer.filter((p) => p.existencia === 0).length;
    const dif = r2(hoy.total - ayer.total);
    const ultimas = [...E.ventas].sort((a, b) => b.numero - a.numero).slice(0, 5);
    const fechaHoy = new Date().toLocaleDateString('es-PA', { weekday: 'long', day: 'numeric', month: 'long' });
    c.innerHTML = `
      <div class="titulo-fila"><div><h1>Resumen de hoy</h1><p class="pequeno">${esc(fechaHoy)}</p></div>
        <div class="derecha"><a class="boton primario" href="#vender">Nueva venta</a></div></div>
      <div class="rejilla">
        <section class="tarjeta balances" aria-label="Balances del día">
          <div class="balance"><p class="etq">Vendido hoy</p><p class="valor">${dinero(hoy.total)}</p><p class="nota">${dif === 0 ? 'Igual que ayer' : (dif > 0 ? '+' : '−') + dinero(Math.abs(dif)) + ' frente a ayer'}</p></div>
          <div class="balance"><p class="etq">Tickets de hoy</p><p class="valor">${hoy.tickets}</p><p class="nota">Ayer: ${ayer.tickets}</p></div>
          <div class="balance"><p class="etq">Fiado por cobrar</p><p class="valor">${dinero(fiado)}</p><p class="nota">${E.clientes.filter((x) => saldo(x.id) > 0).length} clientes deben</p></div>
          <div class="balance"><p class="etq">Por reponer</p><p class="valor">${reponer.length}</p><p class="nota${agotados ? ' mal' : ''}">${agotados ? agotados + (agotados === 1 ? ' agotado' : ' agotados') : 'Ninguno agotado'}</p></div>
        </section>
        <section class="tarjeta">
          <div class="kpi-tabs" role="tablist" aria-label="Elegir la serie de la gráfica">
            <button class="kpi-tab" role="tab" aria-selected="true" data-serie="total"><span class="etq">Ventas, últimos 14 días</span><span class="valor">${dinero(d.reduce((s, x) => s + x.total, 0))}</span></button>
            <button class="kpi-tab" role="tab" aria-selected="false" data-serie="tickets"><span class="etq">Tickets, últimos 14 días</span><span class="valor">${entero(d.reduce((s, x) => s + x.tickets, 0))}</span></button>
          </div>
          <div class="grafica" id="g-resumen"></div>
        </section>
        <div class="rejilla dos">
          <section class="tarjeta"><div class="tarjeta-cab"><h2>Por reponer</h2><a class="derecha pequeno" href="#inventario">Ver inventario</a></div>
            <div class="tarjeta-cuerpo"><ul class="reponer">${reponer.slice(0, 6).map((p) => {
              const tope = Math.max(p.minimo * 1.5, p.existencia);
              return `<li><span class="nom">${esc(p.nombre)}</span><span class="cant"><b>${p.existencia}</b> <span>/ mínimo ${p.minimo}</span></span>
                <span class="pista" aria-hidden="true"><i class="${p.existencia < p.minimo ? 'bajo' : ''}" style="width:${(p.existencia / tope) * 100}%"></i><em style="left:${(p.minimo / tope) * 100}%"></em></span></li>`;
            }).join('') || '<li class="vacio">Todo está por encima del mínimo.</li>'}</ul></div></section>
          <section class="tarjeta"><div class="tarjeta-cab"><h2>Últimas ventas</h2><a class="derecha pequeno" href="#reportes">Ver reportes</a></div>
            <div class="tarjeta-cuerpo"><table class="tabla"><thead><tr><th>Ticket</th><th>Cuándo</th><th>Pago</th><th class="num">Total</th></tr></thead><tbody>
            ${ultimas.map((v) => `<tr><td class="mono">#${v.numero}</td><td>${esc(cuando(v.fecha))}</td><td>${v.metodo === 'Fiado' ? `<span class="pill aviso-p">Fiado</span>` : esc(v.metodo)}</td><td class="num">${dinero(v.total)}</td></tr>`).join('')}
            </tbody></table></div></section>
        </div>
      </div>`;
    const dibujar = (serie) => Charts.line($('#g-resumen'), {
      labels: d.map((x) => fechaCorta(x.t)),
      series: [{ name: serie === 'total' ? 'Ventas' : 'Tickets', values: d.map((x) => x[serie]) }],
      format: serie === 'total' ? dinero : entero, tickFormat: serie === 'total' ? dineroCorto : entero, height: 220, endLabel: true,
    });
    dibujar('total');
    c.querySelectorAll('.kpi-tab').forEach((b) => b.addEventListener('click', () => {
      c.querySelectorAll('.kpi-tab').forEach((x) => x.setAttribute('aria-selected', x === b));
      dibujar(b.dataset.serie);
    }));
  };

  let carrito = [];
  let metodo = 'Efectivo';
  vistas.vender = (c) => {
    c.innerHTML = `
      <div class="titulo-fila"><h1>Vender</h1><div class="derecha"><input class="campo buscar" id="buscar-prod" type="search" placeholder="Buscar producto o código" aria-label="Buscar producto"></div></div>
      <div class="caja">
        <div><div class="catalogo" id="catalogo"></div></div>
        <section class="tarjeta ticket" aria-labelledby="t-ticket">
          <div class="tarjeta-cab"><h2 id="t-ticket">Ticket #${E.siguienteVenta}</h2><button type="button" class="derecha enlace-boton" id="vaciar">Vaciar</button></div>
          <div class="tarjeta-cuerpo">
            <ul class="ticket-lineas" id="lineas"></ul>
            <div class="ticket-total"><span>Total</span><b id="total">$0.00</b></div>
            <p class="pequeno">Forma de pago</p>
            <div class="metodos" role="radiogroup" aria-label="Forma de pago">
              ${['Efectivo', 'Yappy', 'Tarjeta', 'Fiado'].map((m) => `<label><input type="radio" name="metodo" value="${m}" ${m === metodo ? 'checked' : ''}><span>${m}</span></label>`).join('')}
            </div>
            <label class="etiqueta" id="fila-cliente" hidden>Cliente que lleva fiado
              <select class="campo" id="cliente-fiado">${E.clientes.map((x) => `<option value="${x.id}">${esc(x.nombre)} · debe ${dinero(saldo(x.id))}</option>`).join('')}</select>
            </label>
            <button type="button" class="boton primario alto ancho" id="cobrar" style="margin-top:12px">Cobrar</button>
          </div>
        </section>
      </div>`;
    const pintarCatalogo = () => {
      const q = $('#buscar-prod').value.trim().toLowerCase();
      const lista = E.productos.filter((p) => !q || p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q));
      $('#catalogo').innerHTML = lista.map((p) => `<button type="button" class="prod" data-codigo="${p.codigo}" ${p.existencia === 0 ? 'disabled' : ''}>
        <span class="n">${esc(p.nombre)}</span><span class="p">${dinero(p.precio)}</span>
        <span class="e">${p.existencia === 0 ? 'Agotado' : 'Quedan ' + entero(p.existencia)}</span></button>`).join('') || '<p class="vacio">No hay productos con ese nombre.</p>';
    };
    const pintarTicket = () => {
      const total = r2(carrito.reduce((s, l) => s + l.cantidad * producto(l.codigo).precio, 0));
      $('#lineas').innerHTML = carrito.length ? carrito.map((l) => { const p = producto(l.codigo); return `<li><span>${esc(p.nombre)}<br><span class="pequeno">${dinero(p.precio)} c/u</span></span>
        <span class="ctrl"><button type="button" class="boton-icono" data-menos="${l.codigo}" aria-label="Quitar uno de ${esc(p.nombre)}">−</button>${l.cantidad}<button type="button" class="boton-icono" data-mas="${l.codigo}" aria-label="Agregar uno de ${esc(p.nombre)}">+</button></span>
        <span class="imp">${dinero(l.cantidad * p.precio)}</span></li>`; }).join('') : '<li class="vacio">Toca un producto para empezar.</li>';
      $('#total').textContent = dinero(total);
      const b = $('#cobrar'); b.disabled = !carrito.length; b.textContent = carrito.length ? `Cobrar ${dinero(total)}` : 'Cobrar';
      $('#fila-cliente').hidden = metodo !== 'Fiado';
    };
    const agregar = (codigo, n = 1) => {
      const p = producto(codigo); const l = carrito.find((x) => x.codigo === codigo);
      const actual = l ? l.cantidad : 0;
      if (actual + n > p.existencia) { toast(`Solo quedan ${p.existencia} de ${p.nombre}.`); return; }
      if (l) { l.cantidad += n; if (l.cantidad <= 0) carrito = carrito.filter((x) => x !== l); } else if (n > 0) carrito.push({ codigo, cantidad: n });
      pintarTicket();
    };
    $('#buscar-prod').addEventListener('input', pintarCatalogo);
    $('#catalogo').addEventListener('click', (e) => { const b = e.target.closest('.prod'); if (b) agregar(b.dataset.codigo); });
    $('#lineas').addEventListener('click', (e) => { const m = e.target.closest('[data-mas]'), n = e.target.closest('[data-menos]'); if (m) agregar(m.dataset.mas, 1); if (n) agregar(n.dataset.menos, -1); });
    c.querySelectorAll('input[name=metodo]').forEach((r) => r.addEventListener('change', () => { metodo = r.value; pintarTicket(); }));
    $('#vaciar').addEventListener('click', () => { carrito = []; pintarTicket(); });
    $('#cobrar').addEventListener('click', () => {
      if (!carrito.length) return;
      const lineas = carrito.map((l) => { const p = producto(l.codigo); return { codigo: p.codigo, nombre: p.nombre, cantidad: l.cantidad, precio: p.precio }; });
      const total = r2(lineas.reduce((s, l) => s + l.cantidad * l.precio, 0));
      const venta = { numero: E.siguienteVenta++, fecha: new Date().toISOString(), lineas, metodo, total, cliente: null };
      if (metodo === 'Fiado') {
        const id = $('#cliente-fiado').value; venta.cliente = id;
        E.movimientos.push({ cliente: id, fecha: venta.fecha, tipo: 'Compra fiada', detalle: `Venta #${venta.numero}`, monto: total });
      }
      lineas.forEach((l) => { producto(l.codigo).existencia -= l.cantidad; });
      E.ventas.push(venta); guardar();
      toast(`Venta #${venta.numero} cobrada: ${dinero(total)}${metodo === 'Fiado' ? ' (fiado)' : ''}. La existencia ya bajó.`);
      carrito = []; metodo = 'Efectivo';
      vistas.vender(c);
    });
    pintarCatalogo(); pintarTicket();
  };

  let filtroInv = 'todos';
  vistas.inventario = (c) => {
    const cuenta = { todos: E.productos.length, bajo: E.productos.filter((p) => estado(p) !== 'bien').length, agotado: E.productos.filter((p) => p.existencia === 0).length };
    const valor = r2(E.productos.reduce((s, p) => s + p.existencia * p.costo, 0));
    c.innerHTML = `
      <div class="titulo-fila"><div><h1>Inventario</h1><p class="pequeno">${cuenta.todos} productos · ${dinero(valor)} en mercancía al costo</p></div></div>
      <div class="pestanas" role="tablist" aria-label="Filtrar inventario">
        <button class="pestana" role="tab" data-f="todos" aria-selected="${filtroInv === 'todos'}">Todos ${cuenta.todos}</button>
        <button class="pestana" role="tab" data-f="bajo" aria-selected="${filtroInv === 'bajo'}">Por reponer ${cuenta.bajo}</button>
        <button class="pestana" role="tab" data-f="agotado" aria-selected="${filtroInv === 'agotado'}">Agotados ${cuenta.agotado}</button>
      </div>
      <div class="herramientas"><input class="campo buscar" id="buscar-inv" type="search" placeholder="Buscar producto o código" aria-label="Buscar en el inventario"><span class="derecha" id="conteo"></span></div>
      <table class="tabla"><thead><tr><th>Código</th><th>Producto</th><th class="ocultar-movil">Categoría</th><th class="num">Existencia</th><th class="num ocultar-movil">Precio</th><th>Estado</th><th class="num"><span class="sr-solo">Acción</span></th></tr></thead><tbody id="filas"></tbody></table>`;
    const pintar = () => {
      const q = $('#buscar-inv').value.trim().toLowerCase();
      const lista = E.productos.filter((p) => (filtroInv === 'todos' || (filtroInv === 'bajo' ? estado(p) !== 'bien' : p.existencia === 0)) && (!q || p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)));
      $('#conteo').textContent = `${lista.length} ${lista.length === 1 ? 'producto' : 'productos'}`;
      $('#filas').innerHTML = lista.map((p) => {
        const st = estado(p);
        const pill = st === 'agotado' ? '<span class="pill negativa">Agotado</span>' : st === 'bajo' ? '<span class="pill aviso-p">Bajo el mínimo</span>' : '<span class="pill neutral">Bien</span>';
        const pedir = Math.max(p.minimo * 2 - p.existencia, p.minimo);
        return `<tr><td class="mono">${p.codigo}</td><td>${esc(p.nombre)}</td><td class="ocultar-movil">${esc(p.categoria)}</td>
          <td class="num">${entero(p.existencia)} <span class="unidad">/ ${p.minimo}</span></td><td class="num ocultar-movil">${dinero(p.precio)}</td><td>${pill}</td>
          <td class="num">${st === 'bien' ? '<span class="unidad">–</span>' : `<button type="button" class="boton secundario" data-recibir="${p.codigo}" data-n="${pedir}">Recibir ${pedir}</button>`}</td></tr>`;
      }).join('') || `<tr><td colspan="7" class="vacio">Nada en esta lista. ${filtroInv === 'agotado' ? 'No hay productos agotados.' : ''}</td></tr>`;
    };
    c.querySelectorAll('.pestana').forEach((b) => b.addEventListener('click', () => { filtroInv = b.dataset.f; vistas.inventario(c); }));
    $('#buscar-inv').addEventListener('input', pintar);
    $('#filas').addEventListener('click', (e) => {
      const b = e.target.closest('[data-recibir]'); if (!b) return;
      const p = producto(b.dataset.recibir); const n = Number(b.dataset.n);
      p.existencia += n; guardar(); toast(`Entraron ${n} de ${p.nombre}. Ahora hay ${p.existencia}.`);
      vistas.inventario(c);
    });
    pintar();
  };

  let clienteSel = null;
  vistas.clientes = (c) => {
    const lista = [...E.clientes].sort((a, b) => saldo(b.id) - saldo(a.id));
    if (!clienteSel) clienteSel = lista[0].id;
    const total = r2(lista.reduce((s, x) => s + saldo(x.id), 0));
    const sel = cliente(clienteSel);
    const movs = E.movimientos.filter((m) => m.cliente === sel.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
    const s = saldo(sel.id);
    c.innerHTML = `
      <div class="titulo-fila"><div><h1>Clientes y fiado</h1><p class="pequeno">${dinero(total)} por cobrar entre ${lista.filter((x) => saldo(x.id) > 0).length} clientes</p></div></div>
      <div class="clientes">
        <section class="tarjeta"><div class="tarjeta-cuerpo" style="padding-top:16px">
          <table class="tabla"><thead><tr><th>Cliente</th><th class="num">Debe</th><th class="num ocultar-movil">Límite</th></tr></thead><tbody>
          ${lista.map((x) => { const sx = saldo(x.id); return `<tr class="click${x.id === sel.id ? ' sel' : ''}" data-cliente="${x.id}" tabindex="0" aria-label="Ver a ${esc(x.nombre)}"><td><span class="persona">${avatar(x)}${esc(x.nombre)}</span></td>
            <td class="num">${sx > 0 ? dinero(sx) : '<span class="unidad">$0.00</span>'}${sx > x.limite ? ' <span class="pill negativa">Pasó el límite</span>' : ''}</td><td class="num ocultar-movil unidad">${dineroCorto(x.limite)}</td></tr>`; }).join('')}
          </tbody></table></div></section>
        <section class="tarjeta entra" aria-labelledby="t-cliente">
          <div class="tarjeta-cab"><h2 id="t-cliente"><span class="persona">${avatar(sel)}${esc(sel.nombre)}</span></h2><span class="derecha pequeno">${esc(sel.telefono)}</span></div>
          <div class="tarjeta-cuerpo">
            <div class="balances tarjeta" style="grid-template-columns:repeat(2,1fr);margin-bottom:16px">
              <div class="balance"><p class="etq">Saldo pendiente</p><p class="valor">${dinero(Math.max(0, s))}</p><p class="nota">${s > 0 ? 'Le quedan ' + dinero(Math.max(0, sel.limite - s)) + ' de crédito' : 'Está al día'}</p></div>
              <div class="balance"><p class="etq">Límite de crédito</p><p class="valor">${dinero(sel.limite)}</p><p class="nota">Lo define el dueño</p></div>
            </div>
            <form class="abono" id="form-abono">
              <label class="etiqueta" style="flex:1">Registrar abono
                <input class="campo" id="monto" type="number" inputmode="decimal" min="0.01" step="0.01" placeholder="Monto en dólares" required aria-describedby="ayuda-abono"></label>
              <button class="boton primario" type="submit" ${s <= 0 ? 'disabled' : ''}>Registrar</button>
            </form>
            <p class="pequeno" id="ayuda-abono" style="margin-top:6px">${s > 0 ? 'Hasta ' + dinero(s) + ', lo que debe.' : 'No tiene deuda pendiente.'}</p>
            <h3 style="font-size:14px;font-weight:600;margin:20px 0 8px">Movimientos</h3>
            <table class="tabla"><thead><tr><th>Fecha</th><th>Detalle</th><th class="num">Monto</th></tr></thead><tbody>
            ${movs.map((m) => `<tr><td>${esc(fechaCorta(m.fecha))}</td><td>${esc(m.tipo)} <span class="unidad">· ${esc(m.detalle)}</span></td><td class="num">${m.monto < 0 ? '<span style="color:var(--positive)">' + dinero(m.monto) + '</span>' : dinero(m.monto)}</td></tr>`).join('') || '<tr><td colspan="3" class="vacio">Sin movimientos en estas dos semanas.</td></tr>'}
            </tbody></table>
          </div>
        </section>
      </div>`;
    c.querySelectorAll('[data-cliente]').forEach((tr) => {
      const ir = () => { clienteSel = tr.dataset.cliente; vistas.clientes(c); };
      tr.addEventListener('click', ir); tr.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ir(); } });
    });
    $('#form-abono').addEventListener('submit', (e) => {
      e.preventDefault();
      const m = r2(Number($('#monto').value));
      if (!(m > 0)) return;
      if (m > s) { toast(`El abono no puede pasar de lo que debe (${dinero(s)}).`); return; }
      E.movimientos.push({ cliente: sel.id, fecha: new Date().toISOString(), tipo: 'Abono', detalle: 'Registrado en caja', monto: -m });
      guardar(); toast(`Abono de ${dinero(m)} registrado. Ahora debe ${dinero(r2(s - m))}.`);
      vistas.clientes(c);
    });
  };

  vistas.reportes = (c) => {
    const d = porDia();
    const total = r2(d.reduce((s, x) => s + x.total, 0));
    const tickets = d.reduce((s, x) => s + x.tickets, 0);
    const desde = HOY - 13 * 864e5;
    const ventas = E.ventas.filter((v) => dia(v.fecha) >= desde);
    const costo = r2(ventas.reduce((s, v) => s + v.lineas.reduce((a, l) => a + l.cantidad * (producto(l.codigo)?.costo ?? 0), 0), 0));
    const porProd = {};
    ventas.forEach((v) => v.lineas.forEach((l) => { porProd[l.nombre] = r2((porProd[l.nombre] || 0) + l.cantidad * l.precio); }));
    const top = Object.entries(porProd).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value }));
    const metodos = ['Efectivo', 'Yappy', 'Tarjeta', 'Fiado'].map((m) => { const vs = ventas.filter((v) => v.metodo === m); return { m, n: vs.length, t: r2(vs.reduce((s, v) => s + v.total, 0)) }; });
    console.assert(Math.abs(metodos.reduce((s, x) => s + x.t, 0) - total) < 0.01, 'Los métodos de pago no suman el total');
    console.assert(metodos.reduce((s, x) => s + x.n, 0) === tickets, 'Los tickets no cuadran');
    const mejor = d.reduce((a, b) => (b.total > a.total ? b : a));
    c.innerHTML = `
      <div class="titulo-fila"><div><h1>Reportes</h1><p class="pequeno">Del ${esc(fechaCorta(d[0].t))} al ${esc(fechaCorta(d.at(-1).t))}</p></div>
        <div class="derecha"><button type="button" class="boton secundario" id="exportar">Descargar para el contador</button></div></div>
      <div class="rejilla">
        <section class="tarjeta balances" aria-label="Totales de las dos semanas">
          <div class="balance"><p class="etq">Ventas</p><p class="valor">${dinero(total)}</p><p class="nota">${tickets} tickets</p></div>
          <div class="balance"><p class="etq">Ticket promedio</p><p class="valor">${dinero(tickets ? r2(total / tickets) : 0)}</p><p class="nota">Por cliente</p></div>
          <div class="balance"><p class="etq">Ganancia sobre el costo</p><p class="valor">${dinero(r2(total - costo))}</p><p class="nota">${total ? Math.round(((total - costo) / total) * 100) : 0}% de lo vendido</p></div>
          <div class="balance"><p class="etq">Mejor día</p><p class="valor">${dinero(mejor.total)}</p><p class="nota">${esc(new Date(mejor.t).toLocaleDateString('es-PA', { weekday: 'long', day: 'numeric' }))}</p></div>
        </section>
        <section class="tarjeta"><div class="tarjeta-cab"><h2>Ventas por día</h2><span class="derecha pequeno">Hoy en color</span></div><div class="grafica" id="g-dias"></div></section>
        <div class="rejilla dos">
          <section class="tarjeta"><div class="tarjeta-cab"><h2>Lo que más se vende</h2></div><div class="tarjeta-cuerpo" id="g-top"></div></section>
          <section class="tarjeta"><div class="tarjeta-cab"><h2>Por forma de pago</h2></div><div class="tarjeta-cuerpo">
            <table class="tabla"><thead><tr><th>Forma de pago</th><th class="num">Tickets</th><th class="num">Monto</th></tr></thead><tbody>
            ${metodos.map((x) => `<tr><td>${x.m}</td><td class="num">${x.n}</td><td class="num">${dinero(x.t)}</td></tr>`).join('')}
            <tr><td><b style="font-weight:600">Total</b></td><td class="num"><b style="font-weight:600">${tickets}</b></td><td class="num"><b style="font-weight:600">${dinero(total)}</b></td></tr>
            </tbody></table></div></section>
        </div>
      </div>`;
    Charts.bars($('#g-dias'), { labels: d.map((x) => fechaCorta(x.t)), values: d.map((x) => x.total), highlight: d.length - 1, format: dinero, tickFormat: dineroCorto, height: 220 });
    Charts.barList($('#g-top'), top, { format: dinero });
    $('#exportar').addEventListener('click', () => {
      const filas = [['Ticket', 'Fecha', 'Forma de pago', 'Total']].concat(ventas.map((v) => [v.numero, new Date(v.fecha).toLocaleString('es-PA'), v.metodo, v.total.toFixed(2)]));
      const csv = filas.map((f) => f.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = 'ventas-ferreteria-el-faro.csv'; a.click();
      toast('Se descargó el archivo de ventas para Excel.');
    });
  };

  // ---------- navegación ----------
  const contenido = $('#contenido');
  function ir() {
    const v = (location.hash || '#resumen').slice(1);
    const vista = vistas[v] ? v : 'resumen';
    document.querySelectorAll('.menu a').forEach((a) => { if (a.dataset.vista === vista) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    contenido.classList.remove('entra'); void contenido.offsetWidth; contenido.classList.add('entra');
    vistas[vista](contenido);
    $('#guia-cuerpo').innerHTML = GUIAS[vista];
    contenido.scrollTop = 0;
    cerrarMenu();
  }
  const lateral = $('#lateral'), botonMenu = $('#abrir-menu');
  const cerrarMenu = () => { lateral.classList.remove('abierto'); botonMenu.setAttribute('aria-expanded', 'false'); };
  botonMenu.addEventListener('click', () => { const a = lateral.classList.toggle('abierto'); botonMenu.setAttribute('aria-expanded', a); });
  $('#reiniciar').addEventListener('click', () => {
    localStorage.removeItem(CLAVE); E = copia(window.DATOS_INICIALES); carrito = []; clienteSel = null;
    toast('La demostración volvió a sus datos de ejemplo.'); ir();
  });
  window.addEventListener('hashchange', ir);
  ir();
})();
