import Button from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { loginSchema } from "./schema";
import { InputField } from "@/components/ui/input";
import { useLogin } from "./hooks";
import garageLogo from "@/assets/garage-logo.svg";
import { KeyRound, User } from "lucide-react";

export default function LoginPage() {
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });
  const login = useLogin();

  return (
    <div className="surface shadow-md p-6 sm:p-8 animate-fade-in-up">
      <div className="flex flex-col items-center text-center mb-7">
        <img src={garageLogo} alt="" aria-hidden className="size-11 mb-4" />
        <h1 className="text-lg font-semibold tracking-[-0.015em]">
          Sign in to Garage
        </h1>
        <p className="text-[0.8125rem] muted mt-1.5">
          Enter your credentials to manage your cluster.
        </p>
      </div>

      <form
        onSubmit={form.handleSubmit((v) => login.mutate(v))}
        className="flex flex-col gap-4"
      >
        <InputField
          form={form}
          name="username"
          title="Username"
          icon={User}
          autoComplete="username"
          autoFocus
          placeholder="admin"
        />

        <InputField
          form={form}
          name="password"
          title="Password"
          type="password"
          icon={KeyRound}
          autoComplete="current-password"
          placeholder="••••••••"
        />

        <Button
          type="submit"
          color="primary"
          size="lg"
          className="w-full mt-2"
          loading={login.isPending}
        >
          Sign in
        </Button>
      </form>
    </div>
  );
}
