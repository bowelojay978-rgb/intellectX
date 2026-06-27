import { Badge } from "@/components/ui/badge";
import { convexEnv } from "@/lib/education-data";

export function DataSourceBadge() {
  return (
    <Badge variant="secondary" className="w-fit uppercase">
      {convexEnv.isConfigured ? "Convex data" : "Fallback data"}
    </Badge>
  );
}
