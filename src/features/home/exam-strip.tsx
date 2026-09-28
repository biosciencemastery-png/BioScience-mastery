"use client";
import { useState } from "react";
import Link from "next/link";
import { Pause, Play } from "lucide-react";
export function ExamStrip({
  exams,
  pause,
  play,
}: {
  exams: { id: string; name: string; href: string }[];
  pause: string;
  play: string;
}) {
  const [paused, setPaused] = useState(false);
  if (!exams.length) return null;
  return (
    <div className="home-exam-strip" data-paused={paused}>
      <button
        type="button"
        className="home-marquee-control"
        onClick={() => setPaused(!paused)}
        aria-label={paused ? play : pause}
      >
        {paused ? (
          <Play size={16} aria-hidden />
        ) : (
          <Pause size={16} aria-hidden />
        )}
      </button>
      <div className="home-marquee-window">
        <div className="home-marquee-track">
          <ul>
            {exams.map((e) => (
              <li key={e.id}>
                <Link href={e.href}>
                  {e.name}
                  <span aria-hidden>↗</span>
                </Link>
              </li>
            ))}
          </ul>
          <ul aria-hidden="true">
            {exams.map((e) => (
              <li key={e.id}>
                <span>
                  {e.name}
                  <span>↗</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
