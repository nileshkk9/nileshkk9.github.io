"use client";

import dynamic from "next/dynamic";

const Experience = dynamic(() => import("./Experience"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-void" />,
});

export function ExperienceLoader() {
  return <Experience />;
}
