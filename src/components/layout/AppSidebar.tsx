"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Briefcase,
  Award,
  Users,
  Search,
  LogOut,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { logout } from "@/app/(auth)/actions";
import { Separator } from "../ui/separator";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import type { UserPayload } from "@/lib/session";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tasks", icon: Briefcase, label: "Tasks" },
  { href: "/find-freelancers", icon: Search, label: "Find Freelancers" },
  { href: "/one-percent-club", icon: Award, label: "1% Club" },
  { href: "/build-together", icon: Users, label: "Build Together" },
];

export function AppSidebar({ user }: { user: UserPayload }) {
  const pathname = usePathname();

  const dashboardPath = user.role === 'client' ? '/client-dashboard' : '/freelancer-dashboard';
  
  const finalNavItems = navItems.map(item => 
    item.href === '/dashboard' ? { ...item, href: dashboardPath } : item
  );

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {finalNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         <Separator className="my-1" />
         <div className="flex items-center gap-3 p-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
             <form action={logout}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" type="submit" className="h-8 w-8">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" align="center">
                  Log out
                </TooltipContent>
              </Tooltip>
            </form>
         </div>
      </SidebarFooter>
    </Sidebar>
  );
}
