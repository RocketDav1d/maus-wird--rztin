"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { error: string | null };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = process.env.SEED_USER_EMAIL;
  if (!email) {
    return { error: "Login ist nicht konfiguriert." };
  }
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");

  try {
    await signIn("credentials", { email, password, redirectTo });
    return { error: null };
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.type === "CredentialsSignin") {
        return { error: "Falsches Passwort." };
      }
      return { error: "Anmeldung fehlgeschlagen." };
    }
    throw err;
  }
}
