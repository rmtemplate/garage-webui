import { LucideIcon } from "lucide-react";
import { ComponentPropsWithoutRef, forwardRef } from "react";
import { Button as BaseButton } from "react-daisyui";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type ButtonProps = ComponentPropsWithoutRef<typeof BaseButton> & {
  type?: HTMLButtonElement["type"];
  href?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
  icon?: LucideIcon;
  /** Icon placed after the label. */
  iconRight?: LucideIcon;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      href,
      children,
      icon: Icon,
      iconRight: IconRight,
      shape,
      size,
      className,
      title,
      loading,
      ...props
    },
    ref
  ) => {
    const iconOnly = !!Icon && !children;
    const iconSize = size === "sm" || size === "xs" ? 15 : 16;

    return (
      <BaseButton
        ref={ref}
        tag={href ? Link : undefined}
        shape={iconOnly ? "circle" : shape}
        size={size}
        title={title}
        // An icon-only button has no accessible name without this.
        aria-label={iconOnly ? title : undefined}
        aria-busy={loading || undefined}
        loading={loading}
        className={cn(className)}
        {...props}
        {...(href ? { to: href } : {})}
      >
        {Icon && !loading ? <Icon size={iconSize} /> : null}
        {children}
        {IconRight ? <IconRight size={iconSize} /> : null}
      </BaseButton>
    );
  }
);

export default Button;
