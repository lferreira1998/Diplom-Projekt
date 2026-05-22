// x, y = pixel center on the 1700 × 1000 canvas.
// Figma-visible nodes use exact coordinates derived from the Figma frame.
// Remaining nodes extend the map logically to the right / bottom.

export type NodeType = "main" | "sub";

export type Node = {
  id: string;
  label: string;
  nodeType: NodeType;
  x: number;
  y: number;
  title: string;
  body: string[];
  connections?: { to: string }[];
  reveals?: string[];
  initiallyVisible?: boolean;
};

export const nodes: Node[] = [

  // ── MAIN 01 ───────────────────────────────────────────────────────────────
  {
    id: "start",
    label: "Die Spannung zwischen\nDenken & Schreiben",
    nodeType: "main",
    x: 197, y: 191,
    title: "Die Spannung zwischen\nDenken & Schreiben",
    body: [
      "Ich meditiere seit einiger Zeit regelmäßig. Gedanken tauchen auf: fragmentarisch, ungeordnet, unkontrolliert, zeitlich ungleichmäßig.",
      "Gleichzeitig schreibe ich viel, um Gedanken zu strukturieren, festzuhalten, aus dem Kopf zu bringen.",
      "Durch beide Praktiken wurde mir eine fundamentale Spannung bewusst:",
      "DENKEN IST",
      "fragmentarisch · zeitlich · nicht-linear",
      "unkontrolliert · überlagernd · verschwindend",
      "nicht immer sprachlich, bildlich, körperlich, präverbal",
      "SCHREIBEN MACHT GEDANKEN",
      "stabil · linear · dauerhaft",
      "korrigierbar · kontrollierbar · löschbar",
      "sofort sichtbar · jederzeit editierbar",
    ],
    initiallyVisible: true,
    reveals: ["erste_frage"],
    connections: [{ to: "erste_frage" }],
  },

  // ── MAIN 02 ───────────────────────────────────────────────────────────────
  {
    id: "erste_frage",
    label: "Wie Denken\nsichtbar machen?",
    nodeType: "main",
    x: 608, y: 292,
    title: "Wie lässt sich Denken gestalterisch sichtbar machen?",
    body: [
      "Die erste Frage war formal: Wie kann man die Flüchtigkeit, das Überlagern, das plötzliche Auftauchen von Gedanken sichtbar machen?",
      "Erste Recherche: Wer hat das schon versucht?",
      "Drei Vorläufer zeigten sich: Surrealismus, Konkrete Poesie, Stream of Consciousness. Alle wollten Denken im Schreiben sichtbar machen.",
      "Aber beim Nachvollziehen bemerkte ich: Sie veränderten das Denken durch ihr Medium. Das warf eine neue Frage auf.",
    ],
    reveals: ["erkenntnis", "surrealismus", "konkrete", "stream"],
    connections: [
      { to: "erkenntnis" },
      { to: "surrealismus" },
      { to: "konkrete" },
      { to: "stream" },
    ],
  },

  // ── MAIN 03 ───────────────────────────────────────────────────────────────
  {
    id: "erkenntnis",
    label: "Das Medium formt\ndas Denken",
    nodeType: "main",
    x: 608, y: 481,
    title: "Das Interface verändert das Denken selbst",
    body: [
      "Beim Bauen erster Experimente bemerkte ich: Denkprozesse ungefiltert sichtbar zu machen ist gar nicht möglich.",
      "Sobald ich das Medium verändere, verändere ich das Denken selbst.",
      "Die Interfaces zeigen Denken nicht nur, sie formen es aktiv.",
      "Verschobene Frage: Wie verändern sich Gedankenbewegungen, wenn ich die Regeln von Schreibinterfaces verändere?",
    ],
    reveals: ["these", "medientheorie", "kognition", "danger"],
    connections: [
      { to: "these" },
      { to: "kognition" },
      { to: "medientheorie" },
      { to: "danger" },
    ],
  },

  // ── MAIN 04 ───────────────────────────────────────────────────────────────
  {
    id: "these",
    label: "Schreibtools sind\nnie neutral",
    nodeType: "main",
    x: 940, y: 380,
    title: "Schreibtools sind nie neutrale Speichermedien",
    body: [
      "Schreibtools sind nie neutrale Speichermedien für Gedanken. Durch ihre Regeln, ihre Sichtbarkeit und ihre zeitlichen Bedingungen formen sie aktiv mit, was und wie gedacht wird.",
      "Solange alles gleich bleibt, merkt man das Medium nicht. Erst wenn sich die Regeln ändern, wird sichtbar dass sie schon immer da waren.",
      "Alle Standard-Interfaces folgen fünf Grundregeln, entworfen, nicht gefunden.",
    ],
    reveals: ["experimente", "regeln", "geschichte", "methode"],
    connections: [
      { to: "experimente" },
      { to: "regeln" },
      { to: "geschichte" },
      { to: "methode" },
    ],
  },

  // ── MAIN 05 ───────────────────────────────────────────────────────────────
  {
    id: "experimente",
    label: "Die Experimente",
    nodeType: "main",
    x: 1110, y: 680,
    title: "Sieben experimentelle Schreibinterfaces",
    body: [
      "Die Experimente spielen mit fünf Parametern:",
      "ZEIT · SICHTBARKEIT · STABILITÄT · KONTROLLE · AUFMERKSAMKEIT",
      "Diese Parameter entstanden aus der Beobachtung, nicht aus der Theorie.",
      "Im Standard-Interface: Zeit unsichtbar, Text permanent, Kontrolle total, Aufmerksamkeit immer auf den Text.",
      "Jedes Experiment verändert genau eine oder mehrere dieser Regeln, und beobachtet was das mit dem Schreiben und Denken macht.",
    ],
    reveals: ["projekt", "uninvited", "unsichtbar", "cursor", "tippex", "version", "raum3d", "spirale"],
    connections: [
      { to: "projekt" },
      { to: "uninvited" },
      { to: "unsichtbar" },
      { to: "cursor" },
      { to: "tippex" },
      { to: "version" },
      { to: "raum3d" },
      { to: "spirale" },
    ],
  },

  // ── MAIN 06 ───────────────────────────────────────────────────────────────
  {
    id: "projekt",
    label: "Shaping Thought",
    nodeType: "main",
    x: 1340, y: 460,
    title: "Das Projekt: drei Teile",
    body: [
      "ABOUT  Die Geschichte der Schreibinterface-Regeln: woher sie kommen, was sie mit dem Denken machen. Nicht als langer Text. Als visuell erfahrbare Geschichte.",
      "EXPERIMENTS  Die sieben experimentellen Interfaces. Gleichzeitig Ergebnis der Forschung und Grundlage für das parametrische Tool.",
      "CREATE YOUR OWN  Das parametrische Tool. Eigene Interfaces bauen, benennen, speichern, teilen.",
      "Diese Erkenntnis lässt sich nicht lesen. Sie muss erlebt werden.",
    ],
    reveals: ["tool", "behauptung"],
    connections: [
      { to: "tool" },
      { to: "behauptung" },
    ],
  },

  // ── SUB — from erste_frage ────────────────────────────────────────────────
  {
    id: "konkrete",
    label: "Konkrete Poesie",
    nodeType: "sub",
    x: 811, y: 167,
    title: "Konkrete Poesie: Schrift als Material",
    body: [
      "Gomringer, Jandl. Schrift als visuelles und prozessuales Material.",
      "Sie arbeiteten mit Schreibmaschinen weil diese jeden Buchstaben gleich behandeln; eine bewusste Entscheidung für das Neutrale. Die Form ist der Inhalt.",
    ],
  },
  {
    id: "surrealismus",
    label: "Automatisches Schreiben",
    nodeType: "sub",
    x: 960, y: 219,
    title: "Surrealismus: Den Zensor ausschalten",
    body: [
      "Automatisches Schreiben: ungefiltert schreiben, den inneren Zensor umgehen.",
      "Direkter Vorläufer, aber anderes Ziel: Sie wollten eine bestimmte Art des Denkens erzwingen. Ich untersuche, was verschiedene Regeln mit verschiedenen Arten des Denkens machen.",
    ],
  },
  {
    id: "stream",
    label: "Stream of Consciousness",
    nodeType: "sub",
    x: 926, y: 316,
    title: "Stream of Consciousness",
    body: [
      "Virginia Woolf, James Joyce. Sprache die die Bewegung des Geistes nachahmt statt sie zu ordnen.",
      "Kein chronologischer Bericht, sondern ein gleichzeitiges Vorhandensein von Vergangenem, Gegenwärtigem, Imaginiertem.",
    ],
  },

  // ── SUB — from erkenntnis ─────────────────────────────────────────────────
  {
    id: "kognition",
    label: "Tippen & Handschrift",
    nodeType: "sub",
    x: 262, y: 430,
    title: "Tippen, Sprache, Default Mode",
    body: [
      "Mueller & Oppenheimer (2014): Tippen ist direkter am ungefilterten Gedanken; der motorische Prozess bindet weniger kognitive Ressourcen als Handschrift.",
      "Sapir-Whorf (schwache Version): Sprache und Medium beeinflussen wie wir denken, nicht determinieren, aber beeinflussen.",
    ],
  },
  {
    id: "medientheorie",
    label: "McLuhan",
    nodeType: "sub",
    x: 323, y: 546,
    title: "Das Medium formt den Denkenden",
    body: [
      "McLuhan: Das Medium formt nicht nur die Botschaft, sondern den Denkenden selbst.",
      "Kittler, Aufschreibesysteme: Das technische Medium bestimmt was gedacht und geschrieben werden kann.",
      "Walter Ong: Schrift hat das Bewusstsein fundamental verändert. Digitale Interfaces sind die nächste Stufe.",
    ],
  },
  {
    id: "danger",
    label: "Most Dangerous Writing App",
    nodeType: "sub",
    x: 490, y: 620,
    title: "Manuel Ebert: Direkter Vorläufer",
    body: [
      "Text verschwindet nach 5 Sekunden Pause. Ziel: Flow erzwingen, Produktivität steigern.",
      "Mein Projekt: anderes Ziel. Nicht eine Art des Schreibens erzwingen, sondern erfahrbar machen, dass das Medium immer schon eine Art erzwingt.",
    ],
  },

  // ── SUB — from these ──────────────────────────────────────────────────────
  {
    id: "geschichte",
    label: "Xerox PARC, 1974",
    nodeType: "sub",
    x: 1040, y: 268,
    title: "Woher kommen diese Regeln?",
    body: [
      "Diese Regeln wurden entworfen, nicht gefunden.",
      "1974: Xerox PARC imitiert mit Bravo die Schreibmaschine für WYSIWYG-Drucktreue.",
      "1975: Cut/Copy/Paste entsteht bei Xerox um Zeit zu sparen.",
      "Der blinkende Cursor kommt aus der GUI-Forschung um Fehler zu reduzieren.",
      "Diese Entscheidungen wurden aus ökonomischen Gründen getroffen, nicht um das Denken zu fördern.",
    ],
  },
  {
    id: "regeln",
    label: "Die fünf Grundregeln",
    nodeType: "sub",
    x: 1080, y: 450,
    title: "Welche Regeln machen Standardinterfaces aus?",
    body: [
      "1. LINEARITÄT  Text fließt links nach rechts. Kein Gedanke landet außerhalb der Linie.",
      "2. EDITIERBARKEIT  Jeder Buchstabe sofort löschbar, ohne Spuren, ohne Zeitlichkeit.",
      "3. SOFORTIGES FEEDBACK  Buchstaben materialisieren sich direkt nach jedem Tastendruck.",
      "4. KONTROLLE  Vollständige Herrschaft über Sprache: Umschreiben, Speichern, Kopieren.",
      "5. AUFMERKSAMKEIT  Der gesamte Text bleibt sichtbar. Der Cursor kanalisiert den Fokus.",
    ],
  },
  {
    id: "methode",
    label: "Research through Design",
    nodeType: "sub",
    x: 760, y: 565,
    title: "Künstlerisch-gestalterische Forschung",
    body: [
      "Ich verändere das Medium und beobachte mein eigenes Denken und Schreiben dabei.",
      "Das Projekt erhebt keinen wissenschaftlichen Anspruch; untersucht werden die gestalteten Bedingungen unter denen Denken beim Schreiben stattfindet.",
      "Die Experimente sind gleichzeitig Ergebnis und Forschungsgrundlage.",
    ],
  },

  // ── SUB — from experimente ────────────────────────────────────────────────
  {
    id: "uninvited",
    label: "01 Uninvited Thoughts",
    nodeType: "sub",
    x: 930, y: 800,
    title: "Uninvited Thoughts: Aufmerksamkeit",
    body: [
      "Ein Punkt bewegt sich über die Fläche. Sobald ein Gedanke auftaucht, schreib ihn auf, fokussiere dich wieder.",
      "Ergebnis: eine Karte spontan auftauchender Gedanken. Fragmentarisch, ungeordnet, ohne Hierarchie. Das stärkste Experiment.",
    ],
  },
  {
    id: "unsichtbar",
    label: "02 Unsichtbares Schreiben",
    nodeType: "sub",
    x: 1040, y: 845,
    title: "Unsichtbares Schreiben mit Playback",
    body: [
      "Man schreibt ohne zu sehen was man schreibt. Nach dem Fertigstellen erscheint der Text im genauen Schreibtempo.",
      "Das Playback erzeugt einen Beichtstuhl-Effekt: Man beobachtet sich selbst beim Denken.",
    ],
  },
  {
    id: "cursor",
    label: "03 Cursor läuft weiter",
    nodeType: "sub",
    x: 1160, y: 878,
    title: "Pausen werden Leerzeichen",
    body: [
      "Der Cursor läuft kontinuierlich weiter, auch wenn man nicht schreibt. Pausen werden räumlich sichtbar als Lücken.",
      "Zeit wird direkt erfahrbar. Man schreibt spontaner, weil die sichtbare Zeit Druck erzeugt, ohne Angst vor Verlust.",
    ],
  },
  {
    id: "tippex",
    label: "04 Tipp-Ex",
    nodeType: "sub",
    x: 1280, y: 845,
    title: "Löschen hinterlässt Spuren",
    body: [
      "Löschen hinterlässt eine weiße Fläche mit 95% Deckkraft, wie Tipp-Ex. Der ursprüngliche Text bleibt darunter.",
      "Das Nicht-Entschiedene bleibt sichtbar. Das Dokument wird zur Landschaft aus Entscheidungen.",
    ],
  },
  {
    id: "version",
    label: "05 Versionsverlauf",
    nodeType: "sub",
    x: 1375, y: 780,
    title: "Den Denkprozess zurückdrehen",
    body: [
      "Durch Zurückdrehen der Uhr sieht man alle früheren Versionen: das erste Auftauchen, das Zögern, die Entscheidung.",
      "Das vollständigste Experiment: Es dokumentiert nicht nur das Ergebnis, sondern den gesamten Denkprozess.",
    ],
  },
  {
    id: "raum3d",
    label: "06 Gedankenraum 3D",
    nodeType: "sub",
    x: 1455, y: 710,
    title: "Wörter im Raum",
    body: [
      "Wörter erscheinen beim Schreiben im 3D-Raum, zufällige Position, Größe, Distanz. Manche bewegen sich, manche verblassen.",
      "Das radikalste Experiment: eine direkte Simulation des Gedankenraums während der Meditation.",
    ],
  },
  {
    id: "spirale",
    label: "07 Spirale",
    nodeType: "sub",
    x: 1490, y: 615,
    title: "Text windet sich nach innen",
    body: [
      "Text windet sich in einer kontinuierlichen Spirale nach innen. Das Aktuellste steht außen, groß, im Fokus.",
      "Was älter ist liegt weiter innen, kleiner, geneigt. Nicht verschwunden, aber nicht mehr vollständig lesbar.",
    ],
  },

  // ── SUB — from projekt ────────────────────────────────────────────────────
  {
    id: "tool",
    label: "Create your own",
    nodeType: "sub",
    x: 1490, y: 385,
    title: "Das parametrische Tool",
    body: [
      "Man stellt selbst ein, welche Regeln gelten: Wie schnell verfällt Text? Ist er sichtbar? Hinterlässt Löschen Spuren?",
      "Man gibt dem eigenen Interface einen Titel, eine Beschreibung, vielleicht eine Regel, speichert und teilt es.",
      "Aus Beobachtung wird Einladung: Der Benutzer wird zum Gestalter seines eigenen Schreibinterfaces.",
    ],
  },
  {
    id: "behauptung",
    label: "Die Behauptung",
    nodeType: "sub",
    x: 1510, y: 528,
    title: "Diese Erkenntnis lässt sich nicht lesen.",
    body: [
      "Digitale Schreibinterfaces sind nicht neutral. Sie formen was gedacht und geschrieben werden kann, meist unsichtbar.",
      "Standard-Interfaces erlauben nur eine Art zu schreiben. Dabei gibt es eine Bandbreite von Möglichkeiten.",
      "Shaping Thought macht diese Regeln sichtbar, erfahrbar und veränderbar. Als Einladung, nicht als Kritik.",
      "Diese Erkenntnis lässt sich nicht lesen. Sie muss erlebt werden.",
    ],
  },
];
