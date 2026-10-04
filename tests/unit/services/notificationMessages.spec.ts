import { describe, expect, it } from 'vitest';
import { MESSAGES } from '@/services/notificationMessages';

describe('MESSAGES', () => {
  it('propose 7 niveaux de 30 messages chacun', () => {
    expect(MESSAGES).toHaveLength(7);
    for (const level of MESSAGES) expect(level).toHaveLength(30);
  });

  it('a un titre et un corps non vides pour chaque message', () => {
    for (const message of MESSAGES.flat()) {
      expect(message[0].trim()).not.toBe('');
      expect(message[1].trim()).not.toBe('');
    }
  });

  it('mentionne le médicament ({name}) dans chaque message', () => {
    for (const [title, body] of MESSAGES.flat()) expect(`${title} ${body}`).toContain('{name}');
  });

  it("n'a pas de doublon de titre dans un même niveau", () => {
    for (const level of MESSAGES) expect(new Set(level.map(([title]) => title)).size).toBe(level.length);
  });
});
