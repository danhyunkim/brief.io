// src/app/upload/UploadPageContent.tsx
"use client";

import { FileUploader } from "@/components/file-uploader";

export default function UploadPageContent() {
  return (
    <main className="max-w-xl mx-auto py-16">
      <h1 className="text-2xl font-semibold mb-4">Upload a Contract</h1>
      <FileUploader
        endpoint="/api/upload"
        acceptedTypes={["application/pdf"]}
        className="border-2 border-dashed rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
      />
    </main>
  );
}
