import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppHeader } from "@/components/app-header";
import { auth } from "@/auth";
import { NewDeckForm } from "./new-deck-form";

export const metadata = { title: "Neues Set · Mausi wird Ärztin" };

export default async function NewDeckPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-6 py-10 flex-1">
        <div className="mx-auto w-full max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Neuer Lernstapel für Mausi 🐭</CardTitle>
              <CardDescription>
                Lad ein PDF mit deinem Lernstoff hoch — ich bastel dir daraus
                prüfungsnahe Karten mit Modellantworten. Danach kannst du jede
                Karte in Ruhe durchgucken, bevor das Training losgeht.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NewDeckForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
