import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const url = process.env.URL ?? "http://localhost:3210";
const out = process.env.OUT ?? "qa";
const only = process.argv[2] ?? "all";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const mobile = only === "mobile";
const page = await browser.newPage(
  mobile
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
);
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));

const wait = (ms) => page.waitForTimeout(ms);
const shot = async (name) => {
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log("shot", name);
};
const fps = () =>
  page.evaluate(
    () =>
      new Promise((r) => {
        let n = 0;
        const t0 = performance.now();
        const loop = () => {
          n++;
          if (performance.now() - t0 < 2000) requestAnimationFrame(loop);
          else r(Math.round((n / (performance.now() - t0)) * 1000));
        };
        requestAnimationFrame(loop);
      }),
  );
const xp = (fn, arg) => page.evaluate(fn, arg);

await page.goto(url, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });
if (only !== "all" && only !== "boot") await xp(() => window.__xp.getState().setOnboarded(true));

if (only === "all" || only === "boot") {
  await wait(2500);
  await shot("01-boot-typing");
  await page.keyboard.press("Space");
  await wait(300);
  await page.keyboard.press("Space");
  await wait(1500);
  await shot("02-boot-done");
  await page.keyboard.press("Enter");
  await wait(2000);
  await shot("03-intro-stream");
  await wait(2500);
  await shot("04-intro-roads");
  await wait(3000);
  await shot("05-intro-city");
  await wait(4500);
  await shot("06-origin-arrive");
  await wait(3000);
  await shot("07-origin-overview");
  console.log("fps origin", await fps());
  await wait(1500);
  await shot("07a-onboarding-1");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await wait(600);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await wait(600);
  await shot("07b-onboarding-3");
  await page.getByRole("button", { name: "Start exploring" }).click();
  await wait(800);
  await shot("07c-origin-briefing");
}

if (mobile) {
  await wait(2500);
  await shot("m01-boot");
  await page.keyboard.press("Space");
  await wait(300);
  await page.keyboard.press("Space");
  await wait(1200);
  await page.keyboard.press("Enter");
  await wait(14000);
  await shot("m02-origin-onboarding");
  await page.getByRole("button", { name: "Skip" }).click().catch(() => {});
  await wait(800);
  await shot("m03-origin");
  console.log("fps origin", await fps());
  for (const id of ["legacy", "logistics", "nexus", "routeverse", "forge", "archive", "future"]) {
    await xp((w) => window.__xp.getState().travel(w, 0), id);
    await wait(6500);
    await shot(`m-${id}`);
    console.log("fps", id, await fps());
    if (id === "nexus" || id === "forge") {
      await xp(() => window.__xp.getState().setSheet("briefing"));
      await wait(900);
      await shot(`m-${id}-briefing`);
      await xp(() => window.__xp.getState().setSheet("console"));
      await wait(900);
      await shot(`m-${id}-console`);
      await xp(() => window.__xp.getState().setSheet(null));
    }
  }
  await xp(() => window.__xp.getState().setPanel("starmap"));
  await wait(1000);
  await shot("m-starmap");
  await xp(() => window.__xp.getState().setPanel("ai"));
  await wait(1000);
  await shot("m-architect");
}

if (only === "all" || only === "origin") {
  if (only === "origin") {
    await wait(1000);
    await xp(() => window.__xp.getState().travel("origin", 0));
    await wait(5000);
  }
  for (const [i, name] of ["campus", "lab", "artifacts", "gate"].entries()) {
    await xp((s) => window.__xp.getState().setShot(s), i + 1);
    await wait(3000);
    await shot(`08-origin-${name}`);
  }
  await xp(() => {
    const s = window.__xp.getState();
    ["nsec", "arxiv", "ocp", "oca", "nptel"].forEach((id) => s.collect(id));
    s.collect("leetcode");
  });
  await wait(1500);
  await shot("09-origin-artifact-card");
}

if (only === "all" || only === "nexus") {
  await xp(() => {
    const s = window.__xp.getState();
    s.openArtifact(null);
    s.travel("nexus", 0);
  });
  await wait(6000);
  await shot("10-nexus-overview");
  console.log("fps nexus", await fps());
  await xp(() => window.__xp.getState().setShot(1));
  await wait(3000);
  await shot("11-nexus-engine");
  await xp(() => window.__xp.getState().setShot(2));
  await wait(3000);
  await shot("12-nexus-street");
  await xp(() => {
    const s = window.__xp.getState();
    s.setShot(0);
    s.setNexusMode("batch");
  });
  await wait(9000);
  await shot("13-nexus-batch");
  await xp(() => {
    const s = window.__xp.getState();
    s.setShot(3);
    s.setNexusCapacity(true);
  });
  await wait(3500);
  await shot("14-nexus-capacity");
  await xp(() => {
    const s = window.__xp.getState();
    s.setShot(0);
    s.setNexusCapacity(false);
    s.setNexusMode("continuous");
    s.fireDispatch();
  });
  await wait(2500);
  await shot("15-nexus-dispatch");
  await xp(() => {
    const s = window.__xp.getState();
    s.setPanel("ai");
  });
  await wait(600);
  await page.keyboard.type("How did Nilesh build the scheduling platform?");
  await page.keyboard.press("Enter");
  await wait(3500);
  await shot("16-ai-console");
  await xp(() => window.__xp.getState().setPanel("starmap"));
  await wait(1200);
  await shot("17-starmap");
  await xp(() => window.__xp.getState().setPanel("log"));
  await wait(1000);
  await shot("18-mission-log");
}

