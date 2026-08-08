"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ImagePlus,
  MapPin,
  PackagePlus,
  Phone,
  User,
  X,
} from "lucide-react";
import { CATEGORIES, type ItemCategory, type NewFoundItem } from "./dummyData";

interface FoundItemFormProps {
  /** Called with the filled-in entry so the explorer can add it to the list. */
  onPost: (entry: NewFoundItem) => void;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink shadow-sm outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/30";

const labelClass = "text-sm font-semibold text-slate-700";

/**
 * Found tab: report something you found. Fully client-side — the photo
 * becomes a local blob URL for a live preview, and the entry is handed to
 * the parent's in-memory list (no persistence across reloads).
 */
export default function FoundItemForm({ onPost }: FoundItemFormProps) {
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState<ItemCategory>("Electronics");
  const [description, setDescription] = useState("");
  const [locationFound, setLocationFound] = useState("");
  const [finderName, setFinderName] = useState("");
  const [finderPhone, setFinderPhone] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [justPosted, setJustPosted] = useState(false);

  const objectUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hideTimerRef = useRef<number | null>(null);

  // Revoke the blob URL and clear the pending success timer on unmount.
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPreviewUrl(url);
  };

  const clearImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPreviewUrl(null);
    // Reset the input so picking the same file again re-triggers onChange.
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setItemName("");
    setCategory("Electronics");
    setDescription("");
    setLocationFound("");
    setFinderName("");
    setFinderPhone("");
    clearImage();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Ownership of the blob URL moves to the parent (it's now rendered by
    // the Lost tab cards), so clear the ref BEFORE reset so clearImage() and
    // this form's unmount cleanup don't revoke it out from under the cards.
    objectUrlRef.current = null;
    onPost({
      itemName: itemName.trim(),
      category,
      description: description.trim(),
      locationFound: locationFound.trim(),
      imageUrl: previewUrl ?? "",
      finderName: finderName.trim(),
      finderPhone: finderPhone.trim(),
    });

    resetForm();
    setJustPosted(true);
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = window.setTimeout(() => setJustPosted(false), 4000);
  };

  return (
    <section id="report-found" className="mx-auto w-full max-w-2xl scroll-mt-20">
      <div className="overflow-hidden rounded-3xl bg-card shadow-soft">
        {/* Success confirmation */}
        {justPosted ? (
          <div
            role="status"
            className="flex items-center gap-3 border-b border-success/30 bg-success-light px-5 py-4 sm:px-6"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
            <p className="text-sm font-semibold text-success">
              Item posted! It now shows up in the Lost tab.
            </p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-dark shadow-card">
              <PackagePlus className="h-6 w-6" />
            </span>
            <div>
              <h2 className="font-heading text-xl font-semibold text-ink">
                Report a found item
              </h2>
              <p className="mt-0.5 text-sm text-slate-700">
                Fill this in and it appears on the Lost tab immediately.
              </p>
            </div>
          </div>

          {/* Item name + category */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="item-name" className={labelClass}>
                Item Name
              </label>
              <input
                id="item-name"
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Water bottle, keys"
                required
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="item-category" className={labelClass}>
                Category
              </label>
              <select
                id="item-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className={inputClass}
              >
                {CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="item-description" className={labelClass}>
              Description
            </label>
            <textarea
              id="item-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the item so its owner can recognize it…"
              rows={3}
              required
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Where found */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="item-location" className={labelClass}>
              Where did you find it?
            </label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="item-location"
                type="text"
                value={locationFound}
                onChange={(e) => setLocationFound(e.target.value)}
                placeholder="e.g. Library, Canteen"
                required
                className={`${inputClass} pl-11`}
              />
            </div>
          </div>

          {/* Finder name + phone */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="finder-name" className={labelClass}>
                Your Name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="finder-name"
                  type="text"
                  value={finderName}
                  onChange={(e) => setFinderName(e.target.value)}
                  placeholder="e.g. Lubna Rahman"
                  required
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="finder-phone" className={labelClass}>
                Your Phone Number
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="finder-phone"
                  type="tel"
                  inputMode="tel"
                  value={finderPhone}
                  onChange={(e) => setFinderPhone(e.target.value)}
                  placeholder="e.g. 01XXX-XXXXXX"
                  required
                  pattern="[0-9+ -]{7,}"
                  title="Please enter a valid phone number"
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>
          </div>

          {/* Photo upload + live preview */}
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Photo</span>
            {previewUrl ? (
              <div className="relative overflow-hidden rounded-2xl bg-white shadow-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Selected item preview"
                  className="aspect-[4/3] w-full object-cover"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  aria-label="Remove selected photo"
                  className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/60 text-white shadow-sm backdrop-blur-sm transition-colors duration-200 hover:bg-slate-900/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="item-photo"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/50 bg-white/70 px-4 py-8 text-center transition-all duration-200 hover:border-primary hover:bg-white"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary-dark shadow-card">
                  <ImagePlus className="h-6 w-6" />
                </span>
                <span className="text-sm font-semibold text-ink">Upload a photo</span>
                <span className="text-xs text-slate-600">
                  Optional — a live preview shows as soon as you pick a file
                </span>
              </label>
            )}
            <input
              ref={fileInputRef}
              id="item-photo"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="sr-only"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-ink shadow-soft transition-all duration-200 hover:bg-primary-dark hover:text-white hover:shadow-lift active:scale-[0.98] sm:text-base"
          >
            <PackagePlus className="h-4 w-4 sm:h-5 sm:w-5" />
            Post Found Item
          </button>
        </form>
      </div>
    </section>
  );
}
