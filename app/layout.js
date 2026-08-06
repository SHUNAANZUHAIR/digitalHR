import "./globals.css";
import { ORG_NAME, ORG_ADDRESS, ORG_LOGO_PATH } from "@/lib/branding";

export const metadata = {
  title: ORG_NAME,
  description: `HR portal for the ${ORG_NAME}, ${ORG_ADDRESS}.`,
  icons: { icon: ORG_LOGO_PATH },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
