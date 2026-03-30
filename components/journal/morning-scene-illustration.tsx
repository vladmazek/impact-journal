import earlyMorningImage from "@/earlymorning.png";
import morningImage from "@/morning.png";
import { SceneIllustration } from "@/components/journal/scene-illustration";
import { type MorningSceneVariant } from "@/lib/date";

type MorningSceneIllustrationProps = {
  className?: string;
  expanded?: boolean;
  variant?: MorningSceneVariant;
};

export function MorningSceneIllustration({
  className,
  expanded = false,
  variant = "default",
}: MorningSceneIllustrationProps) {
  const image = variant === "early" ? earlyMorningImage : morningImage;
  const imageName = variant === "early" ? "earlymorning" : "morning";

  return (
    <SceneIllustration
      className={className}
      expanded={expanded}
      image={image}
      imageClassName={
        expanded
          ? "object-[74%_28%] opacity-96 saturate-[1.01] scale-100 dark:opacity-[0.84]"
          : "object-[76%_16%] opacity-95 saturate-[1.02] scale-[1.04] dark:opacity-[0.78]"
      }
      imageName={imageName}
      overlayClassName="bg-[radial-gradient(circle_at_73%_25%,rgba(254,240,138,0.42),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.12))] dark:bg-[radial-gradient(circle_at_73%_25%,rgba(254,240,138,0.14),transparent_22%),linear-gradient(180deg,rgba(15,23,42,0.04),rgba(15,23,42,0.34))]"
      testId="morning-scene-illustration"
      variant={variant}
    />
  );
}
