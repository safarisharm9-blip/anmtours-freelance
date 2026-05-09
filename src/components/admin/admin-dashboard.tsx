"use client";

import { useState } from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/navigation";
import { Users, Package, ChevronDown, Pencil, Trash2, Calendar, MessageSquare, Home } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminBookings } from "./admin-bookings";
import { AdminReviews } from "./admin-reviews";
import { AdminHomepageSettings } from "./admin-homepage-settings";

type User = {
  id: string;
  clerkId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  role: string;
  createdAt: Date;
};

type Service = {
  id: string;
  slug: string;
  priceAdult: number;
  priceKids: number;
  duration: string | null;
  location: string | null;
  isActive: boolean;
  title: string;
};

type Booking = {
  id: string;
  date: Date;
  adults: number;
  children: number;
  total: number;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    imageUrl?: string | null;
    role: string;
  };
  service: {
    id: string;
    slug: string;
    details: unknown;
  } | null;
  serviceTitle: string;
};

type AdminDashboardProps = {
  users: User[];
  services: Service[];
  bookings: Booking[];
  reviews: Array<{
    id: string;
    authorName: string;
    authorImage: string | null;
    rating: number;
    text: string;
    images: string[];
    addedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

export function AdminDashboard({
  users,
  services,
  bookings,
  reviews,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"users" | "services" | "bookings" | "reviews" | "homepage">("users");
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (serviceId: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(serviceId);
    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete");
      }
    } catch {
      alert("Failed to delete service");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="min-w-[200px] justify-between">
            {activeTab === "users" ? (
              <>
                <Users className="size-4 mr-2" />
                Users ({users.length})
              </>
            ) : activeTab === "services" ? (
              <>
                <Package className="size-4 mr-2" />
                Services ({services.length})
              </>
            ) : activeTab === "bookings" ? (
              <>
                <Calendar className="size-4 mr-2" />
                Bookings ({bookings.length})
              </>
            ) : activeTab === "homepage" ? (
              <>
                <Home className="size-4 mr-2" />
                Homepage
              </>
            ) : (
              <>
                <MessageSquare className="size-4 mr-2" />
                Reviews ({reviews.length})
              </>
            )}
            <ChevronDown className="size-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[200px]">
          <DropdownMenuItem onClick={() => setActiveTab("users")}>
            <Users className="size-4 mr-2" />
            Users ({users.length})
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTab("services")}>
            <Package className="size-4 mr-2" />
            Services ({services.length})
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTab("bookings")}>
            <Calendar className="size-4 mr-2" />
            Bookings ({bookings.length})
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTab("homepage")}>
            <Home className="size-4 mr-2" />
            Homepage
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTab("reviews")}>
            <MessageSquare className="size-4 mr-2" />
            Reviews ({reviews.length})
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Users table */}
      {activeTab === "users" && (
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Role</th>
                    <th className="text-left py-3 px-4">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {user.imageUrl ? (
                            <Image
                              src={user.imageUrl}
                              alt=""
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                              {(user.firstName?.[0] ?? user.email?.[0] ?? "?")}
                            </div>
                          )}
                          <span>
                            {user.firstName || user.lastName
                              ? [user.firstName, user.lastName].filter(Boolean).join(" ")
                              : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {user.email ?? "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={
                            user.role === "ADMIN"
                              ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                              : "text-muted-foreground"
                          }
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services table */}
      {activeTab === "services" && (
        <Card>
          <CardHeader>
            <CardTitle>All Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Service</th>
                    <th className="text-left py-3 px-4">Price</th>
                    <th className="text-left py-3 px-4">Duration</th>
                    <th className="text-left py-3 px-4">Location</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id} className="border-b last:border-0">
                      <td className="py-3 px-4 font-medium">{service.title}</td>
                      <td className="py-3 px-4">
                        ${service.priceAdult}
                        {service.priceKids > 0 && (
                          <span className="text-muted-foreground text-xs ml-1">
                            / ${service.priceKids} kids
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {service.duration ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {service.location ?? "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={
                            service.isActive
                              ? "text-green-600"
                              : "text-muted-foreground"
                          }
                        >
                          {service.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/services/${service.slug}`}
                            className="text-primary hover:underline text-sm"
                          >
                            View
                          </Link>
                          <Link
                            href={`/admin/services/${service.id}/edit`}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(service.id, service.title)}
                            disabled={deletingId === service.id}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookings table */}
      {activeTab === "bookings" && (
        <AdminBookings bookings={bookings} />
      )}

      {/* Reviews tab */}
      {activeTab === "reviews" && (
        <AdminReviews initialReviews={reviews} />
      )}

      {activeTab === "homepage" && <AdminHomepageSettings />}
    </div>
  );
}
