'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-lg rounded-xl bg-[#1a1a1a] border border-[#2d2d2d]',
            'shadow-[0_0_40px_rgba(200,169,81,0.1)] p-6',
            'data-[state=open]:animate-slide-up',
            className
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              {title && (
                <Dialog.Title className="text-xl font-bold text-white">
                  {title}
                </Dialog.Title>
              )}
              <Dialog.Description className={description ? "mt-1 text-sm text-gray-400" : "sr-only"}>
                {description ?? ''}
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-md p-1 text-gray-400 hover:text-white hover:bg-[#2d2d2d] transition-colors">
              <X size={18} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
