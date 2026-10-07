"use client";

import { useRouter } from "next/navigation";
import { Onboarding } from "@/components/onboarding";
import { finishOnboarding } from "@/lib/onboarding";

export function WelcomePage() {
  const router = useRouter();
  return (
    <Onboarding
      onComplete={() => {
        finishOnboarding();
        router.replace("/");
      }}
    />
  );
}
