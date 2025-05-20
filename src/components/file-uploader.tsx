// src/components/file-uploader.tsx
"use client";

import { useRef, useState, DragEvent } from "react";

interface FileUploaderProps {
  endpoint: string;
  acceptedTypes?: string[];
  className?: string;
  /** Called when upload completes; receives whatever `/api/upload` returned */
  onUploadComplete?: (response: unknown) => void;
}

export function FileUploader({
  endpoint,
  acceptedTypes = [],
  className = "",
  onUploadComplete,
}: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(endpoint, { method: "POST", body: formData });
      const json: unknown = await res.json();
      onUploadComplete?.(json);
    } catch (err: unknown) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const [file] = Array.from(e.dataTransfer.files);
    if (!file) return;
    if (acceptedTypes.length && !acceptedTypes.includes(file.type)) {
      alert(`Please upload one of: ${acceptedTypes.join(", ")}`);
      return;
    }
    await uploadFile(file);
  };

  const onFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (acceptedTypes.length && !acceptedTypes.includes(file.type)) {
      alert(`Please upload one of: ${acceptedTypes.join(", ")}`);
      return;
    }
    await uploadFile(file);
  };

  return (
    <div>
      <div
        className={`${className} ${
          dragOver ? "border-blue-400 bg-blue-50" : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{ cursor: "pointer" }}
      >
        {uploading
          ? "Uploading..."
          : "Drag & drop a PDF here, or click to select"}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}
