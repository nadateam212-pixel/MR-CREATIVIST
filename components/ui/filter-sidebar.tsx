import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FilterSidebar({ filters }: { filters: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Badge key={filter}>{filter}</Badge>
        ))}
      </CardContent>
    </Card>
  );
}
