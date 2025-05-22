// src/app/page.tsx
import { redirect } from "next/navigation";

export default function HomePage() {
  // Immediately send visitors to the Upload flow
  redirect("/upload");
}
