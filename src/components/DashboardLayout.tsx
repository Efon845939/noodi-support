'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  PlusCircle,
  User,
  Building,
  LogOut,
  Siren,
  PanelLeft,
} from 'lucide-react';
import { mockUser } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/report/new', icon: PlusCircle, label: 'New Report' },
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/admin/organizations', icon: Building, label: 'Organizations', adminOnly: true },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarContent>
            <SidebarHeader>
              <div className="flex items-center gap-2">
                <Siren className="size-6 text-primary" />
                <span className="text-lg font-semibold font-headline">Noodi Support</span>
              </div>
            </SidebarHeader>
            <SidebarMenu>
              {navItems.map((item) => {
                if (item.adminOnly && !mockUser.isAdmin) return null;
                return (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href}>
                      <SidebarMenuButton
                        isActive={pathname === item.href}
                        tooltip={item.label}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <Link href="/">
              <SidebarMenuButton tooltip="Logout">
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </Link>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
            <div className="md:hidden">
              <SidebarTrigger>
                <PanelLeft />
              </SidebarTrigger>
            </div>
            <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
              <div className="ml-auto flex items-center gap-4">
                <span className="text-sm font-medium">{mockUser.name}</span>
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
