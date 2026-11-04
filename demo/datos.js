// Datos de ejemplo de la Ferretería El Faro (negocio inventado para la demostración).
// Todo se calcula a partir de estas filas: los totales nunca se escriben a mano.
window.DATOS_INICIALES = (() => {
  const productos = [
    // codigo, nombre, categoria, precio, costo, existencia, minimo
    ['FE-0101', 'Cemento gris 42.5 kg', 'Construcción', 9.75, 7.9, 34, 20],
    ['FE-0102', 'Bloque de 4 pulgadas', 'Construcción', 0.65, 0.42, 410, 300],
    ['FE-0103', 'Arena lavada (saco)', 'Construcción', 3.5, 2.2, 12, 15],
    ['FE-0104', 'Varilla corrugada 3/8"', 'Construcción', 5.25, 3.95, 46, 30],
    ['FE-0105', 'Zinc acanalado 10 pies', 'Construcción', 14.9, 11.2, 6, 10],
    ['FE-0201', 'Tubo PVC 1/2" 6 m', 'Plomería', 3.4, 2.1, 58, 25],
    ['FE-0202', 'Codo PVC 1/2"', 'Plomería', 0.35, 0.15, 220, 100],
    ['FE-0203', 'Llave de paso 1/2"', 'Plomería', 6.8, 4.3, 9, 12],
    ['FE-0204', 'Pegamento PVC 1/4 gal', 'Plomería', 7.5, 5.1, 14, 10],
    ['FE-0205', 'Teflón 3/4"', 'Plomería', 0.75, 0.3, 0, 40],
    ['FE-0301', 'Cable THHN #12 (metro)', 'Electricidad', 0.85, 0.55, 380, 200],
    ['FE-0302', 'Tomacorriente doble', 'Electricidad', 2.95, 1.6, 27, 20],
    ['FE-0303', 'Bombillo LED 9 W', 'Electricidad', 1.95, 0.95, 64, 40],
    ['FE-0304', 'Breaker 20 A', 'Electricidad', 8.9, 6.2, 4, 8],
    ['FE-0305', 'Cinta aislante', 'Electricidad', 1.1, 0.45, 75, 30],
    ['FE-0401', 'Pintura blanca 1 gal', 'Pintura', 18.5, 13.4, 22, 12],
    ['FE-0402', 'Pintura de aceite 1/4 gal', 'Pintura', 8.25, 5.6, 11, 8],
    ['FE-0403', 'Brocha de 3"', 'Pintura', 2.75, 1.3, 30, 15],
    ['FE-0404', 'Rodillo con bandeja', 'Pintura', 6.5, 3.9, 3, 6],
    ['FE-0405', 'Diluyente 1 gal', 'Pintura', 9.9, 7.1, 8, 6],
    ['FE-0501', 'Martillo de uña 16 oz', 'Herramientas', 9.5, 5.8, 13, 6],
    ['FE-0502', 'Juego de destornilladores', 'Herramientas', 12.9, 7.4, 7, 5],
    ['FE-0503', 'Cinta métrica 5 m', 'Herramientas', 4.75, 2.4, 18, 10],
    ['FE-0504', 'Tornillos 1 1/2" (libra)', 'Herramientas', 3.25, 1.8, 26, 15],
  ].map(([codigo, nombre, categoria, precio, costo, existencia, minimo]) => ({ codigo, nombre, categoria, precio, costo, existencia, minimo }));

  const clientes = [
    { id: 'C01', nombre: 'Constructora Hermanos Díaz', telefono: '6612-4410', limite: 800 },
    { id: 'C02', nombre: 'Ricardo Barrios', telefono: '6745-2093', limite: 200 },
    { id: 'C03', nombre: 'Taller Eléctrico Ríos', telefono: '6588-7731', limite: 400 },
    { id: 'C04', nombre: 'Yaritza Mendoza', telefono: '6921-3380', limite: 150 },
    { id: 'C05', nombre: 'Pinturas y Acabados Gatún', telefono: '6630-9182', limite: 500 },
    { id: 'C06', nombre: 'Luis Ábrego', telefono: '6704-5526', limite: 100 },
  ];

  // Generador con semilla: la demo se ve igual cada vez que se reinicia.
  let semilla = 20261104;
  const azar = () => ((semilla = (semilla * 1103515245 + 12345) % 2147483648) / 2147483648);
  const elegir = (lista) => lista[Math.floor(azar() * lista.length)];

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const DIAS = 14;
  const ventas = [];
  const movimientos = []; // fiado y abonos por cliente
  let numero = 1001;
  const metodos = ['Efectivo', 'Efectivo', 'Efectivo', 'Yappy', 'Yappy', 'Tarjeta', 'Fiado'];

  for (let d = DIAS - 1; d >= 0; d--) {
    const fecha = new Date(hoy); fecha.setDate(hoy.getDate() - d);
    const domingo = fecha.getDay() === 0;
    const sabado = fecha.getDay() === 6;
    const n = d === 0 ? 9 : domingo ? 4 + Math.floor(azar() * 3) : sabado ? 15 + Math.floor(azar() * 5) : 10 + Math.floor(azar() * 6);
    for (let k = 0; k < n; k++) {
      let hora = new Date(fecha); hora.setHours(7 + Math.floor((k / n) * 10), Math.floor(azar() * 60));
      // las ventas de hoy nunca quedan en el futuro
      const tope = new Date(Date.now() - (n - k) * 9 * 60000);
      if (d === 0 && hora > tope) hora = tope;
      const lineas = [];
      const cuantas = 1 + Math.floor(azar() * 3);
      for (let j = 0; j < cuantas; j++) {
        const p = elegir(productos);
        if (lineas.some((l) => l.codigo === p.codigo)) continue;
        const cant = p.precio < 1 ? 5 + Math.floor(azar() * 30) : 1 + Math.floor(azar() * 3);
        lineas.push({ codigo: p.codigo, nombre: p.nombre, cantidad: cant, precio: p.precio });
      }
      const metodo = elegir(metodos);
      const total = Math.round(lineas.reduce((s, l) => s + l.cantidad * l.precio, 0) * 100) / 100;
      const venta = { numero: numero++, fecha: hora.toISOString(), lineas, metodo, total, cliente: null };
      if (metodo === 'Fiado') {
        const c = elegir(clientes);
        venta.cliente = c.id;
        movimientos.push({ cliente: c.id, fecha: venta.fecha, tipo: 'Compra fiada', detalle: `Venta #${venta.numero}`, monto: total });
      }
      ventas.push(venta);
    }
  }
  // Algunos abonos recibidos durante las dos semanas.
  clientes.forEach((c, i) => {
    const deuda = movimientos.filter((m) => m.cliente === c.id).reduce((s, m) => s + m.monto, 0);
    if (deuda > 0 && i % 2 === 0) {
      const f = new Date(hoy); f.setDate(hoy.getDate() - (3 + i)); f.setHours(16, 20);
      movimientos.push({ cliente: c.id, fecha: f.toISOString(), tipo: 'Abono', detalle: 'Pago en efectivo', monto: -Math.round(deuda * 0.5 * 100) / 100 });
    }
  });

  return { productos, clientes, ventas, movimientos, siguienteVenta: numero };
})();
