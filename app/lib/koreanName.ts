// Two-character Korean compound surnames. Single-character surnames are by far
// the most common, so we treat anything not in this list as 1-char.
const COMPOUND_SURNAMES = [
  "남궁",
  "독고",
  "동방",
  "사공",
  "서문",
  "선우",
  "제갈",
  "황보",
  "황목",
  "황면",
  "장곡",
];

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

function isHangul(ch: string): boolean {
  if (!ch) return false;
  const code = ch.charCodeAt(0);
  return code >= HANGUL_START && code <= HANGUL_END;
}

function hasFinalConsonant(ch: string): boolean {
  if (!isHangul(ch)) return false;
  return (ch.charCodeAt(0) - HANGUL_START) % 28 !== 0;
}

/**
 * Strip the family name from a Korean full name so the AI addresses the child
 * by given name only ("민선이는…" rather than "김민선이는…").
 *
 * - Names that aren't pure Hangul (English names, mixed scripts) are returned
 *   unchanged — we don't have a reliable way to split them.
 * - Single-character names are returned unchanged.
 */
export function getGivenName(fullName: string): string {
  const name = (fullName ?? "").trim();
  if (!name) return name;

  for (const ch of name) {
    if (!isHangul(ch)) return name;
  }

  if (name.length <= 1) return name;

  for (const surname of COMPOUND_SURNAMES) {
    if (name.startsWith(surname) && name.length > surname.length) {
      return name.slice(surname.length);
    }
  }

  return name.slice(1);
}

/**
 * Returns a hint string the system prompt can use to remind the model of
 * Korean particle attachment for a given name. The model is still expected to
 * produce natural prose — this just lists the two correct forms.
 */
export function particleHint(givenName: string): string {
  const last = givenName.slice(-1);
  if (!isHangul(last)) {
    return `${givenName}는/${givenName}가/${givenName}를`;
  }
  if (hasFinalConsonant(last)) {
    return `${givenName}이는 / ${givenName}이가 / ${givenName}이를`;
  }
  return `${givenName}는 / ${givenName}가 / ${givenName}를`;
}
