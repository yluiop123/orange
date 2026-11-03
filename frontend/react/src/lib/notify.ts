import { toast } from "sonner";

export const notify = {
  success: (msg: string) =>
    toast.success(msg, {
      duration: 3000,
    }),
  error: (msg: string) =>
    toast.error(msg, {
      duration: 4000,
    }),
  loading: (msg: string) =>
    toast.loading(msg, {
      duration: 2000,
    }),
};