const goto = async (world, ms = 6000) => {
  await xp((w) => {
    const s = window.__xp.getState();
    s.setPanel("none");
    s.openArtifact(null);
    s.travel(w, 0);
  }, world);
  await wait(ms);
};
const shots = async (prefix, n) => {
  for (let i = 1; i < n; i++) {
    await xp((s) => window.__xp.getState().setShot(s), i);
    await wait(3000);
    await shot(`${prefix}-shot${i}`);
  }
  await xp(() => window.__xp.getState().setShot(0));
  await wait(2800);
};

if (only === "all" || only === "phase2" || only === "legacy") {
  await goto("legacy");
  await shot("20-legacy-overview");
  console.log("fps legacy", await fps());
  await shots("21-legacy", 4);
  await xp(() => {
    const s = window.__xp.getState();
    s.completeObjective("legacy", "deps");
    s.completeObjective("legacy", "mvc");
  });
  await page.reload({ waitUntil: "networkidle" });
  await wait(1200);
  await goto("legacy", 9000);
  await shot("22-legacy-partial");
}

if (only === "all" || only === "phase2" || only === "logistics") {
  await goto("logistics");
  await shot("30-logistics-overview");
  console.log("fps logistics", await fps());
  await shots("31-logistics", 4);
  await page.getByRole("button", { name: /Inbound Flow/ }).click();
  await wait(3500);
  await shot("32-logistics-inbound-fixed");
  await page.getByRole("button", { name: /Warehouse Operations/ }).click();
  await page.getByRole("button", { name: /Outbound Flow/ }).click();
  await wait(3200);
  await shot("33-logistics-achievement");
}

if (only === "all" || only === "phase2" || only === "routeverse") {
  await goto("routeverse");
  await shot("40-route-overview");
  console.log("fps routeverse", await fps());
  await xp(() => window.__xp.getState().setShot(1));
  await wait(3000);
  await shot("41-route-chains");
  await xp(() => window.__xp.getState().completeObjective("routeverse", "chains"));
  await wait(1200);
  await shot("42-route-breaking");
  await xp(() => window.__xp.getState().setShot(0));
  await wait(6500);
  await shot("43-route-engine");
  await wait(1200);
  await shot("44-route-path");
  await xp(() => window.__xp.getState().setShot(3));
  await wait(5000);
  await shot("45-route-costs");
}

if (only === "all" || only === "phase3" || only === "forge") {
  await goto("forge");
  await shot("50-forge-overview");
  console.log("fps forge", await fps());
  await shots("51-forge", 4);
  await xp(() => window.__xp.getState().completeObjective("forge", "core"));
  await wait(3500);
  await shot("52-forge-online");
  await page.mouse.click(420, 520);
  await wait(800);
  await shot("53-forge-click");
  await page.getByRole("button", { name: /Run auto-fix/ }).click();
  await wait(3500);
  await shot("54-forge-fixed");
}

if (only === "all" || only === "phase3" || only === "archive") {
  await goto("archive");
  await shot("60-archive-overview");
  console.log("fps archive", await fps());
  await shots("61-archive", 3);
  await page.getByRole("button", { name: /HVAC/ }).click();
  await wait(1200);
  await shot("62-archive-travel");
  await wait(1300);
  await shot("63-archive-retrieve");
  await wait(2600);
  await shot("64-archive-answer");
  await page.getByRole("button", { name: /Open trace/ }).click();
  await wait(600);
  await shot("65-archive-trace");
}

if (only === "all" || only === "phase3" || only === "future") {
  await goto("future");
  await shot("70-future-tunnel");
  console.log("fps future", await fps());
  await xp(() => window.__xp.getState().setShot(1));
  await wait(3500);
  await shot("71-future-paths");
  await xp(() => window.__xp.getState().setFuturePath("agents"));
  await wait(800);
  await shot("72-future-selected");
  await xp(() => window.__xp.getState().setShot(2));
  await wait(3500);
  await shot("73-future-beacon");
  await page.getByRole("button", { name: "Get in touch" }).click();
  await wait(900);
  await shot("74-future-transmit");
  await xp(() => window.__xp.getState().setPanel("starmap"));
  await wait(900);
  await shot("75-journey-map");
}

console.log("errors", JSON.stringify(errors.slice(0, 20), null, 1));
await browser.close();
