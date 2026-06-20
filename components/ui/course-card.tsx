import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SafeImage } from "@/components/ui/safe-image";
import { VerifiedMark } from "@/components/ui/verified-mark";
import { accessBadgeClass, accessLabel, courseAccessType } from "@/lib/access-styles";
import { courseImageForCategory } from "@/lib/course-media";

export function CourseCard({
  course
}: {
  course: {
    title: string;
    slug: string;
    level: string;
    category?: string;
    price: string;
    rating: number;
    image: string;
    duration?: string;
    instructor?: string;
    instructorVerified?: boolean;
    accessType?: string;
    pricingType?: string;
  };
}) {
  const accessType = courseAccessType(course);

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
          {course.duration ? (
            <span className="absolute bottom-2 right-2 rounded bg-black/85 px-2 py-1 text-xs font-black text-white">
              {course.duration}
            </span>
          ) : null}
        </div>
        <CardContent className="space-y-3 p-4">
          <h3 className="line-clamp-2 min-h-14 text-lg font-semibold leading-7">{course.title}</h3>
          {course.instructor ? (
            <p className="inline-flex max-w-full items-center gap-1 text-sm font-medium text-[hsl(var(--muted-foreground))]">
              <span className="truncate">{course.instructor}</span>
              {course.instructorVerified ? <VerifiedMark label="Verified instructor" className="size-3.5" /> : null}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Badge className={accessBadgeClass(accessType)}>{accessLabel(accessType)}</Badge>
            <Badge>{course.level}</Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
