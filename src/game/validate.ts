const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isText = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

/** Returns a list of problems. An empty list means the chapter is safe to play. */
export function validateChapter(c: unknown): string[] {
  if (!isObj(c)) return ['Not a chapter.'];
  const problems: string[] = [];
  if (!isText(c.title, 200)) problems.push('Title is missing or too long.');
  if (!isText(c.reference, 6000)) problems.push('Reference text is missing or too long.');

  const objectives = Array.isArray(c.objectives) ? c.objectives : [];
  if (objectives.length < 1 || objectives.length > 8) problems.push('A chapter needs 1 to 8 objectives.');
  const ids = new Set<string>();
  for (const o of objectives) {
    if (!isObj(o) || !isText(o.id, 40) || !isText(o.text, 300)) problems.push('An objective is missing its id or text.');
    else ids.add(o.id);
  }

  const beliefs = Array.isArray(c.common_misconceptions) ? c.common_misconceptions : null;
  if (!beliefs || beliefs.some(b => !isText(b, 300))) problems.push('Misconceptions must be a list of short texts.');

  const quiz = Array.isArray(c.quiz) ? c.quiz : [];
  if (quiz.length < 1 || quiz.length > 10) problems.push('A chapter needs 1 to 10 quiz questions.');
  for (const q of quiz) {
    if (!isObj(q) || !isText(q.id, 40)) { problems.push('A question has no id.'); continue; }
    const where = `Question ${q.id}:`;
    if (q.type !== 'mcq' && q.type !== 'short') problems.push(`${where} type must be mcq or short.`);
    if (!isText(q.prompt, 500)) problems.push(`${where} prompt is missing or too long.`);
    if (!isText(q.answer_key, 500)) problems.push(`${where} answer key is missing or too long.`);
    if (typeof q.objective !== 'string' || !ids.has(q.objective)) problems.push(`${where} points to an objective that does not exist.`);
    if (q.type === 'mcq') {
      const choices = Array.isArray(q.choices) ? q.choices : [];
      if (choices.length < 2 || choices.some(x => !isText(x, 200))) problems.push(`${where} needs at least two choices.`);
      else if (!choices.includes(q.answer_key)) problems.push(`${where} answer key is not one of the choices.`);
    }
  }
  return problems;
}
