import nightImage from "@/night.png";
import { SceneIllustration } from "@/components/journal/scene-illustration";

type EveningSceneIllustrationProps = {
  className?: string;
  expanded?: boolean;
};

export function EveningSceneIllustration({
  className,
  expanded = false,
}: EveningSceneIllustrationProps) {
  return (
    <SceneIllustration
      className={className}
      expanded={expanded}
      image={nightImage}
      imageClassName={
        expanded
          ? "object-[74%_24%] opacity-92 saturate-[0.95] scale-[1.01] dark:opacity-[0.76]"
          : "object-[74%_18%] opacity-90 saturate-[0.92] scale-[1.04] dark:opacity-[0.7]"
      }
      imageName="night"
      overlayClassName="bg-[radial-gradient(circle_at_76%_24%,rgba(148,163,184,0.18),transparent_20%),linear-gradient(180deg,rgba(15,23,42,0.04),rgba(15,23,42,0.18))] dark:bg-[radial-gradient(circle_at_76%_24%,rgba(148,163,184,0.1),transparent_22%),linear-gradient(180deg,rgba(2,6,23,0.18),rgba(2,6,23,0.48))]"
      testId="evening-scene-illustration"
    />
  );
}
