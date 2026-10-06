import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown02Icon,
  ArrowUp02Icon,
  Cancel01Icon,
  CubeIcon,
  GridViewIcon,
  MoreHorizontalIcon,
  Search01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

const icons = {
  search: Search01Icon,
  menu: MoreHorizontalIcon,
  up: ArrowUp02Icon,
  down: ArrowDown02Icon,
  spread: CubeIcon,
  table: GridViewIcon,
  done: Tick02Icon,
  close: Cancel01Icon,
};

// Keep the prototype's icon box, stroke weight and accessible button labels.
export function Icon({ name }: { name: keyof typeof icons }) {
  return <HugeiconsIcon icon={icons[name]} size={20} strokeWidth={2.2} aria-hidden="true" />;
}
