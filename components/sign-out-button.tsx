import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/auth";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
      className="hidden sm:block"
    >
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        aria-label="Abmelden"
        title="Abmelden"
      >
        <LogOut className="size-4" />
      </Button>
    </form>
  );
}
