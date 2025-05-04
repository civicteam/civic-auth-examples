"use client";
import { UserButton, useUser } from "@civic/auth-web3/react";

const AuthHeader = () => {
  const { user, isLoading } = useUser();

  return (
    <div className="items-center justify-between px-2 py-4 sm:flex">
      {(user || isLoading) && <UserButton />}
    </div>
  );
};

export { AuthHeader };
