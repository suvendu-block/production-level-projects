import { Link } from "react-router-dom";
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/react';

function Navbar() {
    const { isSignedIn } = useUser();

    const authButtons = isSignedIn ? (
        <UserButton />
    ) : (
        <>
            <SignInButton mode="modal">
                <button className="rounded-md border border-white/20 px-3 py-1.5 text-sm text-white hover:bg-white/10 transition-colors">
                    Sign In
                </button>
            </SignInButton>
            <SignUpButton mode="modal">
                <button className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-[#5c5470] hover:bg-white/90 transition-colors">
                    Sign Up
                </button>
            </SignUpButton>
        </>
    );

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#5c5470]/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link to="/" className="text-lg font-bold tracking-tight text-white hover:text-white/80 transition-colors">
                    Logo
                </Link>

                <div className="hidden md:flex items-center gap-6">
                    {authButtons}
                </div>

                <details className="md:hidden group">
                    <summary className="cursor-pointer list-none text-white">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </summary>
                    <div className="absolute left-0 right-0 top-16 flex flex-col gap-3 border-b border-white/10 bg-[#5c5470] p-4">
                        {authButtons}
                    </div>
                </details>
            </div>
        </nav>
    );
}

export default Navbar;
