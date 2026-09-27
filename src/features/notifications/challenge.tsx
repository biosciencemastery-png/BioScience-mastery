"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
type Turnstile = {
  render: (node: HTMLElement, options: Record<string, string>) => string;
  remove: (id: string) => void;
  reset: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}
export function Challenge({
  siteKey,
  locale,
  revision,
}: {
  siteKey: string;
  locale: string;
  revision: unknown;
}) {
  const node = useRef<HTMLDivElement>(null),
    id = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!ready || !node.current || !window.turnstile) return;
    id.current = window.turnstile.render(node.current, {
      sitekey: siteKey,
      action: "launch-notification",
      language: locale,
      size: "flexible",
    });
    return () => {
      if (id.current) window.turnstile?.remove(id.current);
      id.current = null;
    };
  }, [ready, siteKey, locale]);
  useEffect(() => {
    if (id.current) window.turnstile?.reset(id.current);
  }, [revision]);
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={() => setReady(true)}
      />
      <div ref={node} />
    </>
  );
}
