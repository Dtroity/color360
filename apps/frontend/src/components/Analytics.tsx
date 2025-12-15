"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import ReactGA from "react-ga4";

const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
let initialized = false;

export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!initialized && MEASUREMENT_ID) {
      ReactGA.initialize(MEASUREMENT_ID);
      initialized = true;
    }
    if (initialized) {
      // Отправка pageview для текущего пути
      ReactGA.send({ hitType: "pageview", page: pathname });
    }
  }, [pathname]);

  return null;
}
