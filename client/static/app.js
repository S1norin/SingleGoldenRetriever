let currentUser = null;
let currentTags = [];

async function login() {
    const username = document.getElementById("username-input").value.trim();
    if (!username) return;

    // Check auth against our new users.txt server
    const authRes = await fetch(`http://localhost:8001/auth?user=${username}`);
    if (!authRes.ok) {
        alert("Login failed: User not registered.");
        return;
    }

    const authData = await authRes.json();
    currentUser = authData.user;
    currentTags = authData.tags;

    // Tell the backend consumer to subscribe to these tags
    await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: currentTags })
    });

    renderTags();
    document.getElementById("auth-screen").classList.remove("active");
    document.getElementById("chat-screen").classList.add("active");

    startPolling();
}

async function sendMessage() {
    const textInput = document.getElementById("message-input");
    const tagsInput = document.getElementById("custom-tags-input");
    
    const text = textInput.value.trim();
    if (!text) return;

    // Parse comma-separated custom tags
    const customTagsStr = tagsInput.value.trim();
    let tagsToSend = currentTags;
    
    if (customTagsStr.length > 0) {
        tagsToSend = customTagsStr.split(",").map(t => t.trim()).filter(t => t);
    }

    // Backend already accepts a list of tags and processes them cleanly
    await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: currentUser, text: text, tags: tagsToSend })
    });

    textInput.value = "";
}

function startPolling() {
    setInterval(async () => {
        const res = await fetch(`/api/messages?user=${currentUser}&tags=${currentTags.join(",")}`);
        const messages = await res.json();
        
        const feed = document.getElementById("message-feed");
        feed.innerHTML = messages.map(msg => {
            const sendTime = new Date(msg.time_of_send).toLocaleTimeString();
            return `
            <div class="message">
                <div style="display: flex; justify-content: space-between;">
                    <strong>${msg.user} <small>[${msg.tags.join(", ")}]</small></strong>
                    <small style="color: var(--muted);">${sendTime}</small>
                </div>
                <p>${msg.text}</p>
                <small>Flow: ${msg.message_flow.join(" ➔ ")}</small>
            </div>
        `}).join("");
    }, 2000);

    setInterval(async () => {
        const res = await fetch("/api/online");
        const users = await res.json();
        
        document.getElementById("online-list").innerHTML = users.map(u => {
            const timeStr = new Date(u.last_seen * 1000).toLocaleTimeString();
            const icon = u.status === "online" ? "🟢" : "⚪";
            const color = u.status === "online" ? "var(--fg)" : "var(--muted)";
            return `<li style="color: ${color}">${icon} ${u.user} <br><small>Last seen: ${timeStr}</small></li>`;
        }).join("");
    }, 5000);

    setInterval(async () => {
        await fetch("/api/heartbeat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: currentUser })
        });
    }, 5000);
}

function renderTags() {
    document.getElementById("tags-list").innerHTML = currentTags.map(tag =>
        `<li class="tag-item">#${tag} <span class="tag-remove" onclick="unsubscribeFromTopic('${tag}')">&times;</span></li>`
    ).join("");
}

async function refreshTags() {
    const res = await fetch(`http://localhost:8001/auth?user=${currentUser}`);
    if (!res.ok) return;
    const data = await res.json();
    currentTags = data.tags;
    renderTags();
}

async function subscribeToTopic() {
    const input = document.getElementById("subscribe-input");
    const tag = input.value.trim();
    if (!tag || !currentUser) return;

    currentTags.push(tag);
    renderTags();
    input.value = "";

    const res = await fetch(`http://localhost:8001/auth/subscribe?user=${encodeURIComponent(currentUser)}&tag=${encodeURIComponent(tag)}`, { method: "PUT" });
    if (!res.ok) {
        const err = await res.json();
        alert(err.detail || "Failed to subscribe.");
        currentTags.pop();
        renderTags();
        return;
    }

    await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: [tag] })
    });

    await refreshTags();
}

async function unsubscribeFromTopic(tag) {
    if (!currentUser) return;

    currentTags = currentTags.filter(t => t !== tag);
    renderTags();

    const res = await fetch(`http://localhost:8001/auth/unsubscribe?user=${encodeURIComponent(currentUser)}&tag=${encodeURIComponent(tag)}`, { method: "PUT" });
    if (!res.ok) {
        const err = await res.json();
        alert(err.detail || "Failed to unsubscribe.");
        currentTags.push(tag);
        renderTags();
        return;
    }

    await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: [tag] })
    });

    await refreshTags();
}