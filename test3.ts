fetch("http://localhost:3000/api/table/Finanzas").then(r => r.json()).then(d => {
  if (d.data && d.data.length > 0) {
    console.log(JSON.stringify(d.data.slice(0, 5), null, 2));
  } else {
    console.log(d);
  }
});
