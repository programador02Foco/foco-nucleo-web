"use client";

import { useEffect, useRef } from "react";

type Recaptcha = {
  ready: (callback: () => void) => void;
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
    },
  ) => void;
};

declare global {
  interface Window {
    grecaptcha?: Recaptcha;
  }
}

export function noComputadorLocal() {
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

export default function NaoSouRobo({
  siteKey,
  onToken,
}: {
  siteKey: string;
  onToken: (token: string) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const aviso = useRef(onToken);
  aviso.current = onToken;

  useEffect(() => {
    const alvo = box.current;
    if (!siteKey || !alvo) return;
    let cancelado = false;

    const desenhar = () => {
      if (cancelado || !alvo || !window.grecaptcha || alvo.childElementCount > 0) return;
      window.grecaptcha.render(alvo, {
        sitekey: siteKey,
        callback: (token) => aviso.current(token),
        "expired-callback": () => aviso.current(""),
      });
    };

    if (window.grecaptcha) {
      window.grecaptcha.ready(desenhar);
      return () => {
        cancelado = true;
      };
    }

    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?render=explicit&hl=pt-BR";
    script.async = true;
    script.onload = () => window.grecaptcha?.ready(desenhar);
    document.body.appendChild(script);
    return () => {
      cancelado = true;
    };
  }, [siteKey]);

  return <div ref={box} style={{ display: "flex", justifyContent: "center", marginBottom: 16 }} />;
}
