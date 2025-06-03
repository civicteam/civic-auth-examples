"use client";
import { UserButton, useUser } from "@civic/auth-web3/react";

const AuthHeader = () => {
  const { user } = useUser();

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
      <div className="flex flex-col">
        {user ? (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Welcome back!
          </div>
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Click to sign in with Civic Auth
          </div>
        )}
      </div>
      <UserButton />
    </div>
  );
};

export { AuthHeader };
