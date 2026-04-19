export function sanitizeTopicInput(value) {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

export function formatTopicPreview(topics) {
  if (topics.length <= 3) {
    return {
      visibleTopics: topics,
      hiddenCount: 0,
    };
  }

  return {
    visibleTopics: topics.slice(0, 3),
    hiddenCount: topics.length - 3,
  };
}
