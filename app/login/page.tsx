import Image from "next/image";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Anmelden · Mausi wird Ärztin",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  if (session) redirect(params.redirect ?? "/");

  return (
    <main className="flex-1 grid place-items-center px-4 sm:px-6 py-8 sm:py-10">
      <div className="w-full max-w-sm flex flex-col items-center gap-5 sm:gap-6">
        <Image
          src="/maus/doctor.png"
          alt="Mausi als Ärztin"
          width={400}
          height={600}
          priority
          className="w-32 sm:w-40 h-auto drop-shadow-md"
        />
        <Card className="w-full">
          <CardHeader className="space-y-1.5 text-center">
            <CardTitle className="text-2xl">Mausi wird Ärztin 🐭</CardTitle>
          </CardHeader>
          <CardContent>
            <LoginForm
              redirectTo={params.redirect ?? "/"}
              errorParam={params.error}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
