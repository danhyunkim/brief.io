// src/app/upload/page.tsx
"use client";

import { RequireAuth } from "@/components/RequireAuth";
import UploadPageContent from "./UploadPageContent";


export default function UploadPage() {
  return (
    <RequireAuth>
      <UploadPageContent />
    </RequireAuth>
  );
}
