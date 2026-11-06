import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldLabel
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { isSafeInternalPath } from "@/lib/path"
import axios from "@/lib/axios"
import { cn } from "@/lib/utils"
import { useUserStore } from '@/store'
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Eye,
  EyeOff,
  Loader2Icon,
  Lock,
  User,
} from "lucide-react"
import React, { useState } from 'react'
import { Controller, useForm } from "react-hook-form"
import { useIntl } from "react-intl"
import { useLocation, useNavigate } from 'react-router'
import { toast } from "sonner"
import { z } from "zod"


export default function Login({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const intl = useIntl();
  const formSchema = z.object({
    username: z.string().min(4, {
      message: intl.formatMessage({ id: 'page.login.username.valid' }),
    }),
    password: z.string().min(4, {
      message: intl.formatMessage({ id: 'page.login.password.valid' }),
    })
  })
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "super",
      password: "super"
    },
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useUserStore();

  // 登录后回到用户原本访问的页面；from 优先取路由 state，其次取 redirect 查询参数
  const stateFrom = (location.state as { from?: string } | null)?.from;
  const queryFrom = new URLSearchParams(location.search).get("redirect");
  const redirectTo = [stateFrom, queryFrom].find(isSafeInternalPath) ?? "/";

  function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    axios
      .post('/auth/login', values)
      .then((res) => {
        const data = res.data?.data;
        if (data?.status === 'ok' && data.token) {
          login(data.token, data.expiresIn);
          navigate(redirectTo, { replace: true });
        } else if (data?.msg) {
          // 兼容旧后端仍返回 200 + status=error 的情况
          toast.error(data.msg);
        }
      })
      .catch((error) => {
        const message =
          error?.response?.data?.message ||
          error?.data?.message ||
          error?.message ||
          intl.formatMessage({
            id: 'page.login.failed',
            defaultMessage: '登录失败',
          });
        toast.error(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }
  return (
    <div
      className="relative flex min-h-svh items-center justify-center overflow-hidden p-6 md:p-10"
      style={{
        background:
          "radial-gradient(circle at 12% 18%, color-mix(in oklab, var(--primary) 22%, transparent), transparent 42%), radial-gradient(circle at 88% 82%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 46%), var(--background)",
      }}
    >
      <div className="absolute right-4 top-3 z-10 flex items-center gap-1">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>

      <div className="grid w-full max-w-5xl items-center gap-10 md:grid-cols-[1.15fr_0.85fr]">
        <section className="hidden md:block">
          <div className="inline-flex items-center gap-3 text-sm font-extrabold tracking-[0.16em]">
            <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-orange-400 to-primary text-lg font-black text-primary-foreground shadow-lg">
              O
            </span>
            ORANGE
          </div>
          <h1 className="mt-6 text-[clamp(2.125rem,4vw,3.375rem)] font-extrabold leading-[1.05] tracking-tight">
            {intl.formatMessage({ id: 'page.login.hero.title' })}
          </h1>
          <p className="mt-5 max-w-lg whitespace-pre-line text-base leading-7 text-muted-foreground">
            {intl.formatMessage({ id: 'page.login.hero.desc' })}
          </p>
          <div className="mt-9 flex gap-9">
            {[
              ['31+', 'page.login.hero.pages'],
              ['2', 'page.login.hero.languages'],
              ['RBAC', 'page.login.hero.rbac'],
            ].map(([value, key]) => (
              <div key={key} className="flex flex-col gap-0.5">
                <strong className="text-2xl font-bold">{value}</strong>
                <span className="text-xs text-muted-foreground">
                  {intl.formatMessage({ id: key })}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="mx-auto w-full max-w-sm md:max-w-none">
          <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="border-border/70 bg-card/85 shadow-2xl backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {intl.formatMessage({ id: 'page.login.title' })}
                </CardTitle>
                <CardDescription>
                  {intl.formatMessage({ id: 'page.login.desc' })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <Controller
                    name="username"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>
                          {intl.formatMessage({ id: 'page.login.username' })}
                        </FieldLabel>
                        <div className="relative">
                          <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            placeholder="super"
                            {...field}
                            id={field.name}
                            aria-invalid={fieldState.invalid}
                          />
                        </div>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    name="password"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>
                          {intl.formatMessage({ id: 'page.login.password' })}
                        </FieldLabel>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            className="pl-9 pr-9"
                            type={showPassword ? "text" : "password"}
                            placeholder="super"
                            {...field}
                            id={field.name}
                            aria-invalid={fieldState.invalid}
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground transition-colors hover:text-foreground"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            onClick={() => setShowPassword((value) => !value)}
                          >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2Icon className="animate-spin" />}
                    {intl.formatMessage({ id: 'page.login.login' })}
                  </Button>
                </form>
                <p className="mt-4 text-xs text-muted-foreground">
                  {intl.formatMessage({ id: 'page.login.demoHint' })}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
