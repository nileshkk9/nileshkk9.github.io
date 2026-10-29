import { ArchiveText } from "@/components/ArchiveText";
import { ExperienceLoader } from "@/components/ExperienceLoader";
import { architect } from "@/content/archive";
import { siteUrl } from "@/lib/site";

const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: architect.name,
  jobTitle: architect.title,
  url: siteUrl,
  email: `mailto:${architect.links.email}`,
  address: { "@type": "PostalAddress", addressLocality: "Bangalore", addressCountry: "IN" },
  worksFor: { "@type": "Organization", name: "Zinier" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "Netaji Subhash Engineering College" },
  sameAs: [architect.links.github, architect.links.linkedin, architect.links.leetcode],
  knowsAbout: architect.focus,
};

export default function Home() {
  return (
    <main className="fixed inset-0 bg-void">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />
      <div className="sr-only">
        <ArchiveText />
      </div>
      <ExperienceLoader />
    </main>
  );
}
