import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PriceDisplay } from "@/components/ui/price-display";

export function ProductCard({ product }: { product: { name: string; slug: string; type: string; price: string; image: string } }) {
  return (
    <Link href={`/marketplace/product/${product.slug}`}>
      <Card className="h-full overflow-hidden transition-transform hover:-translate-y-1">
        <div className="relative aspect-video">
          <Image src={product.image} alt={product.name} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
        </div>
        <CardContent className="space-y-3 p-4">
          <Badge>{product.type}</Badge>
          <h3 className="line-clamp-2 min-h-14 text-lg font-semibold leading-7">{product.name}</h3>
          <PriceDisplay price={product.price} />
        </CardContent>
      </Card>
    </Link>
  );
}
