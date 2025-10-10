import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle className="text-xl font-semibold">{title}</ToastTitle>}
            {description && <ToastDescription className="text-xl font-semibold">{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}

      {/* 👇 Top-left corner position */}
      <ToastViewport className="fixed top-4 left-4 z-[10000] flex flex-col gap-2 outline-none" />
    </ToastProvider>
  );
}
