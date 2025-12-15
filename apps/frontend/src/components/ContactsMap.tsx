"use client";
import { YMaps, Map, Placemark } from "@pbe/react-yandex-maps";
import React from "react";

interface ContactsMapProps {
  center: [number, number];
  zoom?: number;
  address: string;
  phone?: string;
  hours?: string;
}

export function ContactsMap({ center, zoom = 15, address, phone, hours }: ContactsMapProps) {
  const balloonContent = [
    `<strong>${address}</strong>`,
    phone ? `Телефон: <a href=\"tel:${phone}\">${phone}</a>` : "",
    hours ? `Часы работы: ${hours}` : "",
  ]
    .filter(Boolean)
    .join("<br/>");

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border border-neutral-200 bg-white">
      <YMaps>
        <Map
          defaultState={{ center, zoom }}
          modules={["control.ZoomControl", "control.GeolocationControl"]}
          className="w-full h-full"
        >
          <Placemark
            geometry={center}
            properties={{ balloonContent }}
            options={{ preset: "islands#redDotIcon" }}
          />
        </Map>
      </YMaps>
    </div>
  );
}
