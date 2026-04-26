import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import AuthProvider from "@/components/providers/AuthProvider";
import ThemeProvider from "@/components/providers/ThemeProvider";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "PyWeb Academy - Cursuri IT și Programare pentru Copii",
    template: "%s | PyWeb Academy"
  },
  description: "PyWeb Academy oferă cursuri de calculator, IT și inteligență artificială pentru copii și adolescenți în Chișinău. Grupe mici, profesori cu experiență, primul curs gratuit.",
  keywords: [
    // Ce caută părinții — termeni generali cu volum mare
    "cursuri calculator copii Chișinău",
    "cursuri IT copii",
    "cursuri informatică copii",
    "cursuri calculator copii",
    "after school IT Chișinău",
    "cursuri programare copii Chișinău",
    "cursuri inteligenta artificiala copii",
    "cursuri AI copii",
    "scoala IT copii Moldova",
    "after school calculator Moldova",
    "cursuri tehnice copii",
    "activitati extracurriculare IT copii",
    "cursuri digitale copii",
    "educatie digitala copii",
    "PyWeb Academy",
    "cursuri dupa scoala Chisinau"
  ],
  authors: [{ name: "PyWeb Academy" }],
  creator: "PyWeb Academy",
  publisher: "PyWeb Academy",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://pyweb.online"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PyWeb Academy - Cursuri IT și Programare pentru Copii",
    description: "Cursuri de calculator, IT și inteligență artificială pentru copii și adolescenți în Chișinău. Grupe mici, profesori calificați, primul curs gratuit.",
    url: "https://pyweb.online",
    siteName: "PyWeb Academy",
    locale: "ro_RO",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PyWeb Academy - Cursuri IT pentru copii",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PyWeb Academy - Cursuri IT și Programare pentru Copii",
    description: "Cursuri de calculator, IT și inteligență artificială pentru copii în Chișinău. Primul curs gratuit!",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico',    sizes: 'any' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon.png',    sizes: '64x64',  type: 'image/png' },
      { url: '/icon-192.png',   sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png',   sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/favicon.png' },
    ],
  },
  manifest: '/manifest.json',
  verification: {
    // google: "your-google-verification-code",
  },
  category: "education",
};

// Script to apply theme before page renders to prevent flash
const themeScript = `
  (function() {
    try {
      const theme = localStorage.getItem('theme');
      if (theme === 'light') {
        document.documentElement.classList.add('light');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} antialiased`}
      >
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
