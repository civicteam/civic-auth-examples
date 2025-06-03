import { Web3Zone } from "./components/web3Zone";
import { AuthHeader } from "./components/AuthHeader";

const Page = async () => {
  return (
    <>
      <div className="z-10 flex h-full flex-col p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Civic Auth Web3 NextJS</h1>

          <AuthHeader />

          <Web3Zone />
          <footer className="absolute bottom-8 text-center text-sm text-slate-600 dark:text-slate-400">
            <p>©2025 Civic Technologies, Inc. All Rights Reserved</p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Page;
