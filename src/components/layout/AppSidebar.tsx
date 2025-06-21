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
  LifeBuoy,
  Settings,
  LogOut,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tasks", icon: Briefcase, label: "Tasks" },
  { href: "/one-percent-club", icon: Award, label: "1% Club" },
  { href: "/build-together", icon: Users, label: "Build Together" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
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
        <SidebarMenu>
           <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Support">
                <Link href="#">
                  <LifeBuoy />
                  <span>Support</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Settings">
                <Link href="#">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
        <Separator className="my-2" />
         <div className="flex items-center gap-3 p-2">
            <Avatar>
                <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="user avatar" />
                <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
                <p className="font-semibold text-sm truncate">John Doe</p>
                <p className="text-xs text-muted-foreground truncate">john.doe@email.com</p>
            </div>
            <Link href="/" title="Log Out">
                <LogOut className="w-5 h-5 text-muted-foreground hover:text-foreground"/>
            </Link>
         </div>
      </SidebarFooter>
    </Sidebar>
  );
}
