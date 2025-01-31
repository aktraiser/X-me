"use client"

import * as React from "react"
import Link from 'next/link'
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from "@/lib/utils"
import { HelpCircle } from 'lucide-react'

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "end", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "z-50 w-64 rounded-md bg-white p-4 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

const InfoBubble = () => {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Popover>
        <PopoverTrigger asChild>
          <button className="rounded-full p-2 bg-white shadow-lg hover:bg-gray-100 outline-none">
            <HelpCircle className="h-5 w-5" />
          </button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="flex flex-col space-y-2">
            <Link 
              href="/conditions-utilisation"
              className="text-sm hover:underline"
            >
              Conditions d&apos;utilisation
            </Link>
            <Link 
              href="/politique-confidentialite"
              className="text-sm hover:underline"
            >
              Politique de confidentialité
            </Link>
            <Link 
              href="/a-propos"
              className="text-sm hover:underline"
            >
              À propos de nous
            </Link>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default InfoBubble; 