import "./globals.css";

export const metadata = {
  title: "Northstar HR",
  description: "A minimal HR portal for attendance, salary, leave and more.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
