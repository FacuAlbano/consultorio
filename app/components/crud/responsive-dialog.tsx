import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "~/components/ui/drawer";
import { useMediaQuery } from "~/hooks/use-media-query";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  description?: string;
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  children,
  description,
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[95vh] max-w-[90vw] sm:!max-w-[90vw] w-full flex flex-col p-0">
          <DialogHeader className="sticky top-0 bg-background z-10 px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 pb-6 pt-4 min-h-0">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <DrawerHeader className="sticky top-0 bg-background z-10 border-b shrink-0 pb-3">
          <DrawerTitle className="text-base sm:text-lg">{title}</DrawerTitle>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </DrawerHeader>
        <div className="overflow-y-auto flex-1 p-4 sm:p-6">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
