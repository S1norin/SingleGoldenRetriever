// tests/auth.test.js
import { describe, it, expect, beforeEach } from 'vitest';

describe('Config defaults', () => {
  it('has defaultUsername set', () => {
    expect(Config.defaultUsername).toBe('Daria');
  });

  it('has useMockData defaulting to true', () => {
    expect(Config.useMockData).toBe(true);
  });

  it('has defaultTopics array', () => {
    expect(Array.isArray(Config.defaultTopics)).toBe(true);
    expect(Config.defaultTopics.length).toBeGreaterThan(0);
  });
});

describe('Mock data structure', () => {
  it('has mockMessages array', () => {
    expect(Array.isArray(Config.mockMessages)).toBe(true);
    expect(Config.mockMessages.length).toBeGreaterThan(0);
  });

  it('mockMessages have required fields', () => {
    Config.mockMessages.forEach((msg) => {
      expect(msg.id).toBeDefined();
      expect(msg.sender).toBeDefined();
      expect(msg.text).toBeDefined();
      expect(msg.targetTopics).toBeDefined();
      expect(msg.createdAt).toBeDefined();
    });
  });

  it('mockMessages have valid IDs', () => {
    const ids = Config.mockMessages.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length); // no duplicates
  });

  it('has mockUsers array', () => {
    expect(Array.isArray(Config.mockUsers)).toBe(true);
    expect(Config.mockUsers.length).toBeGreaterThan(0);
  });

  it('mockUsers have required fields', () => {
    Config.mockUsers.forEach((user) => {
      expect(user.id).toBeDefined();
      expect(user.username).toBeDefined();
      expect(user.status).toBeDefined();
      expect(user.subscribedTopics).toBeDefined();
      expect(Array.isArray(user.subscribedTopics)).toBe(true);
    });
  });

  it('mockUsers have valid status values', () => {
    const validStatuses = ['online', 'offline'];
    Config.mockUsers.forEach((user) => {
      expect(validStatuses).toContain(user.status);
    });
  });
});

describe('Config.api endpoints', () => {
  it('has messages endpoint', () => {
    expect(Config.api.messages).toBe('/api/messages');
  });

  it('has users endpoint', () => {
    expect(Config.api.users).toBe('/api/users');
  });

  it('has send endpoint', () => {
    expect(Config.api.send).toBe('/api/messages');
  });

  it('has joinTopic endpoint', () => {
    expect(Config.api.joinTopic).toBe('/api/topics/join');
  });

  it('has leaveTopic endpoint', () => {
    expect(Config.api.leaveTopic).toBe('/api/topics/leave');
  });
});

describe('Config.backendUrl', () => {
  it('has backendUrl configured', () => {
    expect(Config.backendUrl).toBe('http://localhost:8000');
  });

  it('has pollIntervalMs configured', () => {
    expect(Config.pollIntervalMs).toBe(3000);
  });
});
