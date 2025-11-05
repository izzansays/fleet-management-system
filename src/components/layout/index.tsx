import {
  IconBolt,
  IconCalendar,
  IconCar,
  IconChartBar,
  IconDashboard,
  IconTool,
} from "@tabler/icons-react"
import * as React from "react"

import { NavMain } from "@/components/layout/nav-main"
import { NavUser } from "@/components/layout/nav-user"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "admin",
    email: "admin@carvo.com",
    avatar: "",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconDashboard,
    },
    {
      title: "Vehicles",
      url: "/vehicles",
      icon: IconCar,
    },
    {
      title: "Bookings",
      url: "/bookings",
      icon: IconCalendar,
    },
    {
      title: "Maintenance",
      url: "/maintenance",
      icon: IconTool,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: IconChartBar,
    },
  ],
}

export function Layout({ children, ...props }: React.ComponentProps<typeof Sidebar> & { children?: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas" variant="inset" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex gap-2 items-center ml-1">
                <IconBolt className="!size-5" />
                <span className="text-base font-semibold">Carvo Rentals</span>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={data.navMain} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
