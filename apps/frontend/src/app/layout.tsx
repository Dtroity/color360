import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import Header from "@/widgets/Header";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "./(main)/providers";
import { Analytics } from "@/components/Analytics";
import { RecaptchaProvider } from "@/components/RecaptchaProvider";
import { CookieConsent } from "@/components/CookieConsent";

const inter = Inter({
	subsets: ["latin", "cyrillic"],
	variable: "--font-inter",
});

const montserrat = Montserrat({
	subsets: ["latin", "cyrillic"],
	variable: "--font-montserrat",
	weight: ["600", "700"],
});

export const metadata: Metadata = {
	title: "Video Shop | Современные системы видеонаблюдения",
	description:
		"Каталог профессиональных решений для видеонаблюдения с доставкой по всей России.",
};

export default function RootLayout({
	children,
}: Readonly<{ children: ReactNode }>) {
	return (
		<html lang="ru" className={`${inter.variable} ${montserrat.variable}`}>
			<body className="font-sans antialiased bg-neutral-50 text-neutral-900">
				<RecaptchaProvider>
					<Providers>
						<Analytics />
						<Header />
						<main className="min-h-screen">{children}</main>
						<Footer />
						<CookieConsent />
					</Providers>
				</RecaptchaProvider>
			</body>
		</html>
	);
}
