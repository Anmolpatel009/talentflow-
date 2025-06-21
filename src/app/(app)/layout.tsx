import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import React from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="min-h-screen lg:p-8 p-4 bg-background">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
