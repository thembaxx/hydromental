import type { Metadata } from "next";
import { PhysicsLab } from "@/components/physics-lab";

export const metadata: Metadata = {
  title: "Physics lab · Elementals",
  description:
    "Explore vertical projectile motion, vector components and Newton’s second law with interactive 3D simulations and worked SI-unit calculations for CAPS/NSC physical sciences.",
  alternates: { canonical: "/physics" },
};

export default function Page() {
  return <PhysicsLab />;
}
