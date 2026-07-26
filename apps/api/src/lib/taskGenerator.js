// Deterministic task generator: turns raw material text into vocab-card and
// fill-gap tasks WITHOUT calling any external/AI API. Pure functions of the
// input text so the same input always produces the same output (required by
// tests and desirable for reproducibility in a self-hosted deployment).

// A reasonably sized English stopword list. Kept local (no external deps)
// so behavior never changes based on a third-party package version.
export const STOPWORDS = new Set(
  [
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
    "aren't", 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both',
    'but', 'by', "can't", 'cannot', 'could', "couldn't", 'did', "didn't", 'do', 'does', "doesn't",
    'doing', "don't", 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', "hadn't",
    'has', "hasn't", 'have', "haven't", 'having', 'he', "he'd", "he'll", "he's", 'her', 'here',
    "here's", 'hers', 'herself', 'him', 'himself', 'his', 'how', "how's", 'i', "i'd", "i'll",
    "i'm", "i've", 'if', 'in', 'into', 'is', "isn't", 'it', "it's", 'its', 'itself', "let's",
    'me', 'more', 'most', "mustn't", 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on',
    'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
    'same', "shan't", 'she', "she'd", "she'll", "she's", 'should', "shouldn't", 'so', 'some',
    'such', 'than', 'that', "that's", 'the', 'their', 'theirs', 'them', 'themselves', 'then',
    'there', "there's", 'these', 'they', "they'd", "they'll", "they're", "they've", 'this',
    'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', "wasn't", 'we',
    "we'd", "we'll", "we're", "we've", 'were', "weren't", 'what', "what's", 'when', "when's",
    'where', "where's", 'which', 'while', 'who', "who's", 'whom', 'why', "why's", 'with',
    "won't", 'would', "wouldn't", 'you', "you'd", "you'll", "you're", "you've", 'your', 'yours',
    'yourself', 'yourselves', 'also', 'just', 'like', 'get', 'got', 'one', 'two',
  ].map((w) => w.toLowerCase()),
);

/**
 * Split text into normalized word tokens (lowercased, alphabetic + apostrophes).
 */
export function tokenizeWords(text) {
  const matches = text.toLowerCase().match(/[a-z']+/g);
  return matches || [];
}

/**
 * Split text into sentences using a simple, deterministic regex-based
 * splitter (no NLP dependency; adequate for well-formed prose/documents).
 */
export function splitSentences(text) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];
  // Split on ., !, ? followed by whitespace/end, keeping punctuation.
  const raw = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  return raw.map((s) => s.trim()).filter((s) => s.length > 0);
}

/**
 * Count frequency of content words (i.e. non-stopwords, length >= 3) in text.
 * Returns entries sorted deterministically: by descending frequency, then
 * alphabetically for ties (so output order never depends on Map insertion
 * order / V8 internals).
 */
export function computeContentWordFrequencies(text) {
  const words = tokenizeWords(text);
  const counts = new Map();

  for (const word of words) {
    if (word.length < 3) continue;
    if (STOPWORDS.has(word)) continue;
    counts.set(word, (counts.get(word) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.word.localeCompare(b.word);
    });
}

/**
 * Build vocab-card tasks from the top-N most frequent content words.
 */
export function buildVocabCards(text, topN = 10) {
  const frequencies = computeContentWordFrequencies(text);
  return frequencies.slice(0, topN).map(({ word, count }) => ({
    type: 'vocab-card',
    word,
    frequency: count,
    prompt: `What does "${word}" mean in this material?`,
  }));
}

/**
 * Build fill-gap tasks: pick medium-length sentences and blank out one
 * content word per sentence. Deterministic selection order: sentences are
 * considered in their original document order, filtered to a medium length
 * band, and for each we blank out the sentence's most frequent (by global
 * frequency, then alphabetical, then first-occurrence-in-sentence) content
 * word.
 */
export function buildGapTasks(text, maxTasks = 10, options = {}) {
  const minWords = options.minWords ?? 6;
  const maxWords = options.maxWords ?? 22;

  const sentences = splitSentences(text);
  const globalFrequencies = new Map(
    computeContentWordFrequencies(text).map((entry) => [entry.word, entry.count]),
  );

  const tasks = [];

  for (const sentence of sentences) {
    if (tasks.length >= maxTasks) break;

    const wordCountInSentence = (sentence.match(/[a-zA-Z']+/g) || []).length;
    if (wordCountInSentence < minWords || wordCountInSentence > maxWords) continue;

    const sentenceWords = tokenizeWords(sentence);
    const candidateWords = [...new Set(sentenceWords)].filter(
      (w) => w.length >= 3 && !STOPWORDS.has(w) && globalFrequencies.has(w),
    );

    if (candidateWords.length === 0) continue;

    candidateWords.sort((a, b) => {
      const freqDiff = (globalFrequencies.get(b) || 0) - (globalFrequencies.get(a) || 0);
      if (freqDiff !== 0) return freqDiff;
      return a.localeCompare(b);
    });

    const targetWord = candidateWords[0];

    // Blank out the first case-insensitive whole-word occurrence.
    const wordRegex = new RegExp(`\\b${escapeRegExp(targetWord)}\\b`, 'i');
    const match = sentence.match(wordRegex);
    if (!match) continue;

    const gapped = sentence.replace(wordRegex, '_____');

    tasks.push({
      type: 'gap-task',
      sentence: gapped,
      answer: targetWord,
      original: sentence,
    });
  }

  return tasks;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Top-level deterministic generator combining both task types.
 */
export function generateTasksFromText(text, opts = {}) {
  const vocabCards = buildVocabCards(text, opts.vocabTopN ?? 10);
  const gapTasks = buildGapTasks(text, opts.maxGapTasks ?? 10);
  return { vocabCards, gapTasks };
}
