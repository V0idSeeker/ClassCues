# Game content

## Adding a student

Students live in `students.json`. Add one more block to the list and the student joins the pool. Each lesson draws 10 students from the pool.

Smallest working student:

```json
{
  "id": "sara",
  "name": "Sara",
  "archetype": "other",
  "traits": { "attention": 0.7, "curiosity": 0.6, "confidence": 0.5 },
  "learning_style": "likes worked examples",
  "personality": "Cheerful and practical. Asks how things are used in real life.",
  "openingLines": ["Good morning!", "What are we doing today?", "I am ready."]
}
```

| Field | Meaning |
|---|---|
| `id` | Unique, lowercase, no spaces. |
| `name` | Shown on the desk. Keep it short (it must fit the name plate). |
| `archetype` | One of `eager`, `quiet`, `clown`, `skeptic`, `carrier`, `struggling`, `other`. Every class gets one of each of the first six. `carrier` starts with two wrong beliefs, `struggling` with one. |
| `traits.attention` | 0 to 1. How many notes they catch: 1 catches everything, 0 catches about 40%. |
| `traits.curiosity` | 0 to 1. How often they raise a hand. |
| `traits.confidence` | 0 to 1. Whether they speak up when confused. |
| `learning_style` | Short phrase. Shapes how their notes are written. |
| `personality` | One or two sentences. Shapes how they talk. This is what makes a student feel different. |
| `openingLines` | Three to five things they might say when class starts. |

Optional:

```json
"look": { "hair": "curly", "hairColor": "#2e2019", "skin": "#8a5a3c", "shirt": "#4fa66a", "glasses": true },
"voice": 12
```

- `hair`: `short`, `long`, `bob`, `spiky`, `curly`, `pigtails`, `bun`, `cap`, `hijab`, `wavy`.
- `"graduate": true` adds a graduation cap, a white sash and a floral collar.
- Colours are web colours such as `#4fa66a`.
- `voice` is a number that picks a browser voice. Leave it out and the student's position in the file is used.
- A student with no `look` gets short dark hair and a blue shirt.

After editing, run `npm test`. It checks that ids are unique and every student is complete.

Do not put subject knowledge or wrong beliefs in a student. Wrong beliefs come from the level being taught.

## Levels

`modules/python-intro.json` is the built-in level. Players make more from PDFs inside the game.
