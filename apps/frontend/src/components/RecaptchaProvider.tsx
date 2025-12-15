"use client";
import React, { PropsWithChildren } from "react";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";

const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

export function RecaptchaProvider({ children }: PropsWithChildren) {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={siteKey}
      scriptProps={{ async: true, defer: true }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}

export function useRecaptcha() {
  const { executeRecaptcha } = useGoogleReCaptcha();
  return async (action: string = "form_submit") => {
    if (!executeRecaptcha) return null;
    try {
      const token = await executeRecaptcha(action);
      return token;
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn("Recaptcha error", e);
      }
      return null;
    }
  };
}
