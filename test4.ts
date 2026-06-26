fetch("http://localhost:3000/api/table/Finanzas").then(r => r.json()).then(d => {
  if (d.data) {
    const tipos = new Set(d.data.map((r:any) => r.fields.Tipo));
    const categorias = new Set(d.data.map((r:any) => r.fields.Categoría));
    console.log("Tipos", Array.from(tipos));
    console.log("Categorías", Array.from(categorias));
  } else {
    console.log(d);
  }
});
