const input = document.getElementById('imageInput');
const preview = document.getElementById('preview');
const progress = document.getElementById('progress');
const resultDiv = document.getElementById('result');
const ocrTextEl = document.getElementById('ocrText');
const mathExpressionsEl = document.getElementById('mathExpressions');
const solutionsEl = document.getElementById('solutions');
const captionEl = document.getElementById('caption');

input.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Vorschau anzeigen
  const reader = new FileReader();
  reader.onload = e => { preview.src = e.target.result; };
  reader.readAsDataURL(file);

  progress.textContent = '📖 Analysiere Bild... bitte warten.';
  resultDiv.classList.add('hidden');

  // OCR starten
  const { data: { text } } = await Tesseract.recognize(file, 'deu+eng', {
    logger: m => {
      if (m.status === 'recognizing text') {
        progress.textContent = `🔍 Texterkennung: ${(m.progress * 100).toFixed(1)}%`;
      }
    }
  });

  // OCR Ergebnis anzeigen
  ocrTextEl.textContent = text.trim();
  progress.textContent = 'Texterkennung abgeschlossen.';

  // Matheausdrücke suchen
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const mathLike = lines.filter(l => /[0-9][0-9\s\+\-\*\/\=\^\(\)xX]/.test(l));

  mathExpressionsEl.textContent = mathLike.length ? mathLike.join('\n') : '(Keine gefunden)';

  // Ausdrücke mit math.js lösen
  const solutions = [];
  mathLike.forEach(expr => {
    try {
      const clean = expr.replace('×', '*').replace('÷', '/').replace('^', '**');
      if (clean.includes('=')) {
        // einfache Gleichungen wie "x + 2 = 5"
        const [lhs, rhs] = clean.split('=');
        const node = math.parse(lhs + " - (" + rhs + ")");
        const sol = math.solve(node, 'x');
        solutions.push(`${expr} → x = ${sol}`);
      } else {
        const val = math.evaluate(clean);
        solutions.push(`${expr} = ${val}`);
      }
    } catch (e) {
      solutions.push(`${expr} → (Fehler beim Lösen: ${e.message})`);
    }
  });

  solutionsEl.textContent = solutions.length ? solutions.join('\n') : '(Keine Lösungen)';

  // einfache Beschreibung (heuristisch)
  let caption = "Das Bild enthält Text.";
  if (mathLike.length > 0) caption += " Es scheint mathematische Ausdrücke zu enthalten.";
  if (text.toLowerCase().includes("gleichung") || text.includes("=")) caption += " Möglicherweise eine Gleichung.";
  captionEl.textContent = caption;

  resultDiv.classList.remove('hidden');
});
