"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UploadDropzone } from "@/lib/uploadthing";
import { updateHeroImageSettings } from "@/app/actions/settings";
import Image from "next/image";
import { X, Upload } from "lucide-react";

type SettingsResponse = {
  heroImageUrl: string;
  heroImageLabel: string;
};

export function AdminHomepageSettings() {
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroImageLabel, setHeroImageLabel] = useState("Hero background");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/admin/settings/hero-image");
        if (!res.ok) {
          throw new Error("Failed to load homepage settings");
        }
        const data: SettingsResponse = await res.json();
        if (cancelled) return;
        setHeroImageUrl(data.heroImageUrl ?? "");
        setHeroImageLabel(data.heroImageLabel || "Hero background");
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSave = async () => {
    setSaving(true);
    try {
      const res = await updateHeroImageSettings({
        heroImageUrl,
        heroImageLabel,
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to save settings");
      }

      alert("Homepage settings updated successfully");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Homepage Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        ) : (
          <>
            <div className="space-y-4">
              <Label>Hero Background Image</Label>
              
              {heroImageUrl ? (
                <div className="relative w-full max-w-2xl group">
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted">
                    <Image
                      src={heroImageUrl}
                      alt="Hero background preview"
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 size-8 rounded-full shadow-lg"
                    onClick={() => setHeroImageUrl("")}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-1">
                   <UploadDropzone
                    endpoint="serviceImage"
                    onClientUploadComplete={(res) => {
                      if (res?.[0]?.url) {
                        setHeroImageUrl(res[0].url);
                      }
                    }}
                    onUploadError={(error) => {
                      alert(`Upload failed: ${error.message}`);
                    }}
                    appearance={{
                      container: "min-h-[200px] border-none bg-background/50 hover:bg-muted/30 transition-colors",
                      label: "text-primary hover:text-primary/80",
                      allowedContent: "text-muted-foreground text-xs",
                      button: "bg-primary hover:bg-primary/90",
                    }}
                  />
                </div>
              )}
              
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Upload className="size-3" />
                Upload a high-quality wide image (recommended 1920x1080).
              </p>
            </div>

            <div className="space-y-2">
              <Label>Image Alt Label</Label>
              <Input
                value={heroImageLabel}
                onChange={(e) => setHeroImageLabel(e.target.value)}
                placeholder="e.g. Beautiful mountain view"
                disabled={saving}
              />
            </div>

            <Button type="button" onClick={onSave} disabled={saving || !heroImageUrl} className="w-full sm:w-auto">
              {saving ? "Saving Changes..." : "Save Homepage Settings"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

