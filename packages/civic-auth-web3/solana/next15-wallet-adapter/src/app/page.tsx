import Wallet from "@/app/Wallet";
import SendTransaction from "./SendTransaction";

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 items-center">
        <h1 className="text-4xl font-bold text-center mb-8">
          Civic Auth + Solana Wallet Example
        </h1>
        <p className="text-lg text-center text-gray-600 dark:text-gray-300 mb-8">
          Next.js 15 with Wallet Adapter integration
        </p>
        <Wallet />
        <SendTransaction />
      </main>
    </div>
  );
}
