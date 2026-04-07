"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import DashboardLayout from "../(dashboard)/layout";
import DashboardView from "@/components/DashboardView";

export default function UserDashboardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const routeId = params?.id;

  useEffect(() => {
    if (isLoading || !user?.id || !routeId) {
      return;
    }

    // Prevent seeing another user's page by forcing own route id.
    if (String(user.id) !== String(routeId)) {
      router.replace(`/${user.id}`); 
    }
  }, [isLoading, user?.id, routeId, router]);

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    // <main className="min-h-screen bg-slate-50 p-6 md:p-10">
    //   <section className="mx-auto max-w-5xl space-y-6">
    //     <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    //       <p className="text-sm font-medium text-slate-500">User Dashboard</p>
    //       <h1 className="mt-2 text-3xl font-bold text-slate-900">{user.name || "User"}</h1>
    //       <p className="mt-2 text-slate-600">{user.email}</p>
    //       <p className="mt-3 text-sm text-slate-500">Your unique route id: /{user.id}</p>
    //     </div>
    //   </section>
    // </main>
    <DashboardView/>
  );
}
