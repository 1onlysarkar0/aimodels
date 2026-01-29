import { OpenAIService } from "./openai-service";

const openAIService = new OpenAIService();
let isVpnConnected = false;

const server = Bun.serve({
  port: 5000,
  hostname: "0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (url.pathname === "/api/vpn/status" && req.method === "GET") {
        return new Response(JSON.stringify({ status: isVpnConnected ? "connected" : "disconnected" }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (url.pathname === "/api/vpn/config" && req.method === "POST") {
        const body = await req.json();
        if (body.config) {
          await Bun.write("wg0.conf", body.config);
          return new Response(JSON.stringify({ status: "saved" }), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        return new Response(JSON.stringify({ error: "No config provided" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (url.pathname === "/api/vpn/connect" && req.method === "POST") {
        const hasConfig = await Bun.file("wg0.conf").exists();
        if (!hasConfig) {
          return new Response(JSON.stringify({ error: "VPN config missing. Please upload wg0.conf first." }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        
        isVpnConnected = true;
        return new Response(JSON.stringify({ 
          status: "connected", 
          simulated: true,
          message: "VPN simulated. Replit environment restricted from kernel-level TUN devices." 
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (url.pathname === "/" || url.pathname === "/dashboard") {
        const modelsResponse = openAIService.getModels();
        const models = modelsResponse.data || [];
        const modelOptions = models.map(m => `<option value="${m.id}">${m.id}</option>`).join("");
        
        const dashboardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DuckAI Advanced Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
    </style>
</head>
<body class="bg-zinc-950 text-zinc-100 min-h-screen font-sans">
    <div class="max-w-6xl mx-auto p-4 md:p-8">
        <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6 mb-8">
            <div>
                <h1 class="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                    <i class="fas fa-shield-halved text-blue-500"></i> DuckAI Advanced
                </h1>
                <p class="text-zinc-400">Future-proof Management Console</p>
            </div>
            <div class="flex items-center gap-4">
                <span id="vpn-badge" class="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                    <i id="vpn-dot" class="fas fa-circle text-red-500 text-[10px]"></i> <span id="vpn-text">Checking VPN...</span>
                </span>
            </div>
        </header>

        <main class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-6">
                <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
                    <div class="p-4 border-b border-zinc-800 bg-zinc-900/50 space-y-4">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2 text-green-500">
                                <i class="fas fa-comment-dots"></i>
                                <h2 class="font-semibold text-zinc-100">Live Chat</h2>
                            </div>
                            <select id="model-select" class="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500">
                                ${modelOptions}
                            </select>
                        </div>
                        <div class="space-y-2">
                            <label class="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">System Prompt</label>
                            <textarea id="system-prompt" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 outline-none h-20 text-zinc-100" placeholder="Enter system instructions..."></textarea>
                        </div>
                    </div>
                    <div id="chat-box" class="h-[400px] overflow-y-auto p-4 space-y-4 bg-zinc-950/30 font-mono text-sm">
                        <div class="flex justify-start">
                            <div class="bg-zinc-800 text-zinc-100 px-4 py-2 rounded-2xl max-w-[80%] shadow-sm border border-zinc-700">
                                Production engine active. Use /v1 endpoints for API access.
                            </div>
                        </div>
                    </div>
                    <div class="p-4 border-t border-zinc-800 bg-zinc-900/50 flex gap-2">
                        <input id="chat-input" type="text" placeholder="Message assistant..." class="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-100">
                        <button id="send-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all font-semibold flex items-center gap-2">
                            <i class="fas fa-paper-plane text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
                    <h2 class="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-100">
                        <i class="fas fa-network-wired text-blue-500"></i> WireGuard VPN
                    </h2>
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label class="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Upload wg0.conf</label>
                            <textarea id="vpn-config" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-[10px] font-mono focus:ring-1 focus:ring-blue-500 outline-none h-32 text-zinc-100" placeholder="Paste wg0.conf content here..."></textarea>
                            <button id="save-vpn-btn" class="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs py-2 rounded transition-all">
                                Save Configuration
                            </button>
                        </div>
                        <button id="vpn-btn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all transform active:scale-[0.98] shadow-lg shadow-blue-500/20 mt-2">
                            ACTIVATE VPN
                        </button>
                    </div>
                </div>

                <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
                    <h2 class="text-lg font-semibold mb-4 text-zinc-100">API Status</h2>
                    <div class="space-y-4">
                        <div class="text-[10px] text-zinc-500 uppercase font-bold mb-1">Production URL</div>
                        <div class="bg-zinc-950 p-2 rounded border border-zinc-800 font-mono text-[10px] text-blue-400 break-all select-all" id="api-url"></div>
                        <div class="flex justify-between items-center text-xs pt-2">
                            <span class="text-zinc-500">Rate Limits</span>
                            <span class="text-green-500 font-bold">REMOVED</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script>
        const chatBox = document.getElementById("chat-box");
        const chatInput = document.getElementById("chat-input");
        const sendBtn = document.getElementById("send-btn");
        const vpnBtn = document.getElementById("vpn-btn");
        const saveVpnBtn = document.getElementById("save-vpn-btn");
        const vpnConfig = document.getElementById("vpn-config");
        const vpnDot = document.getElementById("vpn-dot");
        const vpnText = document.getElementById("vpn-text");
        const modelSelect = document.getElementById("model-select");
        const systemPrompt = document.getElementById("system-prompt");
        const apiUrl = document.getElementById("api-url");

        apiUrl.innerText = window.location.origin;

        function updateVpnStatus(status) {
            if (status === "connected") {
                vpnDot.className = "fas fa-circle text-green-500 text-[10px]";
                vpnText.innerText = "VPN Active (Simulated)";
                vpnBtn.innerText = "CONNECTED";
                vpnBtn.className = "w-full bg-green-600/20 text-green-500 border border-green-500 font-bold py-3 rounded-lg cursor-default";
            } else {
                vpnDot.className = "fas fa-circle text-red-500 text-[10px]";
                vpnText.innerText = "VPN Disconnected";
                vpnBtn.innerText = "ACTIVATE VPN";
                vpnBtn.className = "w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all transform active:scale-[0.98] shadow-lg shadow-blue-500/20 mt-2";
            }
        }

        async function checkVpnStatus() {
            try {
                const res = await fetch("/api/vpn/status");
                const data = await res.json();
                updateVpnStatus(data.status);
            } catch (e) {}
        }

        setInterval(checkVpnStatus, 5000);
        checkVpnStatus();

        function createMessageElement(role) {
            const div = document.createElement("div");
            div.className = "flex " + (role === "user" ? "justify-end" : "justify-start");
            const inner = document.createElement("div");
            inner.className = (role === "user" ? "bg-blue-600 border-blue-500" : "bg-zinc-800 border-zinc-700") + " text-zinc-100 px-4 py-2 rounded-2xl max-w-[80%] shadow-lg border";
            div.appendChild(inner);
            chatBox.appendChild(div);
            return inner;
        }

        async function handleChat() {
            const text = chatInput.value.trim();
            if (!text) return;
            
            const userMsg = createMessageElement("user");
            userMsg.innerText = text;
            chatInput.value = "";
            chatBox.scrollTop = chatBox.scrollHeight;

            const assistantMsg = createMessageElement("assistant");
            assistantMsg.innerText = "...";
            
            const messages = [];
            if (systemPrompt.value.trim()) {
                messages.push({ role: "system", content: systemPrompt.value });
            }
            messages.push({ role: "user", content: text });

            try {
                const response = await fetch("/v1/chat/completions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: modelSelect.value,
                        messages: messages,
                        stream: true
                    })
                });

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                assistantMsg.innerText = "";
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunk = decoder.decode(value);
                    const lines = chunk.split("\\n");
                    
                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            const data = line.slice(6).trim();
                            if (data === "[DONE]") continue;
                            try {
                                const json = JSON.parse(data);
                                const content = json.choices[0].delta.content;
                                if (content) {
                                    assistantMsg.innerText += content;
                                    chatBox.scrollTop = chatBox.scrollHeight;
                                }
                            } catch (e) {}
                        }
                    }
                }
            } catch (e) {
                assistantMsg.innerText = "Error: System not responding.";
            }
        }

        sendBtn.addEventListener("click", handleChat);
        chatInput.addEventListener("keypress", (e) => e.key === "Enter" && handleChat());

        saveVpnBtn.addEventListener("click", async () => {
            const config = vpnConfig.value.trim();
            if (!config) return alert("Please enter config content");
            
            saveVpnBtn.disabled = true;
            saveVpnBtn.innerText = "Saving...";
            try {
                const res = await fetch("/api/vpn/config", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ config })
                });
                if (res.ok) {
                    alert("VPN configuration saved successfully!");
                } else {
                    const err = await res.json();
                    alert("Error: " + (err.error || "Failed to save"));
                }
            } catch (e) {
                alert("Network error");
            } finally {
                saveVpnBtn.disabled = false;
                saveVpnBtn.innerText = "Save Configuration";
            }
        });

        vpnBtn.addEventListener("click", async () => {
            if (vpnBtn.innerText === "CONNECTED") return;
            vpnBtn.disabled = true;
            vpnBtn.innerText = "CONNECTING...";
            try {
                const res = await fetch("/api/vpn/connect", { method: "POST" });
                const data = await res.json();
                if (data.status === "connected") {
                    updateVpnStatus("connected");
                } else {
                    alert("Error: " + (data.error || "Connection failed"));
                    vpnBtn.disabled = false;
                    vpnBtn.innerText = "ACTIVATE VPN";
                }
            } catch (e) {
                alert("Network error");
                vpnBtn.disabled = false;
                vpnBtn.innerText = "ACTIVATE VPN";
            }
        });
    </script>
</body>
</html>`;
        return new Response(dashboardHtml, {
          headers: { "Content-Type": "text/html", ...corsHeaders },
        });
      }

      if (url.pathname === "/health" && req.method === "GET") {
        return new Response(JSON.stringify({ status: "ok" }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (url.pathname === "/v1/models" && req.method === "GET") {
        const models = openAIService.getModels();
        return new Response(JSON.stringify(models), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (url.pathname === "/v1/chat/completions" && req.method === "POST") {
        const body = await req.json();
        const validatedRequest = openAIService.validateRequest(body);

        const stream =
          await openAIService.createChatCompletionStream(validatedRequest);
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            ...corsHeaders,
          },
        });
      }

      return new Response(
        JSON.stringify({
          error: {
            message: "Not found",
            type: "invalid_request_error",
          },
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } catch (error) {
      console.error("Server error:", error);
      return new Response(
        JSON.stringify({
          error: {
            message: "Internal server error",
            type: "internal_server_error",
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  },
});

console.log(`🚀 DuckAI Production Server running on port ${server.port}`);

(async () => {
    const hasConfig = await Bun.file("wg0.conf").exists();
    if (hasConfig) {
        console.log("🔄 Auto-connecting VPN...");
        try {
            await new Promise(r => setTimeout(r, 1000));
            const res = await fetch(`http://0.0.0.0:${server.port}/api/vpn/connect`, { method: "POST" });
            const data = await res.json();
            if (data.status === "connected") {
                console.log("✅ VPN Auto-connected (Simulated)");
            }
        } catch (e) {
            console.error("❌ VPN Auto-connect failed:", e);
        }
    } else {
        console.log("ℹ️ No VPN config found for auto-connect.");
    }
})();
