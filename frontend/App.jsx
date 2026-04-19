import React, { useEffect, useRef, useState } from "react";
import AuthPage from "./components/AuthPage";
import FlowMonitor from "./components/FlowMonitor";
import LeftSidebar from "./components/LeftSidebar";
import MessageComposer from "./components/MessageComposer";
import MessageFeed from "./components/MessageFeed";
import MessageModal from "./components/MessageModal";
import MobileDrawer from "./components/MobileDrawer";
import RightSidebar from "./components/RightSidebar";
import {
  defaultCurrentUser,
  mockMessages,
  mockOnlineUsers,
  mockSubscribedTopics,
} from "./mockData";
import { sanitizeTopicInput } from "./utils/topicUtils";

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [subscribedTopics, setSubscribedTopics] = useState(mockSubscribedTopics);
  const [messages, setMessages] = useState(mockMessages);
  const [onlineUsers] = useState(mockOnlineUsers);
  const [selectedTopics, setSelectedTopics] = useState(mockSubscribedTopics);
  const [activeMessage, setActiveMessage] = useState(null);
  const [flowItems, setFlowItems] = useState([]);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [joinError, setJoinError] = useState("");
  const flowTimeoutsRef = useRef([]);

  useEffect(() => {
    return () => {
      flowTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  useEffect(() => {
    setSelectedTopics((previousTopics) => {
      const stillSubscribed = previousTopics.filter((topic) =>
        subscribedTopics.includes(topic),
      );
      const newlySubscribed = subscribedTopics.filter(
        (topic) => !previousTopics.includes(topic),
      );

      return [...stillSubscribed, ...newlySubscribed];
    });
  }, [subscribedTopics]);

  const visibleMessages = messages.filter((message) =>
    message.targetTopics.some((topic) => subscribedTopics.includes(topic)),
  );

  const currentUser = authUser?.username ?? defaultCurrentUser;

  const handleJoinTopic = (rawTopicName) => {
    const sanitizedTopic = sanitizeTopicInput(rawTopicName);

    if (!sanitizedTopic) {
      setJoinError("Use letters, numbers, hyphens, or underscores.");
      return false;
    }

    if (subscribedTopics.includes(sanitizedTopic)) {
      setJoinError("Already subscribed.");
      return false;
    }

    setSubscribedTopics((previousTopics) => [...previousTopics, sanitizedTopic]);
    setJoinError("");
    setLeftDrawerOpen(false);
    console.info("join-topic", { topic: sanitizedTopic });
    return true;
  };

  const handleRemoveTopic = (topicToRemove) => {
    setSubscribedTopics((previousTopics) =>
      previousTopics.filter((topic) => topic !== topicToRemove),
    );
    setLeftDrawerOpen(false);
    console.info("unsubscribe-topic", { topic: topicToRemove });
  };

  const handleToggleSelectedTopic = (topicToToggle) => {
    setSelectedTopics((previousTopics) =>
      previousTopics.includes(topicToToggle)
        ? previousTopics.filter((topic) => topic !== topicToToggle)
        : [...previousTopics, topicToToggle],
    );
  };

  const handleTopicDraftChange = () => {
    if (joinError) {
      setJoinError("");
    }
  };

  const handleSendMessage = (text) => {
    const trimmedText = text.trim();

    if (!trimmedText || selectedTopics.length === 0) {
      return false;
    }

    const payload = {
      sender: currentUser,
      text: trimmedText,
      targetTopics: selectedTopics,
    };

    const nextMessage = {
      id: `message-${Date.now()}`,
      ...payload,
      createdAt: new Date().toISOString(),
    };

    setMessages((previousMessages) => [nextMessage, ...previousMessages]);
    startFlow(nextMessage);
    console.info("produce-message", payload);
    return true;
  };

  const handleLogin = ({ username }) => {
    setAuthUser({ username });
  };

  const handleLogout = () => {
    setAuthUser(null);
    setActiveMessage(null);
    setFlowItems([]);
    flowTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    flowTimeoutsRef.current = [];
  };

  const startFlow = (message) => {
    const flowId = `flow-${Date.now()}`;
    const baseFlow = {
      id: flowId,
      sender: message.sender,
      text: message.text,
      targetTopics: message.targetTopics,
      activeStage: "producer",
      statusLabel: "Producing",
      stages: {
        producer: "active",
        topic: "waiting",
        consumer: "waiting",
      },
    };

    setFlowItems((previousFlows) => [baseFlow, ...previousFlows].slice(0, 5));

    const topicTimeout = window.setTimeout(() => {
      setFlowItems((previousFlows) =>
        previousFlows.map((flow) =>
          flow.id === flowId
            ? {
                ...flow,
                activeStage: "topic",
                statusLabel: "In Topic",
                stages: {
                  producer: "done",
                  topic: "active",
                  consumer: "waiting",
                },
              }
            : flow,
        ),
      );
    }, 500);

    const consumerTimeout = window.setTimeout(() => {
      setFlowItems((previousFlows) =>
        previousFlows.map((flow) =>
          flow.id === flowId
            ? {
                ...flow,
                activeStage: "consumer",
                statusLabel: "Delivered",
                stages: {
                  producer: "done",
                  topic: "done",
                  consumer: "done",
                },
              }
            : flow,
        ),
      );
    }, 1100);

    flowTimeoutsRef.current.push(topicTimeout, consumerTimeout);
  };

  if (!authUser) {
    return (
      <AuthPage defaultUsername={defaultCurrentUser} onLogin={handleLogin} />
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[var(--bg)] text-[var(--fg)]">
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4 lg:hidden">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              SingleGoldenRetriever
            </p>
            <h1 className="text-base font-semibold">Messenger</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="border border-[var(--border)] px-3 py-2 text-sm text-[var(--fg)]"
            >
              Sign out
            </button>
            <button
              type="button"
              onClick={() => setLeftDrawerOpen(true)}
              className="border border-[var(--border)] px-3 py-2 text-sm text-[var(--fg)]"
            >
              Topics
            </button>
            <button
              type="button"
              onClick={() => setRightDrawerOpen(true)}
              className="border border-[var(--border)] px-3 py-2 text-sm text-[var(--fg)]"
            >
              Users
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[25%_50%_25%]">
          <aside className="hidden min-h-0 border-r border-[var(--border)] lg:flex">
            <LeftSidebar
              subscribedTopics={subscribedTopics}
              onJoinTopic={handleJoinTopic}
              onRemoveTopic={handleRemoveTopic}
              onDraftChange={handleTopicDraftChange}
              joinError={joinError}
            />
          </aside>

          <main className="flex min-h-0 flex-col">
            <div className="hidden items-center justify-between border-b border-[var(--border)] px-4 py-4 lg:flex">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  SingleGoldenRetriever
                </p>
                <h1 className="text-base font-semibold">Single Kafka Messenger</h1>
              </div>
              <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
                <span>{currentUser}</span>
                <span>Visible: {visibleMessages.length}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="border border-[var(--border)] px-3 py-2 text-[var(--fg)]"
                >
                  Sign out
                </button>
              </div>
            </div>

            <FlowMonitor flowItems={flowItems} currentUser={currentUser} />

            <MessageFeed
              messages={visibleMessages}
              currentUser={currentUser}
              onSelectMessage={setActiveMessage}
            />

            <MessageComposer
              availableTopics={subscribedTopics}
              selectedTopics={selectedTopics}
              onToggleTopic={handleToggleSelectedTopic}
              onSend={handleSendMessage}
            />
          </main>

          <aside className="hidden min-h-0 border-l border-[var(--border)] lg:flex">
            <RightSidebar onlineUsers={onlineUsers} />
          </aside>
        </div>
      </div>

      <MobileDrawer
        open={leftDrawerOpen}
        title="Subscribed Topics"
        onClose={() => setLeftDrawerOpen(false)}
      >
        <LeftSidebar
          subscribedTopics={subscribedTopics}
          onJoinTopic={handleJoinTopic}
          onRemoveTopic={handleRemoveTopic}
          onDraftChange={handleTopicDraftChange}
          joinError={joinError}
          compact
        />
      </MobileDrawer>

      <MobileDrawer
        open={rightDrawerOpen}
        title="Online Now"
        onClose={() => setRightDrawerOpen(false)}
      >
        <RightSidebar onlineUsers={onlineUsers} compact />
      </MobileDrawer>

      <MessageModal
        message={activeMessage}
        currentUser={currentUser}
        onClose={() => setActiveMessage(null)}
      />
    </div>
  );
}
