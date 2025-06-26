import { getRequestConfig } from "next-intl/server";
import { getLocaleAction } from "./get-locale";

// Import all messages statically to avoid dynamic import issues
import enMessages from "../../messages/en.json";
import koMessages from "../../messages/ko.json";
import esMessages from "../../messages/es.json";
import frMessages from "../../messages/fr.json";
import jaMessages from "../../messages/ja.json";
import zhMessages from "../../messages/zh.json";
import hiMessages from "../../messages/hi.json";

const messages: Record<string, any> = {
  en: enMessages,
  ko: koMessages,
  es: esMessages,
  fr: frMessages,
  ja: jaMessages,
  zh: zhMessages,
  hi: hiMessages,
};

export default getRequestConfig(async () => {
  const locale = await getLocaleAction();

  return {
    locale,
    messages: messages[locale] || messages.en,
    getMessageFallback({ key, namespace }) {
      return `${namespace}.${key}`;
    },
  };
});
