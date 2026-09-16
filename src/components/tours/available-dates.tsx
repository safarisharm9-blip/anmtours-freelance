"use client";

import React, { useState } from "react";
import { Calendar, MapPin, Clock, Users, Droplets, TrendingUp } from "lucide-react";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TourDate {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  maxSpots: number;
  bookedSpots: number;
  status: "AVAILABLE" | "FULL" | "CANCELLED";
  weather?: string;
  temperature?: number;
  rating?: number;
}

interface AvailableDatesProps {
  tourDates: TourDate[];
  onSelectDate: (date: TourDate) => void;
  selectedDate?: TourDate | null;
}

export function AvailableDates({ tourDates, onSelectDate, selectedDate }: AvailableDatesProps) {
  const [scrollPosition, setScrollPosition] = useState(0);

  const availableSpots = (date: TourDate) => {
    return date.maxSpots - date.bookedSpots;
  };

  const getStatusColor = (status: string, spots: number) => {
    if (status === "CANCELLED") return "text-red-600 bg-red-50";
    if (status === "FULL") return "text-orange-600 bg-orange-50";
    if (spots <= 2) return "text-red-600 bg-red-50";
    return "text-green-600 bg-green-50";
  };

  const getStatusText = (status: string, spots: number) => {
    if (status === "CANCELLED") return "Cancelled";
    if (status === "FULL") return "FULL";
    if (spots === 0) return "FULL";
    if (spots === 1) return "1 spot left";
    return `${spots} spots`;
  };

  return (
    <div className="w-full">
      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .date-card {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>

      {/* Header */}
      <div className="mb-6">
        <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Calendar className="w-6 h-6 text-blue-600" />
          SELECT YOUR DATE
        </h3>
        <p className="text-sm text-gray-500 mt-1">Choose an available date for your tour</p>
      </div>

      {/* Navigation Arrows + Cards Container */}
      <div className="flex items-center gap-3">
        {/* Left Arrow */}
        <button
          onClick={() => {
            const container = document.getElementById("dates-scroll-container");
            if (container) {
              container.scrollBy({ left: -300, behavior: "smooth" });
            }
          }}
          className="flex-shrink-0 p-2 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Previous dates"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Dates Container */}
        <div
          id="dates-scroll-container"
          className="flex gap-3 overflow-x-auto pb-2 flex-1 scroll-smooth"
          style={{ scrollBehavior: "smooth" }}
        >
          {tourDates.map((date) => {
            const dateObj = new Date(date.date);
            const spots = availableSpots(date);
            const dayName = format(dateObj, "EEEE");
            const dayNum = format(dateObj, "dd");
            const monthYear = format(dateObj, "MMM yyyy");
            const isSelected = selectedDate?.id === date.id;

            return (
              <div
                key={date.id}
                className={cn(
                  "date-card flex-shrink-0 w-48 rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg",
                  isSelected
                    ? "border-blue-500 bg-blue-50 shadow-lg"
                    : "border-gray-200 bg-white hover:border-blue-300"
                )}
                onClick={() => onSelectDate(date)}
              >
                {/* Date Header */}
                <div
                  className={cn(
                    "p-4 text-center",
                    isSelected ? "bg-blue-600 text-white" : "bg-gradient-to-r from-blue-50 to-blue-100"
                  )}
                >
                  <div className="text-sm font-semibold opacity-90">{dayName}</div>
                  <div className={cn("text-2xl font-bold", isSelected ? "text-white" : "text-gray-900")}>
                    {dayNum}
                  </div>
                  <div className="text-xs opacity-75">{monthYear}</div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Time */}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 font-medium">
                      {date.startTime} - {date.endTime}
                    </span>
                  </div>

                  {/* Availability */}
                  <div
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-semibold text-center",
                      getStatusColor(date.status, spots)
                    )}
                  >
                    {date.status === "CANCELLED" ? (
                      <span>❌ {getStatusText(date.status, spots)}</span>
                    ) : (
                      <span>✓ {getStatusText(date.status, spots)}</span>
                    )}
                  </div>

                  {/* Weather & Rating */}
                  {(date.weather || date.temperature || date.rating) && (
                    <div className="space-y-2 pt-2 border-t border-gray-200">
                      {date.weather && (
                        <div className="flex items-center gap-2 text-xs">
                          <Droplets className="w-3 h-3 text-blue-500" />
                          <span className="text-gray-600">{date.weather}</span>
                        </div>
                      )}
                      {date.temperature && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-600">🌡️ {date.temperature}°C</span>
                        </div>
                      )}
                      {date.rating && (
                        <div className="flex items-center gap-2 text-xs">
                          <TrendingUp className="w-3 h-3 text-yellow-500" />
                          <span className="text-gray-600">{date.rating}/5 from past tours</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Select Button */}
                  <Button
                    onClick={() => onSelectDate(date)}
                    disabled={date.status === "FULL" || date.status === "CANCELLED"}
                    className={cn(
                      "w-full mt-3 font-semibold",
                      isSelected
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-100 hover:bg-blue-500 hover:text-white text-gray-700"
                    )}
                  >
                    {date.status === "FULL"
                      ? "FULL"
                      : date.status === "CANCELLED"
                        ? "CANCELLED"
                        : isSelected
                          ? "✓ Selected"
                          : "Select"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => {
            const container = document.getElementById("dates-scroll-container");
            if (container) {
              container.scrollBy({ left: 300, behavior: "smooth" });
            }
          }}
          className="flex-shrink-0 p-2 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Next dates"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-gray-700">Selected Date:</p>
              <p className="text-lg font-bold text-blue-600">
                {format(new Date(selectedDate.date), "EEEE, MMMM dd, yyyy")} • {selectedDate.startTime} - {selectedDate.endTime}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {availableSpots(selectedDate)} spot{availableSpots(selectedDate) !== 1 ? "s" : ""} available
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
