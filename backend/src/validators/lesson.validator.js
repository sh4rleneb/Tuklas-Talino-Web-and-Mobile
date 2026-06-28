export function validateLesson(passage = '') {
  const text = String(passage || '');

  const hasLayunin = /Layunin\s*:/.test(text);
  const hasAralin = /Aralin\s*:/.test(text);
  const hasGawain = /Gawain\s*:/.test(text);

  const hasBadMarkers =
    text.includes('TUKLAS TALINO SAMPLE LESSON PLAN') ||
    text.includes('Subject:') ||
    text.includes('Module:');

  return {
    isValid: hasLayunin && hasAralin && hasGawain && !hasBadMarkers,
    errors: {
      missingLayunin: !hasLayunin,
      missingAralin: !hasAralin,
      missingGawain: !hasGawain,
      containsLegacyFormat: hasBadMarkers,
    }
  };
}