fetch("http://localhost:3000/api/table/Finanzas", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    records: [{
      fields: {
         "Descripción": "Testing Ingreso",
         "Tipo": "↗️ Ingreso",
         "Categoría": "Ventas",
         "Monto": 100,
         "Fecha": "2026-07-20"
      }
    }]
  })
}).then(r => r.json()).then(console.log);
