import type { Metadata } from "next";
import { MessageCenter } from "@/components/platform/message-center";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Messages"
};

export default function AdminMessagesPage() {
  return (
    <div className="content-frame">
      <MessageCenter />
    </div>
  );
}
