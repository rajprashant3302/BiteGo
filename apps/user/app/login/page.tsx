"use client"; // Required for interactivity/buttons

import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <main style={{ padding: "50px", textAlign: "center" }}>
      <h1>Welcome to the Website</h1>
      <hr />

      {!session ? (
        <div>
          <p>You are not logged in.</p>
          <button 
            onClick={() => signIn("google")}
            style={{ padding: "10px 20px", cursor: "pointer", background: "#4285F4", color: "white", border: "none", borderRadius: "4px" }}
          >
            Sign in with Google
          </button>
        </div>
      ) : (
        <div>
          <p>Logged in as: <strong>{session.user?.email}</strong></p>
          <p>Role: {session.user?.role}</p>
          <button 
            onClick={() => signOut()}
            style={{ padding: "10px 20px", cursor: "pointer" }}
          >
            Sign out
          </button>
        </div>
      )}
    </main>
  );
}