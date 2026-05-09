"use client";

import { useState } from "react";
import Image from "next/image";
import { Trash2, Plus, Star, Upload, X, ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UploadDropzone } from "@/lib/uploadthing";
import { createReview, deleteReview } from "@/app/actions/reviews";

type Review = {
  id: string;
  authorName: string;
  authorImage: string | null;
  rating: number;
  text: string;
  images: string[];
  addedAt: Date;
  createdAt: Date;
};

export function AdminReviews({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [brokenAuthorImages, setBrokenAuthorImages] = useState<Record<string, boolean>>({});

  // Form state
  const [authorName, setAuthorName] = useState("");
  const [authorImage, setAuthorImage] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [addedAt, setAddedAt] = useState(() => new Date().toISOString().split('T')[0]); // YYYY-MM-DD

  const handleAddReview = async () => {
    if (!authorName || !text) {
      alert("Name and text are required");
      return;
    }
    setLoading(true);
    const res = await createReview({
      authorName,
      authorImage: authorImage || undefined,
      rating,
      text,
      images,
      addedAt: new Date(addedAt),
    });
    if (res.success && res.review) {
      setReviews([res.review, ...reviews]);
      setIsAdding(false);
      setAuthorName("");
      setAuthorImage("");
      setRating(5);
      setText("");
      setImages([]);
      setAddedAt(new Date().toISOString().split('T')[0]);
    } else {
      alert(res.error || "Failed to add review");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    const res = await deleteReview(id);
    if (res.success) {
      setReviews(reviews.filter((r) => r.id !== id));
    } else {
      alert(res.error || "Failed to delete review");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Reviews</CardTitle>
        <Button onClick={() => setIsAdding(!isAdding)} variant="outline">
          <Plus className="size-4 mr-2" />
          Add Review
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {isAdding && (
          <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
            <h3 className="font-medium">New Review</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Author Name</label>
                <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="e.g. John Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Author Avatar URL (optional)</label>
                <Input value={authorImage} onChange={(e) => setAuthorImage(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rating (1-5)</label>
                <Input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Added</label>
                <Input type="date" value={addedAt} onChange={(e) => setAddedAt(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Review Text</label>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write the review..." rows={4} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Review Photos</label>
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 mb-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative group overflow-hidden rounded-xl border bg-card">
                      <div className="relative h-28 w-full">
                        <Image
                          src={img}
                          alt={`Uploaded preview ${i + 1}`}
                          fill
                          className="object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-black/45 px-2 py-1 text-[11px] text-white backdrop-blur-sm">
                        Image {i + 1}
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                        className="absolute right-2 top-2 size-7 rounded-full bg-black/70 text-white hover:bg-black/85"
                      >
                        <X className="size-3.5" />
                        <span className="sr-only">Remove image</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="rounded-xl border bg-linear-to-b from-background to-muted/30 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Upload className="size-3.5" />
                  <span>Upload up to 10 images (max 20MB each)</span>
                </div>
                <UploadDropzone
                  endpoint="serviceImage"
                  onClientUploadComplete={(res) => {
                    if (res) {
                      setImages([...images, ...res.map((r) => r.url)]);
                    }
                  }}
                  onUploadError={(error) => {
                    alert(`Upload failed! ${error.message}`);
                  }}
                  appearance={{
                    container: "min-h-[170px] border-dashed border-2 border-primary/30 bg-background/80 rounded-lg",
                    label: "text-primary font-medium hover:text-primary/80",
                    allowedContent: "text-muted-foreground",
                    button:
                      "h-10 px-5 rounded-md border border-primary/30 !bg-primary !text-primary-foreground text-sm font-semibold shadow-sm transition-colors hover:!bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  }}
                />
              </div>
              {images.length === 0 && (
                <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                  <ImageIcon className="size-3.5" />
                  Uploaded images will appear here after upload.
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleAddReview} disabled={loading}>{loading ? "Saving..." : "Save Review"}</Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">No reviews found.</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="p-4 border rounded-lg flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  {review.authorImage && !brokenAuthorImages[review.id] ? (
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-full ring-2 ring-background shadow-sm">
                      <Image
                        src={review.authorImage}
                        alt={review.authorName}
                        fill
                        sizes="48px"
                        className="object-cover"
                        onError={() =>
                          setBrokenAuthorImages((current) => ({
                            ...current,
                            [review.id]: true,
                          }))
                        }
                      />
                    </div>
                  ) : (
                    <div className="size-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary ring-2 ring-background shadow-sm">
                      {review.authorName[0]}
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      {review.authorName}
                      <span className="flex items-center text-yellow-500 text-sm">
                        {review.rating} <Star className="size-3 fill-current ml-1" />
                      </span>
                    </h4>
                    <p className="text-xs text-muted-foreground">{new Date(review.addedAt || review.createdAt).toLocaleDateString()}</p>
                    <p className="mt-2 text-sm">{review.text}</p>
                    {review.images.length > 0 && (
                      <div className="mt-3">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                          {review.images.length} photo{review.images.length > 1 ? "s" : ""}
                        </p>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                        {review.images.map((img, i) => (
                          <div key={i} className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md border bg-card">
                            <Image
                              src={img}
                              alt={`Review pic ${i + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(review.id)} className="text-destructive hover:bg-destructive/10 shrink-0">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
