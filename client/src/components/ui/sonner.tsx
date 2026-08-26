import { useTheme } from "@/contexts/ThemeContext";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton={true}
      duration={4500}
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "cropcast-toast",
          title: "cropcast-toast-title",
          description: "cropcast-toast-description",
          actionButton: "cropcast-toast-action",
          cancelButton: "cropcast-toast-cancel",
          closeButton: "cropcast-toast-close",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
