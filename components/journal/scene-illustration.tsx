import Image, { type StaticImageData } from "next/image";

import { cn } from "@/lib/utils";

type SceneIllustrationProps = {
  className?: string;
  expanded?: boolean;
  image: StaticImageData;
  imageClassName?: string;
  imageName: string;
  overlayClassName?: string;
  testId: string;
  variant?: string;
};

export function SceneIllustration({
  className,
  expanded = false,
  image,
  imageClassName,
  imageName,
  overlayClassName,
  testId,
  variant = "default",
}: SceneIllustrationProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden select-none", className)}
      data-scene-expanded={expanded ? "true" : "false"}
      data-scene-image={imageName}
      data-scene-variant={variant}
      data-testid={testId}
    >
      <Image
        alt=""
        className={cn(
          "prompt-header-scene-image-mask object-cover object-right-top transition-[transform,object-position,opacity,filter] duration-500 ease-out will-change-transform",
          expanded && "prompt-header-scene-image-mask-expanded",
          imageClassName,
        )}
        draggable={false}
        fill
        sizes="(min-width: 1280px) 920px, (min-width: 1024px) calc(100vw - 420px), 100vw"
        src={image}
      />
      <div
        className={cn(
          "prompt-header-scene-overlay absolute inset-0 transition-[background,opacity] duration-500 ease-out",
          expanded && "prompt-header-scene-overlay-expanded",
        )}
      />
      <div
        className={cn(
          "absolute inset-0 transition-[background,opacity] duration-500 ease-out",
          overlayClassName,
        )}
      />
    </div>
  );
}
