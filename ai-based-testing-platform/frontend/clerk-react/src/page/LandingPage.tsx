import { Link } from "react-router-dom";
import { SignInButton, SignUpButton, useUser } from '@clerk/react';

const features = [
    { title: "AI Test Generator", desc: "Turns diffs, OpenAPI specs, and user stories into unit/API/E2E test cases as real, committable code." },
    { title: "Execution Engine", desc: "Runs tests in ephemeral, isolated containers (Playwright, pytest, Jest) with full logs, traces, and screenshots." },
    { title: "Self-Healing", desc: "Detects broken selectors and flaky assertions, proposes minimal diffs, requires human approval before applying." },
    { title: "Visual Regression", desc: "Screenshot diffing with perceptual hashing; AI triages meaningful changes vs. noise." },
    { title: "Analytics & Risk", desc: "Coverage maps, flakiness scores, risk-based test selection per change." },
];

const problems = [
    "Outdated test coverage",
    "Brittle and broken E2E tests",
    "Flaky tests developers don't trust",
    "Manual testing slowing releases",
];

const steps = [
    "Connect your GitHub/GitLab repository.",
    "AI analyzes code changes.",
    "Generates and executes tests.",
    "Provides reports and suggested fixes.",
];

function LandingPage() {
    const { isSignedIn } = useUser();
    return (
        <div className="w-full text-white bg-black relative overflow-hidden">
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-white/10 blur-3xl bg-orb" />
                <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-white/5 blur-3xl bg-orb" style={{ animationDelay: "2s" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full border border-white/5 [transform:perspective(800px)_rotateX(60deg)]" />
            </div>
            <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8 animate-fade-up">
                <div className="mx-auto max-w-7xl text-center">
                    <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-white">
                        Your AI QA Team. Testing Every Release.
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
                        AITP drafts reviewable tests, runs them in isolated sandboxes, keeps them passing as your product evolves, and reports what is risky, flaky, or untested.
                    </p>
                    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        {isSignedIn ? (
                            <Link to="/dashboard" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90 hover:scale-105 transition-all">
                                Go to Dashboard
                            </Link>
                        ) : (
                            <SignUpButton mode="modal" redirectUrl="/dashboard">
                                <button className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90 hover:scale-105 transition-all">
                                    Get Started
                                </button>
                            </SignUpButton>
                        )}
                        <button className="rounded-full border cursor-pointer border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                            Watch Demo
                        </button>
                    </div>
                    <div className="mx-auto mt-16 max-w-4xl rounded-xl border border-white/20 bg-white/5 p-4 text-left font-mono text-xs text-white shadow-2xl animate-float">
                        <div className="mb-2 text-white/40">$ aitp run --suite e2e</div>
                        <div>✓ login.spec.ts (3 tests, 1.2s)</div>
                        <div>✓ checkout.spec.ts (5 tests, 2.4s)</div>
                        <div className="text-red-400">✗ profile.spec.ts — selector #avatar changed</div>
                        <div className="text-amber-300">↻ self-heal: proposed diff (pending review)</div>
                    </div>
                </div>
            </section>

            <section className="px-4 py-20 sm:px-6 lg:px-8 bg-white/5 animate-fade-up" style={{ animationDelay: "0.1s" }}>
                <div className="mx-auto max-w-7xl text-center">
                    <h2 className="text-3xl font-bold sm:text-4xl">Software Moves Fast. Testing Can't Keep Up.</h2>
                    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {problems.map((p) => (
                            <div key={p} className="rounded-lg border border-white/10 bg-white/5 p-6 text-sm hover:border-white/40 transition-colors">
                                {p}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-4 py-20 sm:px-6 lg:px-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
                <div className="mx-auto max-w-7xl text-center">
                    <h2 className="text-3xl font-bold sm:text-4xl">Everything You Need to Automate Software Testing.</h2>
                    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((f) => (
                            <div key={f.title} className="rounded-lg border border-white/10 bg-white/5 p-6 text-left hover:-translate-y-1 hover:border-white/40 transition-all">
                                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                                <p className="mt-2 text-sm text-white/70">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-4 py-20 sm:px-6 lg:px-8 bg-white/5 animate-fade-up" style={{ animationDelay: "0.3s" }}>
                <div className="mx-auto max-w-7xl text-center">
                    <h2 className="text-3xl font-bold sm:text-4xl">From Code Commit to Tested Release.</h2>
                    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {steps.map((s, i) => (
                            <div key={s} className="rounded-lg border border-white/10 bg-white/5 p-6 text-left">
                                <div className="text-2xl font-bold text-white">{i + 1}</div>
                                <p className="mt-2 text-sm text-white/70">{s}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-4 py-20 sm:px-6 lg:px-8 animate-fade-up" style={{ animationDelay: "0.4s" }}>
                <div className="mx-auto max-w-7xl text-center">
                    <h2 className="text-3xl font-bold sm:text-4xl">Watch AI Test Your Application.</h2>
                    <p className="mx-auto mt-4 max-w-2xl text-white/70">
                        Interactive browser preview, AI agent performing user actions, live execution logs, test results, automatic bug detection, screenshots and error reports.
                    </p>
                    <div className="mx-auto mt-10 aspect-video max-w-4xl rounded-xl border border-white/20 bg-white/5 flex items-center justify-center text-white/40">
                        Live demo preview
                    </div>
                </div>
            </section>

            <section className="px-4 py-24 sm:px-6 lg:px-8 text-center animate-fade-up" style={{ animationDelay: "0.5s" }}>
                <h2 className="text-3xl font-bold sm:text-5xl text-white">
                    Ship Faster. Break Less. Test Smarter.
                </h2>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        {isSignedIn ? (
                            <Link to="/dashboard" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90 hover:scale-105 transition-all">
                                Go to Dashboard
                            </Link>
                        ) : (
                            <SignUpButton mode="modal" redirectUrl="/dashboard">
                                <button className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90 hover:scale-105 transition-all">
                                    Start Testing for Free
                                </button>
                            </SignUpButton>
                        )}
                    <button className="rounded-full cursor-pointer border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                        Book a Demo
                    </button>
                </div>
            </section>

            <footer className="border-t border-white/10 px-4 py-10 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-6 sm:flex-row">
                    <div className="text-sm text-white/60">© 2026 AITP. All rights reserved.</div>
                    <div className="flex flex-wrap gap-6 text-sm text-white/60">
                        <a href="#" className="hover:text-white">Product</a>
                        <a href="#" className="hover:text-white">Documentation</a>
                        <a href="#" className="hover:text-white">Integrations</a>
                        <a href="#" className="hover:text-white">Company</a>
                        <a href="#" className="hover:text-white">Privacy</a>
                        <a href="#" className="hover:text-white">GitHub</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
