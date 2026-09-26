import { Dna } from "lucide-react";

export function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <Dna size={27} strokeWidth={1.7} aria-hidden="true" />
      </span>
      <span>
        Bioscience<span className="brand-second">MASTERY</span>
      </span>
    </span>
  );
}
