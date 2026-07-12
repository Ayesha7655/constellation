/** Substitutes `{{key}}` placeholders in FAQ template copy. */
export function substituteFaqTemplate(text: string, values: Readonly<Record<string, string>>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => values[key] ?? '');
}
