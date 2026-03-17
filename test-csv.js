const text = `"Submission ID","Respondent ID","Submitted at","Seleccionar Participante","1)3ro en la qualy (1 pto)","2)2do en la qualy (1 pto)","3)1ro en la qualy (2 pto)","4) Que pilotos quedan eliminados en Q1(0,5 pto)","5) Que pilotos abandonaron la carrera (1 pto)","6)3ro en la carrera del domingo (1 pto)","7)2do en la carrera del domingo (2 pto)","8)1ro en la carrera del domingo (3 pto)","9) Se levanta bandera roja en la carrera (1 pto)","10)Quien gana entre Norris y Piastri (2pto)"\n"2EMpQVg","2ELKkqg","2026-03-07 02:55:06","Olivia","Max Verstappen (Red Bull Racing)","Charles Leclerc (Scuderia Ferrari)","George Russell (Mercedes)","Oliver Bearman (Haas), Lance Stroll (Aston Martin), Fernando Alonso (Aston Martin), Franco Colapinto (Alpine), Valtteri Bottas (Cadillac), Arvid Lindblad (Racing Bulls)","Fernando Alonso (Aston Martin), Lance Stroll (Aston Martin)","Max Verstappen (Red Bull Racing)","Lewis Hamilton (Scuderia Ferrari)","George Russell (Mercedes)","Si","Lando Norris (McLaren)"`;

const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
const parseLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

const headers = parseLine(lines[0]);
console.log("Headers:", headers);
const data = lines.slice(1).map(line => {
  const values = parseLine(line);
  const obj = {};
  headers.forEach((header, i) => {
    obj[header] = values[i];
  });
  return obj;
});
console.log("Data length:", data.length);
console.log("First row Participant:", data[0]['Seleccionar Participante']);
console.log("First row Q1:", data[0]['1)3ro en la qualy (1 pto)']);
