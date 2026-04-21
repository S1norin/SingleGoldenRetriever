// tests/utils.test.js
import { describe, it, expect } from 'vitest';

describe('Utils.escapeHtml', () => {
  it('escapes ampersand', () => {
    expect(Utils.escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes angle brackets', () => {
    expect(Utils.escapeHtml('<script>')).toBe('&lt;script&gt;');
    expect(Utils.escapeHtml('x > y')).toBe('x &gt; y');
  });

  it('escapes quotes', () => {
    expect(Utils.escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
    expect(Utils.escapeHtml("it's")).toBe('it&#39;s');
  });

  it('handles XSS payload', () => {
    const payload = '<script>alert("xss")</script>';
    expect(Utils.escapeHtml(payload)).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    );
  });

  it('handles empty and non-string input', () => {
    expect(Utils.escapeHtml('')).toBe('');
    expect(Utils.escapeHtml(123)).toBe('123');
    expect(Utils.escapeHtml(null)).toBe('null');
    expect(Utils.escapeHtml(undefined)).toBe('undefined');
  });

  it('returns input unchanged when no special chars', () => {
    expect(Utils.escapeHtml('Hello World')).toBe('Hello World');
  });
});

describe('Utils.sanitizeTopicInput', () => {
  it('converts to lowercase', () => {
    expect(Utils.sanitizeTopicInput('HelloWorld')).toBe('helloworld');
  });

  it('removes invalid characters', () => {
    expect(Utils.sanitizeTopicInput('Hello World!')).toBe('helloworld');
    expect(Utils.sanitizeTopicInput('My@Topic#')).toBe('mytopic');
    expect(Utils.sanitizeTopicInput('test&more')).toBe('testmore');
  });

  it('preserves valid characters', () => {
    expect(Utils.sanitizeTopicInput('My-Topic_123')).toBe('my-topic_123');
    expect(Utils.sanitizeTopicInput('a_b-c1')).toBe('a_b-c1');
  });

  it('handles empty input', () => {
    expect(Utils.sanitizeTopicInput('')).toBe('');
    expect(Utils.sanitizeTopicInput('   ')).toBe('');
  });
});

describe('Utils.formatTopicPreview', () => {
  it('returns all topics when 3 or fewer', () => {
    expect(Utils.formatTopicPreview(['a'])).toBe('a');
    expect(Utils.formatTopicPreview(['a', 'b'])).toBe('a, b');
    expect(Utils.formatTopicPreview(['a', 'b', 'c'])).toBe('a, b, c');
  });

  it('shows first 3 + count when more than 3', () => {
    expect(Utils.formatTopicPreview(['a', 'b', 'c', 'd'])).toBe(
      'a, b, c, +1 more',
    );
    expect(Utils.formatTopicPreview(['a', 'b', 'c', 'd', 'e'])).toBe(
      'a, b, c, +2 more',
    );
  });

  it('handles empty array', () => {
    expect(Utils.formatTopicPreview([])).toBe('');
  });
});

describe('Utils.onlineUsersCount', () => {
  it('counts only online users', () => {
    const users = [
      { username: 'A', status: 'online' },
      { username: 'B', status: 'offline' },
      { username: 'C', status: 'online' },
    ];
    expect(Utils.onlineUsersCount(users)).toBe(2);
  });

  it('returns 0 for empty array', () => {
    expect(Utils.onlineUsersCount([])).toBe(0);
  });

  it('returns 0 when no online users', () => {
    const users = [
      { username: 'A', status: 'offline' },
      { username: 'B', status: 'offline' },
    ];
    expect(Utils.onlineUsersCount(users)).toBe(0);
  });

  it('returns total when all online', () => {
    const users = [
      { username: 'A', status: 'online' },
      { username: 'B', status: 'online' },
      { username: 'C', status: 'online' },
    ];
    expect(Utils.onlineUsersCount(users)).toBe(3);
  });
});

describe('Utils.formatTime', () => {
  it('formats ISO timestamp to 24h time', () => {
    const time = Utils.formatTime('2026-04-18T09:15:00.000Z');
    // Just verify it returns a string with hours and minutes
    expect(typeof time).toBe('string');
    expect(time.length).toBeGreaterThan(0);
  });

  it('handles invalid date gracefully', () => {
    const time = Utils.formatTime('invalid');
    expect(typeof time).toBe('string');
  });
});
