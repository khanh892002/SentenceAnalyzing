# Sentence Analyzer API — Reference

Base URL (local): `http://localhost:8000`  
Base URL (production): `https://<your-render-url>`

All analysis endpoints live under `/api/v1/`. The legacy `/analyze` (no prefix) remains active for backward compatibility but is **deprecated** — prefer the versioned path.

---

## Endpoints

### `POST /api/v1/analyze`

Analyzes one or more English sentences and returns a parse-tree JSON structure for each sentence detected.

#### Request

```http
POST /api/v1/analyze
Content-Type: application/json
```

```json
{
  "sentence": "The quick brown fox jumps over the lazy dog."
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `sentence` | `string` | ✅ | 1–5000 characters, English only |

#### Response `200 OK`

Returns an **array** — one element per sentence detected in the input.

```json
[
  {
    "role": "ROOT",
    "type": "phrase",
    "pos": "VERB",
    "content": [
      {
        "role": "nsubj",
        "type": "phrase",
        "pos": "NOUN",
        "content": [
          { "role": "det",  "type": "word", "text": "The",   "pos": "DET"  },
          { "role": "amod", "type": "word", "text": "quick", "pos": "ADJ"  },
          { "role": "amod", "type": "word", "text": "brown", "pos": "ADJ"  },
          { "role": "head", "type": "word", "text": "fox",   "pos": "NOUN" }
        ]
      },
      { "role": "head",  "type": "word", "text": "jumps", "pos": "VERB" },
      {
        "role": "prep",
        "type": "phrase",
        "pos": "ADP",
        "content": [
          { "role": "head", "type": "word", "text": "over", "pos": "ADP"  },
          {
            "role": "pobj",
            "type": "phrase",
            "pos": "NOUN",
            "content": [
              { "role": "det",  "type": "word", "text": "the",  "pos": "DET"  },
              { "role": "amod", "type": "word", "text": "lazy", "pos": "ADJ"  },
              { "role": "head", "type": "word", "text": "dog",  "pos": "NOUN" }
            ]
          }
        ]
      },
      { "role": "punct", "type": "word", "text": ".", "pos": "PUNCT" }
    ]
  }
]
```

#### Node Schema

Every element in the tree is a **Node** of one of two types:

**Word node** (leaf):
```json
{
  "role": "<dependency_role>",
  "type": "word",
  "text": "<surface_form>",
  "pos":  "<universal_POS_tag>"
}
```

**Phrase node** (branch):
```json
{
  "role": "<dependency_role>",
  "type": "phrase",
  "pos":  "<universal_POS_tag>",
  "content": [ /* child Nodes, ordered by token position */ ]
}
```

The head token of a phrase appears inside `content` with `"role": "head"`.

#### `role` values (spaCy dependency labels, most common)

| Role | Meaning |
|------|---------|
| `ROOT` | Main predicate of the sentence |
| `nsubj` | Nominal subject |
| `dobj` | Direct object |
| `iobj` | Indirect object |
| `pobj` | Object of a preposition |
| `attr` | Attribute (after linking verb) |
| `amod` | Adjectival modifier |
| `advmod` | Adverbial modifier |
| `prep` | Prepositional modifier |
| `det` | Determiner |
| `aux` | Auxiliary verb |
| `neg` | Negation |
| `conj` | Conjunct |
| `cc` | Coordinating conjunction |
| `mark` | Subordinating conjunction marker |
| `ccomp` | Clausal complement |
| `xcomp` | Open clausal complement |
| `advcl` | Adverbial clause modifier |
| `head` | Head token within a phrase node |
| `punct` | Punctuation |

#### `pos` values (Universal POS tags)

`NOUN` `VERB` `AUX` `ADJ` `ADV` `DET` `PRON` `ADP` `CCONJ` `SCONJ` `PART` `PUNCT` `PROPN` `NUM` `INTJ`

#### Error Responses

| Status | `detail` | Cause |
|--------|----------|-------|
| `400` | `"Sentence input is required."` | Empty or whitespace-only body |
| `400` | `"Văn bản quá dài..."` | Input exceeds 5000 characters |
| `400` | `"Vui lòng nhập câu tiếng Anh..."` | Language detected is not English |
| `400` | `"Văn bản vô nghĩa..."` | Language detection failed |
| `400` | `"Câu bị ngắt hoặc thiếu động từ..."` | spaCy could not find a ROOT token |

All errors follow FastAPI's default shape:
```json
{ "detail": "<error message>" }
```

---

## Caching Behavior

Results are cached in Firestore collection `global_sentence_cache` keyed by SHA-256 hash of the sentence text. Cache is checked before invoking spaCy. Cache entries include:

```json
{
  "text": "<original sentence>",
  "tree": { /* Node */ },
  "version": "1.0",
  "lang": "en",
  "createdAt": "<Firestore timestamp>"
}
```

Cache is shared globally across all users. Identical sentences across different users return the cached result instantly.

---

## Integration Examples

### JavaScript / Fetch
```js
const res = await fetch('http://localhost:8000/api/v1/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sentence: 'She sells seashells by the seashore.' })
});
const tree = await res.json(); // Node[]
```

### Flutter / Dart (http package)
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

final response = await http.post(
  Uri.parse('https://<your-render-url>/api/v1/analyze'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({'sentence': 'She sells seashells by the seashore.'}),
);
final List<dynamic> tree = jsonDecode(response.body);
```

### Python / requests
```python
import requests

res = requests.post(
    'http://localhost:8000/api/v1/analyze',
    json={'sentence': 'She sells seashells by the seashore.'}
)
tree = res.json()  # list[dict]
```

---

## Deprecated Endpoints

| Endpoint | Status | Replacement |
|----------|--------|-------------|
| `POST /analyze` | Deprecated (still active) | `POST /api/v1/analyze` |

---

## Interactive Docs

When the server is running locally, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
