import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function ConsultantCard({ consultant }: { consultant: { name: string; slug: string; title: string; rate: string; expertise: string[] } }) {
  return (
    <Link href={`/consulting/${consultant.slug}`}>
      <Card className="h-full transition-transform hover:-translate-y-1">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <Avatar name={consultant.name} />
            <div>
              <h3 className="font-semibold">{consultant.name}</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{consultant.title}</p>
            </div>
          </div>
          <p className="font-medium">{consultant.rate}</p>
          <div className="flex flex-wrap gap-2">
            {consultant.expertise.map((item) => (
              <Badge key={item}>{item}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
