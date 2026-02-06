import { useState } from "react";
import Admin from "./Admin";
import User from "./User";
import { Button } from "@/components/ui/button";

export default function App() {
  const [view, setView] = useState("admin");

  return (
    <div className="p-6 space-y-4">
      <div className="flex gap-2">
        <Button
          variant={view === "admin" ? "default" : "outline"}
          onClick={() => setView("admin")}
        >
          Admin Dashboard
        </Button>

        <Button
          variant={view === "user" ? "default" : "outline"}
          onClick={() => setView("user")}
        >
          User Dashboard
        </Button>
      </div>

      {view === "admin" ? <Admin /> : <User />}
    </div>
  );
}
