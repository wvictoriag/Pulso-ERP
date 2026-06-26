fetch("http://localhost:3000/api/tables?full=true").then(r => r.json()).then(d => {
  const finanzas = d.tables.find(t => t.name.includes("Finanzas"));
  if (finanzas) {
    console.log("Tipo Field:", JSON.stringify(finanzas.fields.find(f => f.name === "Tipo")?.options, null, 2));
    console.log("Categoría Field:", JSON.stringify(finanzas.fields.find(f => f.name === "Categoría")?.options, null, 2));
  } else {
    console.log("No finanzas table found");
  }
});
