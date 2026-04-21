// tests/message.test.js
import { describe, it, expect } from 'vitest';

describe('MessageDetail.recipientsForTopics', () => {
  const users = [
    {
      id: 'user-1',
      username: 'Ava',
      status: 'online',
      subscribedTopics: ['engineering', 'release_ops'],
    },
    {
      id: 'user-2',
      username: 'Noah',
      status: 'online',
      subscribedTopics: ['engineering', 'product-updates', 'qa'],
    },
    {
      id: 'user-3',
      username: 'Lena',
      status: 'offline',
      subscribedTopics: ['product-updates', 'qa'],
    },
    {
      id: 'user-4',
      username: 'Mateo',
      status: 'online',
      subscribedTopics: ['release_ops', 'announcements'],
    },
    {
      id: 'user-5',
      username: 'Daria',
      status: 'online',
      subscribedTopics: ['engineering', 'release_ops', 'product-updates'],
    },
  ];

  it('finds recipients by matching topics', () => {
    const result = MessageDetail.recipientsForTopics(
      ['engineering', 'release_ops'],
      'Ava',
      users,
    );
    expect(result).toHaveLength(3); // Noah, Mateo, Daria (not Ava herself)
  });

  it('excludes the message sender', () => {
    const result = MessageDetail.recipientsForTopics(
      ['engineering', 'release_ops'],
      'Ava',
      users,
    );
    const usernames = result.map((r) => r.username);
    expect(usernames).not.toContain('Ava');
  });

  it('returns correct matched topics for each recipient', () => {
    const result = MessageDetail.recipientsForTopics(
      ['engineering', 'release_ops'],
      'Ava',
      users,
    );

    const noah = result.find((r) => r.username === 'Noah');
    expect(noah.matchedTopics).toContain('engineering');
    expect(noah.matchedTopics).not.toContain('release_ops');

    const mateo = result.find((r) => r.username === 'Mateo');
    expect(mateo.matchedTopics).toContain('release_ops');
    expect(mateo.matchedTopics).not.toContain('engineering');
  });

  it('includes status in recipient data', () => {
    const result = MessageDetail.recipientsForTopics(
      ['engineering'],
      'Noah',
      users,
    );
    const ava = result.find((r) => r.username === 'Ava');
    expect(ava.status).toBe('online');
  });

  it('returns empty array when no recipients match', () => {
    const result = MessageDetail.recipientsForTopics(
      ['nonexistent-topic'],
      'Ava',
      users,
    );
    expect(result).toHaveLength(0);
  });

  it('returns empty array when only the sender is subscribed', () => {
    const result = MessageDetail.recipientsForTopics(
      ['announcements'],
      'Mateo',
      users,
    );
    expect(result).toHaveLength(0);
  });

  it('handles empty topics array', () => {
    const result = MessageDetail.recipientsForTopics([], 'Ava', users);
    expect(result).toHaveLength(0);
  });

  it('handles users without subscribedTopics', () => {
    const usersWithoutTopics = [
      { id: 'user-1', username: 'Ava', status: 'online' },
      {
        id: 'user-2',
        username: 'Noah',
        status: 'online',
        subscribedTopics: ['engineering'],
      },
    ];
    const result = MessageDetail.recipientsForTopics(
      ['engineering'],
      'Ava',
      usersWithoutTopics,
    );
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('Noah');
  });
});

describe('MessageDetail.open', () => {
  const message = {
    id: 'message-1',
    sender: 'Ava',
    text: 'Consumer lag is back to zero.',
    targetTopics: ['engineering', 'release_ops'],
    createdAt: '2026-04-18T09:15:00.000Z',
  };

  const users = [
    {
      id: 'user-2',
      username: 'Noah',
      status: 'online',
      subscribedTopics: ['engineering', 'qa'],
    },
    {
      id: 'user-4',
      username: 'Mateo',
      status: 'online',
      subscribedTopics: ['release_ops'],
    },
  ];

  it('creates a modal overlay element', () => {
    MessageDetail.open('message-1', [message], users);
    const modal = document.querySelector('.modal');
    expect(modal).not.toBeNull();
    expect(modal.className).toContain('modal');
  });

  it('appends modal to document body', () => {
    MessageDetail.open('message-1', [message], users);
    const body = document.body;
    expect(body.querySelector('.modal')).not.toBeNull();
  });

  it('shows message sender in overlay', () => {
    MessageDetail.open('message-1', [message], users);
    const body = document.body.innerHTML;
    expect(body).toContain('Message from Ava');
  });

  it('shows message text in overlay', () => {
    MessageDetail.open('message-1', [message], users);
    const body = document.body.innerHTML;
    expect(body).toContain('Consumer lag is back to zero.');
  });

  it('shows topic badges in overlay', () => {
    MessageDetail.open('message-1', [message], users);
    const body = document.body.innerHTML;
    expect(body).toContain('engineering');
    expect(body).toContain('release_ops');
  });

  it('shows message path (producer → topic → consumer)', () => {
    MessageDetail.open('message-1', [message], users);
    const body = document.body.innerHTML;
    expect(body).toContain('producer');
    expect(body).toContain('Single Kafka Topic');
    expect(body).toContain('consumer');
  });

  it('shows recipients count', () => {
    MessageDetail.open('message-1', [message], users);
    const body = document.body.innerHTML;
    expect(body).toContain('2 tracked');
  });

  it('shows recipient usernames', () => {
    MessageDetail.open('message-1', [message], users);
    const body = document.body.innerHTML;
    expect(body).toContain('Noah');
    expect(body).toContain('Mateo');
  });

  it('does not show sender as recipient', () => {
    // Ava is the sender, should not appear in recipients
    const msg = {
      id: 'message-2',
      sender: 'Ava',
      text: 'Test',
      targetTopics: ['engineering'],
      createdAt: '2026-04-18T09:15:00.000Z',
    };
    const usersList = [
      {
        id: 'user-1',
        username: 'Ava',
        status: 'online',
        subscribedTopics: ['engineering'],
      },
      {
        id: 'user-2',
        username: 'Noah',
        status: 'online',
        subscribedTopics: ['engineering'],
      },
    ];
    MessageDetail.open('message-2', [msg], usersList);
    const body = document.body.innerHTML;
    // Should show Noah but not Ava in recipients section
    expect(body).toContain('Noah');
  });

  it('handles non-existent message ID', () => {
    MessageDetail.open('nonexistent', [message], users);
    // Should not create a modal
    const modal = document.querySelector('.modal');
    expect(modal).toBeNull();
  });

  it('handles empty messages array', () => {
    MessageDetail.open('any-id', [], users);
    const modal = document.querySelector('.modal');
    expect(modal).toBeNull();
  });
});

describe('MessageDetail.close', () => {
  const message = {
    id: 'message-1',
    sender: 'Ava',
    text: 'Test message',
    targetTopics: ['engineering'],
    createdAt: '2026-04-18T09:15:00.000Z',
  };

  it('removes modal from document body', () => {
    MessageDetail.open('message-1', [message], []);
    expect(document.querySelector('.modal')).not.toBeNull();

    MessageDetail.close();
    expect(document.querySelector('.modal')).toBeNull();
  });

  it('is safe to call when no modal exists', () => {
    // Should not throw
    expect(() => MessageDetail.close()).not.toThrow();
  });

  it('is safe to call multiple times', () => {
    MessageDetail.open('message-1', [message], []);
    MessageDetail.close();
    MessageDetail.close(); // Should not throw
    expect(document.querySelector('.modal')).toBeNull();
  });
});
