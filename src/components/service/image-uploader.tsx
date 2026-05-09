"use client";

import { useRef } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import Image from "next/image";

type ImageUploaderProps = {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
};

export function CoverImageUploader({ value, onChange, disabled }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { startUpload, isUploading } = useUploadThing("serviceImage", {
    onClientUploadComplete: (res) => {
      if (res?.[0]?.url) {
        onChange(res[0].url);
      }
    },
  });

  const handleClick = () => inputRef.current?.click();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) {
      startUpload(Array.from(files));
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      {value ? (
        <div className="relative inline-block">
          <div className="relative h-48 w-64 overflow-hidden rounded-lg border">
            <Image
              src={value}
              alt="Cover"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -right-2 -top-2 size-8"
              onClick={() => onChange("")}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          disabled={isUploading || disabled}
        >
          {isUploading ? "Uploading..." : "Upload Cover Image"}
        </Button>
      )}
    </div>
  );
}

type GalleryUploaderProps = {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
};

export function GalleryImageUploader({ value, onChange, disabled }: GalleryUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { startUpload, isUploading } = useUploadThing("serviceImage", {
    onClientUploadComplete: (res) => {
      if (res?.length) {
        const urls = res.map((f) => f.url).filter(Boolean);
        onChange([...value, ...urls]);
      }
    },
  });

  const handleClick = () => inputRef.current?.click();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) {
      startUpload(Array.from(files));
    }
    e.target.value = "";
  };
  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex flex-wrap gap-2">
        {value.map((url, index) => (
          <div key={url} className="relative">
            <div className="relative h-24 w-24 overflow-hidden rounded-lg border">
              <Image
                src={url}
                alt={`Gallery ${index + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -right-1 -top-1 size-6"
                onClick={() => removeImage(index)}
              >
                <X className="size-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isUploading || disabled}
      >
        {isUploading ? "Uploading..." : "Add Images"}
      </Button>
    </div>
  );
}
