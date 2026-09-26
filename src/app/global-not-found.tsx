import Link from "next/link";
import "./globals.css";
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <main className="error-page" id="main">
          <span className="eyebrow">404</span>
          <h1>A path yet to be discovered.</h1>
          <p>
            This page does not exist. Let’s get you back to familiar ground.
          </p>
          <Link className="button" href="/en">
            Back to homepage
          </Link>
          <Link className="text-link" href="/hi" lang="hi">
            हिंदी मुखपृष्ठ
          </Link>
        </main>
      </body>
    </html>
  );
}
