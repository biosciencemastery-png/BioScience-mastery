import {
  Atom,
  Bell,
  Dna,
  FlaskConical,
  GraduationCap,
  Microscope,
} from "lucide-react";
import { upcomingCourses } from "@/content/catalogue";
import type { Messages } from "@/lib/i18n";

const icons = {
  atom: Atom,
  dna: Dna,
  flask: FlaskConical,
  graduation: GraduationCap,
  microscope: Microscope,
};
export function UpcomingCourses({ messages: m }: { messages: Messages }) {
  return (
    <div id="coming-soon" className="upcoming-section">
      <div className="subsection-heading">
        <h3>{m.courses.future}</h3>
        <span className="tiny-label">{m.courses.coming}</span>
      </div>
      <div className="upcoming-grid">
        {upcomingCourses.map((course) => {
          const Icon = icons[course.icon];
          return (
            <article className="upcoming-card" key={course.slug}>
              <div className="course-icon">
                <Icon size={24} strokeWidth={1.6} aria-hidden="true" />
              </div>
              <p className="coming-label">{m.courses.coming}</p>
              <h4>{course.name}</h4>
              <p className="course-category">{m.courses[course.category]}</p>
              <button
                disabled
                aria-describedby="notify-help"
                className="notify-button"
              >
                <Bell size={14} aria-hidden="true" />
                {m.courses.notify}
              </button>
            </article>
          );
        })}
      </div>
      <p id="notify-help" className="availability-note">
        <Bell size={14} aria-hidden="true" />
        {m.courses.notifyHelp}
      </p>
    </div>
  );
}
