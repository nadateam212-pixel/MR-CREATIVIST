export type PlatformRole = "student" | "instructor" | "seller" | "client" | "freelancer" | "consultant" | "admin";

export type NavItem = {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  roles?: PlatformRole[];
};

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};
