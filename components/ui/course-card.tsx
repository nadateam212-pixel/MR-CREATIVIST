import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PriceDisplay } from "@/components/ui/price-display";
import { RatingStars } from "@/components/ui/rating-stars";
import { SafeImage } from "@/components/ui/safe-image";
import { courseImageForCategory } from "@/lib/course-media";

export function CourseCard({ course }: { course: { title: string; slug: string; level: string; category?: string; price: string; rating: number; image: string } }) {
  return (
    <Link href={`/courses/${course.slug}`}>
      <Card className="h-full overflow-hidden transition-transform hover:-translate-y-1">
        <div className="relative aspect-video">
          <SafeImage
            src={course.image}
            fallbackSrc={courseImageForCategory(course.category)}
            alt={course.title}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover"
          />
        </div>
        <CardContent className="space-y-3 p-4">
          <Badge>{course.level}</Badge>
          <h3 className="text-lg font-semibold">{course.title}</h3>
          <RatingStars value={course.rating} />
          <PriceDisplay price={course.price} />
        </CardContent>
      </Card>
    </Link>
  );
}
