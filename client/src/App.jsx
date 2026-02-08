import { useState } from "react";
import Admin from "./Admin";
import User from "./User";
import { Button } from "@/components/ui/button";

export default function App() {
  const [view, setView] = useState("admin");

  return (
    <div className="min-h-screen bg-background">

      {/* Top Navigation */}
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">
            Notification System
          </h1>

          <div className="flex gap-2">
            <Button
              variant={view === "admin" ? "default" : "outline"}
              onClick={() => setView("admin")}
            >
              Admin
            </Button>

            <Button
              variant={view === "user" ? "default" : "outline"}
              onClick={() => setView("user")}
            >
              User
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {view === "admin" ? <Admin /> : <User />}
      </main>

    </div>
  );
}
