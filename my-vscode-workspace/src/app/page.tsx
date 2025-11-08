import { ChatContainer } from '@/components/ChatContainer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="bg-white shadow-sm border-b p-4">
        <h1 className="text-2xl font-bold">
          Gameplay Analysis AI
        </h1>
        <p className="text-gray-600">
          Upload your gameplay video and chat with the AI for detailed feedback and improvements
        </p>
      </div>
      <ChatContainer />
    </main>
  );
}