(() => {
  const WA = '50766952340';
  const dinero = (n) => '$' + n.toLocaleString('en-US');

  // Filtros de trabajos
  const filtros = document.querySelectorAll('.filtro');
  const tiras = document.querySelectorAll('.tira');
  filtros.forEach((b) => b.addEventListener('click', () => {
    const f = b.dataset.filtro;
    filtros.forEach((x) => {
      const on = x === b;
      x.classList.toggle('activo', on);
      x.setAttribute('aria-pressed', on);
    });
    tiras.forEach((t) => {
      t.hidden = f !== 'todo' && !t.dataset.tipo.split(' ').includes(f);
    });
  }));

  // Detalle de servicios
  const detalle = document.querySelector('.detalle');
  const textoBase = detalle ? detalle.textContent : '';
  document.querySelectorAll('.col li').forEach((li) => {
    li.tabIndex = 0;
    const mostrar = () => {
      document.querySelectorAll('.col li.activo').forEach((x) => x.classList.remove('activo'));
      li.classList.add('activo');
      if (detalle) detalle.textContent = li.textContent + ': ' + li.dataset.desc;
    };
    li.addEventListener('mouseenter', mostrar);
    li.addEventListener('focus', mostrar);
  });
  const cols = document.querySelector('.cols');
  if (cols && detalle) cols.addEventListener('mouseleave', () => {
    document.querySelectorAll('.col li.activo').forEach((x) => x.classList.remove('activo'));
    detalle.textContent = textoBase;
  });

  // Arma tu proyecto
  const menu = document.getElementById('menu');
  const total = document.getElementById('total');
  const mensual = document.getElementById('mensual');
  const nota = document.getElementById('cuenta-nota');
  const enviar = document.getElementById('enviar');
  const calcular = () => {
    const marcados = [...menu.querySelectorAll('input:checked')];
    let unico = 0, mes = 0, desde = false;
    const lineas = [];
    marcados.forEach((i) => {
      const v = Number(i.value);
      if (i.name === 'm') { mes += v; lineas.push(`• ${i.dataset.nombre} (${dinero(v)} al mes)`); }
      else {
        unico += v;
        if (i.dataset.desde) desde = true;
        lineas.push(`• ${i.dataset.nombre} (${i.dataset.desde ? 'desde ' : ''}${dinero(v)})`);
      }
    });
    total.textContent = (desde ? 'desde ' : '') + dinero(unico);
    mensual.textContent = mes ? `+ ${dinero(mes)} al mes` : '';
    nota.textContent = marcados.length
      ? `${marcados.length} ${marcados.length === 1 ? 'servicio marcado' : 'servicios marcados'}. Precio de referencia; el final va en la cotización.`
      : 'Aún no has marcado nada.';
    let msg = 'Hola D.E.K NovaCore, quiero cotizar un proyecto.';
    if (lineas.length) {
      msg += '\n\nMe interesa:\n' + lineas.join('\n') +
        `\n\nTotal aproximado: ${desde ? 'desde ' : ''}${dinero(unico)}` + (mes ? ` + ${dinero(mes)} al mes` : '') +
        '\n\nMi negocio es: ';
    }
    enviar.href = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
  };
  if (menu) { menu.addEventListener('change', calcular); calcular(); }

  // Entradas al hacer scroll
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) document.querySelectorAll('video[autoplay]').forEach((v) => { v.removeAttribute('autoplay'); v.pause(); });
  const grupos = [
    ['.hero', '.hero-frase, .hero-boton, .marca, .nav'],
    ['.riel', 'h2, .filtros'],
    ['.tira', '.tira-fotos img, .tira-pie'],
    ['.servicios', 'h2, .col, .detalle'],
    ['.precios', 'h2, .precios-intro, .cuenta, fieldset'],
    ['.panel', '.panel-texto'],
    ['.preguntas', 'h2, .datos, details, .acciones, .alta, .cuadrada'],
    ['.tarjeta', 'h2, p, .horario, .boton'],
    ['.pie', '.pie-marca, .pie-linea'],
  ];
  const piezas = [];
  grupos.forEach(([sel, hijos]) => {
    document.querySelectorAll(sel).forEach((raiz) => {
      raiz.querySelectorAll(hijos).forEach((el, i) => {
        el.classList.add('rev');
        el.style.setProperty('--d', Math.min(i, 8) * 75 + 'ms');
        piezas.push(el);
      });
    });
  });
  if (reduce || !('IntersectionObserver' in window)) {
    piezas.forEach((el) => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  piezas.forEach((el) => io.observe(el));
  // Red de seguridad: nada se queda oculto
  setTimeout(() => piezas.forEach((el) => el.classList.add('in')), 6000);
})();
