import { MessageCenter } from "@/components/platform/message-center";

export default async function ChatThreadPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  return <MessageCenter recipientId={userId} />;
}
