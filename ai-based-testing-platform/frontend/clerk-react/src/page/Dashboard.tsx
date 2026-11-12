import { useState, useEffect } from 'react';
import { useUser } from '@clerk/react';

const projects = [
    { name: "demo-org/demo-repo", status: "connected", coverage: 72 },
    { name: "acme/webapp", status: "connected", coverage: 58 },
];

const generations = [
    { id: "run_001", scope: "endpoint", status: "proposal:draft", cost: "$0.12" },
    { id: "run_002", scope: "file", status: "running", cost: "$0.08" },
];

function Dashboard() {
    const { user } = useUser();
    const [chat, setChat] = useState<{ role: string; text: string }[]>([
        { role: "assistant", text: "Ask me anything about your repositories." },
    ]);
    const [input, setInput] = useState("");
    const [url, setUrl] = useState("");
    const [showModal, setShowModal] = useState(true);
    const [status, setStatus] = useState("");

    useEffect(() => {
        const hasRepo = localStorage.getItem("aitp_repo_connected");
        if (hasRepo) setShowModal(false);
    }, []);

    const send = () => {
        if (!input.trim()) return;
        setChat((c) => [...c, { role: "user", text: input }, { role: "assistant", text: "Analyzing your repo..." }]);
        setInput("");
    };

    const validateRepo = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("Checking...");
        try {
            const res = await fetch("/api/projects/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });
            const data = await res.json();
            if (data.valid) {
                localStorage.setItem("aitp_repo_connected", "1");
                setStatus("Valid repository — connected!");
                setTimeout(() => setShowModal(false), 800);
            } else {
                setStatus(data.message || "Invalid repository URL");
            }
        } catch {
            setStatus("Backend unavailable");
        }
    };

    return (
        <div className="w-full text-white bg-black">
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                    <div className="w-full max-w-md rounded-lg border border-white/10 bg-white/5 p-6 mx-4">
                        <h3 className="text-lg font-semibold mb-3 text-center">Connect GitHub Repository</h3>
                        <p className="text-sm text-white/60 mb-4 text-center">
                            Enter your GitHub repository URL to get started.
                        </p>
                        <form onSubmit={validateRepo} className="flex flex-col gap-3">
                            <input
                                type="text"
                                placeholder="https://github.com/owner/repo"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="rounded-md bg-black border border-white/20 px-3 py-2 text-sm text-white"
                            />
                            <div className="flex gap-2">
                                <button type="submit" className="flex-1 rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90">
                                    Validate & Connect
                                </button>
                            </div>
                            {status && <div className="text-xs text-center text-white/70">{status}</div>}
                        </form>
                    </div>
                </div>
            )}

            <main className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold">Overview</h1>
                <p className="text-white/60 mt-1">Welcome, {user?.firstName ?? "engineer"}</p>

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
            </main>
        </div>
    );
}

export default Dashboard;