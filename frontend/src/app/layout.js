import { Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";

const headingFont = Fraunces({
  variable: "--font-heading",
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700"],
});

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700"],
});

export const metadata = {
  metadataBase: new URL("https://example.netlify.app"),
  title: {
    default: "Gettsay",
    template: "%s | Gettsay",
  },
  description: "Gian hàng mẫu xây bằng Next.js, Netlify và MySQL đặt ngoài Netlify.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>{children}</body>
    </html>
  );
}
