"use server";
import { cookies, headers } from "next/headers";
import { COOKIE_KEY_LOCALE, SUPPORTED_LOCALES } from "lib/const";

function validateLocale(locale?: string): boolean {
  return SUPPORTED_LOCALES.some((v) => v.code === locale);
}

async function getLocaleFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const locale = cookieStore.get(COOKIE_KEY_LOCALE)?.value;

  return validateLocale(locale) ? locale : undefined;
}

async function getLocalFromHeader(): Promise<string | undefined> {
  const headerStore = await headers();
  const locale = headerStore
    .get("accept-language")
    ?.split(",")[0]
    ?.trim()
    .split("-")[0];

  return validateLocale(locale) ? locale : undefined;
}

export async function getLocaleAction() {
  let locale: string | undefined;

  locale = await getLocaleFromCookie();
  if (!locale) {
    locale = await getLocalFromHeader();
  }

  return locale || SUPPORTED_LOCALES[0].code;
}

export async function setLocaleAction(locale: string) {
  if (!validateLocale(locale)) {
    throw new Error("Invalid locale");
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_KEY_LOCALE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
}
