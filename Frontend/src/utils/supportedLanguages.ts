export interface LanguageOption {
  code: string
  name: string
}

// Languages supported by whisperx alignment
// Primary languages (via torchaudio pipelines - highest quality): en, fr, de, es, it
// Additional languages supported via Hugging Face models
// Source: https://github.com/m-bain/whisperX/blob/main/whisperx/alignment.py
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  // Primary languages (best quality)
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  
  // Additional languages via HuggingFace
  { code: 'ar', name: 'Arabic' },
  { code: 'ca', name: 'Catalan' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'eu', name: 'Basque' },
  { code: 'fa', name: 'Persian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'gl', name: 'Galician' },
  { code: 'el', name: 'Greek' },
  { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hr', name: 'Croatian' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ka', name: 'Georgian' },
  { code: 'ko', name: 'Korean' },
  { code: 'lv', name: 'Latvian' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'nn', name: 'Norwegian Nynorsk' },
  { code: 'no', name: 'Norwegian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'sv', name: 'Swedish' },
  { code: 'te', name: 'Telugu' },
  { code: 'tl', name: 'Filipino' },
  { code: 'tr', name: 'Turkish' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'zh', name: 'Chinese' },
].sort((a, b) => a.name.localeCompare(b.name))
