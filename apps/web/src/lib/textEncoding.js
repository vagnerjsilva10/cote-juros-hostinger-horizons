const MOJIBAKE_PATTERNS = [
  /Ã[\x80-\xBF]/,
  /Â[\x80-\xBF]/,
  /â[\x80-\xBF]{1,2}/,
  /ð[\x80-\xBF]{2,3}/
];

const likelyMojibake = (value) => MOJIBAKE_PATTERNS.some((pattern) => pattern.test(value));

const decodeLatin1AsUtf8 = (value) => {
  const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0) & 0xff);
  return new TextDecoder('utf-8').decode(bytes);
};

export const normalizeMojibake = (value) => {
  if (typeof value !== 'string') return value;
  if (!likelyMojibake(value)) return value;

  try {
    const decoded = decodeLatin1AsUtf8(value);
    return decoded.includes('�') ? value : decoded;
  } catch {
    return value;
  }
};

export const normalizeMojibakeDeep = (input) => {
  if (Array.isArray(input)) return input.map(normalizeMojibakeDeep);
  if (input && typeof input === 'object') {
    return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, normalizeMojibakeDeep(value)]));
  }
  return normalizeMojibake(input);
};
