import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import React from "react";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  
  if (!user) {
    redirect('/login');
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <div className="min-h-screen lg:p-8 p-4 bg-background">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
