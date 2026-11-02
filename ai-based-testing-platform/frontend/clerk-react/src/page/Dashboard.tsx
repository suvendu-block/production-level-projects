import { useState } from 'react';
import { useUser } from '@clerk/react';

const tabs = ["Overview", "API Keys", "Skills"];

const projects = [
    { name: "demo-org/demo-repo", status: "connected", coverage: 72 },
    { name: "acme/webapp", status: "connected", coverage: 58 },
];

const generations = [
    { id: "run_001", scope: "endpoint", status: "proposal:draft", cost: "$0.12" },
    { id: "run_002", scope: "file", status: "running", cost: "$0.08" },
];

const apiKeys = [
    { name: "Production", key: "aitp_live_••••••••", created: "2026-10-01" },
    { name: "Staging", key: "aitp_test_••••••••", created: "2026-10-12" },
];

const skills = [
    { name: "OpenAPI Import", desc: "Import specs and auto-generate API tests." },
    { name: "Playwright E2E", desc: "Browser-based end-to-end test generation." },
    { name: "Self-Heal", desc: "Propose fixes for broken selectors." },
];

function Dashboard() {
    const { user } = useUser();
    const [active, setActive] = useState("Overview");
    const [chat, setChat] = useState<{ role: string; text: string }[]>([
        { role: "assistant", text: "Ask me anything about your repositories." },
    ]);
    const [input, setInput] = useState("");
    const [repoUrl, setRepoUrl] = useState("");
    const [repoStatus, setRepoStatus] = useState("");

    const send = () => {
        if (!input.trim()) return;
        setChat((c) => [...c, { role: "user", text: input }, { role: "assistant", text: "Analyzing your repo..." }]);
        setInput("");
    };

    const validateRepo = async () => {
        setRepoStatus("Checking...");
        try {
            const res = await fetch("http://localhost:5000/api/projects/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: repoUrl }),
            });
            const data = await res.json();
            setRepoStatus(data.valid ? "Valid repository" : data.message);
        } catch {
            setRepoStatus("Backend unavailable");
        }
    };

    return (
        <div className="flex min-h-screen w-full text-white bg-black">
            <aside className="w-60 shrink-0 border-r border-white/10 bg-white/5 p-4 hidden md:block">
                <div className="text-lg font-bold mb-6">AITP</div>
                <nav className="flex flex-col gap-1">
                    {tabs.map((t) => (
                        <button
                            key={t}
                            onClick={() => setActive(t)}
                            className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${active === t ? "bg-white text-black" : "text-white/70 hover:bg-white/10"}`}
                        >
                            {t}
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 overflow-auto">
                <h1 className="text-2xl font-bold">{active}</h1>
                <p className="text-white/60 mt-1">Welcome, {user?.firstName ?? "engineer"}</p>

                {active === "Overview" && (
                    <>
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                            <div className="text-sm text-white/60">Health</div>
                            <div className="mt-1 text-lg font-semibold text-green-400">{"{\"status\":\"ok\"}"}</div>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                            <div className="text-sm text-white/60">Projects</div>
                            <div className="mt-1 text-lg font-semibold">{projects.length}</div>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                            <div className="text-sm text-white/60">Active runs</div>
                            <div className="mt-1 text-lg font-semibold">{generations.length}</div>
                        </div>
                    </div>
                    <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 max-w-2xl mx-auto">
                        <h3 className="font-semibold mb-3 text-center">Repo Chat</h3>
                        <div className="h-48 overflow-y-auto space-y-2 mb-3">
                            {chat.map((m, i) => (
                                <div key={i} className={`text-sm ${m.role === "user" ? "text-right" : "text-left"}`}>
                                    <span className={`inline-block px-3 py-1.5 rounded-lg ${m.role === "user" ? "bg-white text-black" : "bg-white/10"}`}>{m.text}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && send()}
                                placeholder="Ask about your repo..."
                                className="flex-1 rounded-md bg-black border border-white/20 px-3 py-2 text-sm text-white"
                            />
                            <button onClick={send} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90">Send</button>
                        </div>
                    </div>
                    </>
                )}

                {active === "API Keys" && (
                    <section className="mt-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">API Keys</h2>
                            <button className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black hover:bg-white/90">Create key</button>
                        </div>
                        <div className="mt-4 grid gap-4">
                            {apiKeys.map((k) => (
                                <div key={k.name} className="rounded-lg border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{k.name}</div>
                                        <div className="text-sm text-white/60 mt-1">{k.key} · created {k.created}</div>
                                    </div>
                                    <button className="text-sm text-red-400 hover:text-red-300">Revoke</button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {active === "Skills" && (
                    <section className="mt-6">
                        <h2 className="text-xl font-semibold">Skills</h2>
                        <p className="text-sm text-white/60 mt-1">Out-of-the-box capabilities you can enable.</p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {skills.map((s) => (
                                <div key={s.name} className="rounded-lg border border-white/10 bg-white/5 p-4">
                                    <div className="font-medium">{s.name}</div>
                                    <div className="text-sm text-white/60 mt-1">{s.desc}</div>
                                    <button className="mt-3 rounded-full border border-white/40 px-3 py-1 text-xs hover:bg-white/10">Enable</button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

export default Dashboard;
