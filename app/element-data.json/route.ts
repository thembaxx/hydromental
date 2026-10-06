import { elements } from "@/lib/elements";
import { getScience, scienceMetadata } from "@/lib/science";
export const dynamic = "force-static";
export function GET() {
  return Response.json({
    name: "Elementals",
    metadata: scienceMetadata,
    model:
      "Illustrative electron shells; neutral-atom configurations are predicted where explicitly noted.",
    elements: elements.map((element) => ({ ...element, science: getScience(element.z) })),
  });
}
