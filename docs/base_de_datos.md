# Base de datos MongoDB

**Motor:** MongoDB (vía PyMongo, sin ODM)  
**Base de datos:** `tfg_db`  
**Patrón:** Repository

---

## Colecciones

### 1. `auth` — Autenticación y gestión de cuentas

| Campo | Tipo | Notas |
|---|---|---|
| `_id` | `ObjectId` | Clave primaria |
| `username` | `str` | **Unique index**. Actúa como identificador (email). |
| `password` | `str` | Hash bcrypt |
| `status` | `"active" \| "pending_deletion"` | Por defecto: `"active"` |
| `scheduled_purge_at` | `datetime \| None` | Solo presente si `status == "pending_deletion"`. Borrado diferido con período de gracia. |

**Índices:** `username` (unique)

---

### 2. `conversations` — Chats del asistente RAG

| Campo | Tipo | Notas |
|---|---|---|
| `_id` | `ObjectId` | Clave primaria |
| `user_id` | `str` | FK lógica a `auth._id` |
| `updated_at` | `datetime` | Se actualiza en cada mensaje |
| `title` | `str \| None` | Generado por el LLM automáticamente |
| `messages` | `list[{role, content}]` | Historial del chat |
| `stream_state` | `str \| None` | Estado durante streaming: `idle`, `retrieving`, `thinking`, `streaming` |
| `stream_partial_reply` | `str \| None` | Respuesta parcial acumulada durante el streaming |
| `stream_updated_at` | `datetime \| None` | Última persistencia de respuesta parcial |
| `stream_error` | `str \| None` | Mensaje de error si falló el streaming |

**Índices:** `{user_id: 1, updated_at: -1}` (compound, background)

---

### 3. `meetings` — Reuniones transcritas y resumidas

| Campo | Tipo | Notas |
|---|---|---|
| `_id` | `ObjectId` | Clave primaria |
| `user_id` | `str` | FK lógica a `auth._id` |
| `title` | `str` | Título proporcionado por el usuario |
| `date` | `datetime` | Fecha de la reunión (hora fijada a 00:00:00) |
| `language` | `str \| None` | Código ISO 639-1, asignado por el transcriber |
| `summary` | `str` | Resumen generado por el LLM |
| `transcription` | `str` | Transcripción completa con diarización de hablantes |

**Índices:** `{user_id: 1}` (background)

---

### 4. `user_settings` — Configuración del usuario

Un documento por usuario que almacena toda la configuración en un subdocumento `settings`:

```
settings:
  providers:                                  # API keys cifradas con Fernet
    OpenAI:   {api_key_encrypted?, base_url?}
    Anthropic:{api_key_encrypted?, base_url?}
    Ollama:   (no requiere API key)
  models:
    chat_model:      {provider, model_name, temperature, max_tokens}
    summary_model:   {provider, model_name, temperature, max_tokens}
    retrieval_model: {provider, model_name, temperature, max_tokens}
  transcription:
    active_provider: "whisperx" | "aai"
    providers:
      whisperx: {model_size, compute_type, device}
      aai:      {speech_model, speaker_labels, api_key_encrypted?}
  templates:
    system_prompt?: str   # Prompt personalizado (50-5000 caracteres)
```

**Índices:** Ninguno adicional (solo el `_id` por defecto). Todas las consultas son por `user_id`.

---

## Relaciones entre colecciones

```
auth (usuario)
  ├── conversations  (1:N — conversaciones de chat del usuario)
  ├── meetings       (1:N — reuniones del usuario)
  └── user_settings  (1:1 — configuración del usuario)
```

No existen foreign keys a nivel de MongoDB; la relación es puramente lógica mediante el campo `user_id` (string del `ObjectId`).

---

## Vector store (ChromaDB)

Además de MongoDB, el proyecto utiliza ChromaDB como vector store para la funcionalidad RAG:

| Propiedad | Valor |
|---|---|
| Colección | `meetings` |
| Embedding model | `nomic-embed-text` (vía Ollama) |
| Documentos | Chunks de transcripciones y resúmenes de reuniones |
| Metadatos | `{meeting_id, user_id, title, date, type: "transcription" \| "summary"}` |
