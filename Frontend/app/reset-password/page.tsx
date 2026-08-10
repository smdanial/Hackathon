import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password · CampusEase",
};

export default function ResetPasswordPage() {
  // The form reads ?uidb64&token from the emailed reset link via
  // useSearchParams, so it must sit inside a Suspense boundary for static
  // prerendering (see Next.js docs).
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
