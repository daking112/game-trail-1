import { MonsterDefinition } from "@monsterfall/shared";

interface Props {
  def: MonsterDefinition;
  size?: number;
}

const CLIP_PATHS: Record<MonsterDefinition["sprite"]["shape"], string> = {
  circle: "circle(50% at 50% 50%)",
  square: "inset(10% 10% 10% 10% round 8px)",
  triangle: "polygon(50% 5%, 95% 95%, 5% 95%)",
  diamond: "polygon(50% 2%, 98% 50%, 50% 98%, 2% 50%)",
  hexagon: "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)",
};

export default function MonsterSprite({ def, size = 64 }: Props) {
  return (
    <div
      title={def.name}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 30%, ${def.sprite.color}, ${def.sprite.color}cc 70%, #000 140%)`,
        clipPath: CLIP_PATHS[def.sprite.shape],
        border: "2px solid rgba(255,255,255,0.15)",
        flexShrink: 0,
      }}
    />
  );
}
