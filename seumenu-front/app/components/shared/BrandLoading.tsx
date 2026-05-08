import Image from "next/image";

type BrandLoadingProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: "w-32",
  md: "w-44",
  lg: "w-56",
} as const;

export function BrandLoading({ size = "md", className }: BrandLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center ${className ?? ""}`.trim()}
    >
      <Image
        src="/brand/LogoSeuMenu.png"
        alt="Seu Menu carregando"
        width={320}
        height={72}
        priority
        className={`${sizeMap[size]} h-auto seumenu-loader-blink`}
      />
    </div>
  );
}
