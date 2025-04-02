"use client";

import { SignOutButton, useUser } from "@civic/auth/react";
import {redirect} from "next/navigation";

const Page = () => {
  const { user } = useUser();

    // If not logged in, redirect to home page
    if (!user) {
        console.log("User is not logged in!")
        redirect('/');
    }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-neutral-100 py-6 sm:py-12">
      <div className="relative py-3 sm:mx-auto sm:max-w-3xl">
        <div className="to-light-blue-500 absolute inset-0 -skew-y-6 transform bg-gradient-to-r from-cyan-400 shadow-lg sm:-rotate-6 sm:skew-y-0 sm:rounded-3xl"></div>
        <div className="relative flex flex-col gap-8 bg-white px-4 py-10 shadow-lg sm:rounded-3xl sm:p-20">
          <UserInfo user={{ email: user?.email || "" }} />

          <SignOutButton className="w-full" />
        </div>
      </div>
    </div>
  );
};

const UserInfo = ({ user }: { user: { email: string | null } }) => {
  return (
    <div className="space-y-6">
      <p className="text-xl text-neutral-700">
        Welcome authenticated,{" "}
        <span className="font-semibold">{user.email}</span>
      </p>
    </div>
  );
};

export default Page;
