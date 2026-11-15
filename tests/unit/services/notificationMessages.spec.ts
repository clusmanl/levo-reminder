import { describe, expect, it } from 'vitest';
import { MESSAGES } from '@/services/notificationMessages';

describe.each(['fr', 'en'] as const)('MESSAGES (%s)', (lang) => {
  const messages = MESSAGES[lang];

  it('propose 7 niveaux de 30 messages chacun', () => {
    expect(messages).toHaveLength(7);
    for (const level of messages) expect(level).toHaveLength(30);
  });

  it('a un titre et un corps non vides pour chaque message', () => {
    for (const message of messages.flat()) {
      expect(message[0].trim()).not.toBe('');
      expect(message[1].trim()).not.toBe('');
    }
  });

  it('mentionne le médicament ({name}) dans chaque message', () => {
    for (const [title, body] of messages.flat()) expect(`${title} ${body}`).toContain('{name}');
  });

  it("n'a pas de doublon de titre dans un même niveau", () => {
    for (const level of messages) expect(new Set(level.map(([title]) => title)).size).toBe(level.length);
  });
});

describe('MESSAGES (jeu anglais)', () => {
  it("n'est pas une copie du jeu français", () => {
    const french = new Set(MESSAGES.fr.flat().map(([title]) => title));
    for (const [title] of MESSAGES.en.flat()) expect(french.has(title)).toBe(false);
  });
});
