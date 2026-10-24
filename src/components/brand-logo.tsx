import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({
  variant = "ochre",
  subtitle = false,
  className,
}: {
  variant?: "ochre" | "blue";
  subtitle?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("brand-logo", className)}>
      <Image
        src={
          variant === "blue" ? "/brand/logo-blue.png" : "/brand/logo-ochre.png"
        }
        width={300}
        height={144}
        sizes="(max-width: 760px) 128px, 160px"
        alt="Lavilli Jet"
      />
      {subtitle && <small>GESTÃO DO HANGAR</small>}
    </span>
  );
}
