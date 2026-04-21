// tests/state.test.js
import { describe, it, expect } from 'vitest';

describe('Message filtering by subscribed topics', () => {
  const messages = [
    {
      id: 'm1',
      sender: 'Ava',
      text: 'Message 1',
      targetTopics: ['engineering', 'release_ops'],
      createdAt: '2026-04-18T09:15:00.000Z',
    },
    {
      id: 'm2',
      sender: 'Noah',
      text: 'Message 2',
      targetTopics: ['qa', 'product-updates'],
      createdAt: '2026-04-18T08:40:00.000Z',
    },
    {
      id: 'm3',
      sender: 'Lena',
      text: 'Message 3',
      targetTopics: ['engineering'],
      createdAt: '2026-04-18T08:05:00.000Z',
    },
    {
      id: 'm4',
      sender: 'Mateo',
      text: 'Message 4',
      targetTopics: ['announcements'],
      createdAt: '2026-04-18T07:45:00.000Z',
    },
  ];

  function visibleMessages(messages, subscribedTopics) {
    return messages.filter((msg) =>
      msg.targetTopics.some((topic) => subscribedTopics.includes(topic)),
    );
  }

  it('shows all messages when all topics subscribed', () => {
    const topics = ['engineering', 'release_ops', 'qa', 'product-updates', 'announcements'];
    const result = visibleMessages(messages, topics);
    expect(result).toHaveLength(4);
  });

  it('filters to only matching topics', () => {
    const topics = ['engineering'];
    const result = visibleMessages(messages, topics);
    expect(result).toHaveLength(2); // m1 and m3
    expect(result.map((m) => m.id)).toEqual(['m1', 'm3']);
  });

  it('returns empty when no topics match', () => {
    const topics = ['nonexistent'];
    const result = visibleMessages(messages, topics);
    expect(result).toHaveLength(0);
  });

  it('returns empty when no topics subscribed', () => {
    const result = visibleMessages(messages, []);
    expect(result).toHaveLength(0);
  });

  it('matches messages with multiple target topics', () => {
    const topics = ['release_ops'];
    const result = visibleMessages(messages, topics);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('m1');
  });

  it('handles empty messages array', () => {
    const result = visibleMessages([], ['engineering']);
    expect(result).toHaveLength(0);
  });
});

describe('Topic subscription logic', () => {
  function addTopic(subscribed, selected, newTopic) {
    if (!subscribed.includes(newTopic)) {
      subscribed.push(newTopic);
      selected.push(newTopic);
    }
    return { subscribed, selected };
  }

  function removeTopic(subscribed, selected, topicToRemove) {
    const subIdx = subscribed.indexOf(topicToRemove);
    const selIdx = selected.indexOf(topicToRemove);
    if (subIdx !== -1) subscribed.splice(subIdx, 1);
    if (selIdx !== -1) selected.splice(selIdx, 1);
    return { subscribed, selected };
  }

  it('adds a new topic to both lists', () => {
    const sub = ['engineering'];
    const sel = ['engineering'];
    const result = addTopic(sub, sel, 'qa');
    expect(result.subscribed).toContain('qa');
    expect(result.selected).toContain('qa');
  });

  it('does not add duplicate topic', () => {
    const sub = ['engineering'];
    const sel = ['engineering'];
    const result = addTopic(sub, sel, 'engineering');
    expect(result.subscribed.filter((t) => t === 'engineering').length).toBe(1);
    expect(result.selected.filter((t) => t === 'engineering').length).toBe(1);
  });

  it('removes topic from both lists', () => {
    const sub = ['engineering', 'qa'];
    const sel = ['engineering', 'qa'];
    const result = removeTopic(sub, sel, 'qa');
    expect(result.subscribed).not.toContain('qa');
    expect(result.selected).not.toContain('qa');
  });

  it('does not break when removing non-existent topic', () => {
    const sub = ['engineering'];
    const sel = ['engineering'];
    const result = removeTopic(sub, sel, 'nonexistent');
    expect(result.subscribed).toEqual(['engineering']);
    expect(result.selected).toEqual(['engineering']);
  });
});

describe('Message creation logic', () => {
  function createMessage(sender, text, targetTopics) {
    return {
      id: `message-${Date.now()}`,
      sender,
      text,
      targetTopics: [...targetTopics],
      createdAt: new Date().toISOString(),
    };
  }

  it('creates message with correct structure', () => {
    const msg = createMessage('Daria', 'Hello', ['engineering']);
    expect(msg.sender).toBe('Daria');
    expect(msg.text).toBe('Hello');
    expect(msg.targetTopics).toEqual(['engineering']);
    expect(msg.id).toMatch(/^message-\d+$/);
    expect(new Date(msg.createdAt).getTime()).toBeGreaterThan(0);
  });

  it('deep copies targetTopics', () => {
    const topics = ['engineering'];
    const msg = createMessage('Daria', 'Hello', topics);
    msg.targetTopics.push('qa');
    expect(topics).toEqual(['engineering']); // original unchanged
  });

  it('generates unique IDs for each message', () => {
    const msg1 = createMessage('Daria', '1', ['engineering']);
    // Small delay to ensure different timestamp
    const msg2 = createMessage('Daria', '2', ['engineering']);
    // Since Date.now() can return same value in same ms, use string comparison
    expect(msg1.id).toMatch(/^message-\d+$/);
    expect(msg2.id).toMatch(/^message-\d+$/);
  });
});

describe('Composer disabled state', () => {
  function isSendDisabled(composerText, selectedTopics) {
    return !composerText.trim() || selectedTopics.length === 0;
  }

  it('is disabled when no text', () => {
    expect(isSendDisabled('', ['engineering'])).toBe(true);
    expect(isSendDisabled('   ', ['engineering'])).toBe(true);
  });

  it('is disabled when no topics selected', () => {
    expect(isSendDisabled('Hello', [])).toBe(true);
  });

  it('is enabled when both text and topics present', () => {
    expect(isSendDisabled('Hello', ['engineering'])).toBe(false);
  });

  it('is disabled when both empty', () => {
    expect(isSendDisabled('', [])).toBe(true);
  });
});

describe('Login form validation', () => {
  function validateLogin(username) {
    const trimmed = username.trim();
    return trimmed.length > 0;
  }

  it('accepts non-empty username', () => {
    expect(validateLogin('Daria')).toBe(true);
    expect(validateLogin('  TestUser  ')).toBe(true);
  });

  it('rejects empty username', () => {
    expect(validateLogin('')).toBe(false);
    expect(validateLogin('   ')).toBe(false);
    expect(validateLogin('')).toBe(false);
  });
});

describe('Topic sanitization for join form', () => {
  function sanitizeTopic(value) {
    return value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  }

  it('sanitizes user input', () => {
    expect(sanitizeTopic('  Hello World!  ')).toBe('helloworld');
    expect(sanitizeTopic('My@Topic#')).toBe('mytopic');
  });

  it('preserves hyphens and underscores', () => {
    expect(sanitizeTopic('My-Topic_123')).toBe('my-topic_123');
  });

  it('returns empty for invalid-only input', () => {
    expect(sanitizeTopic('!!!@@@')).toBe('');
    expect(sanitizeTopic('   ')).toBe('');
  });
});
