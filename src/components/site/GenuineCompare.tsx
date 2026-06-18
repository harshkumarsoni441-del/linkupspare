import { useEffect, useRef, useState } from "react";
import { Check, X, ShieldCheck, GripVertical } from "lucide-react";
import airImg from "@/assets/cmp-air.png.asset.json";
import brakeImg from "@/assets/cmp-brake.png.asset.json";
import oilImg from "@/assets/cmp-oil.png.asset.json";
import coolantImg from "@/assets/cmp-coolant.png.asset.json";
import airBad from "@/assets/cmp-air-bad.png.asset.json";
import brakeBad from "@/assets/cmp-brake-bad.png.asset.json";
import oilBad from "@/assets/cmp-oil-bad.png.asset.json";
import coolantBad from "@/assets/cmp-coolant-bad.png.asset.json";

const GENUINE: Record<string, string> = {
  air: airImg.url,
  brake: brakeImg.url,
  oil: oilImg.url,
  coolant: coolantImg.url,
};
const NONGENUINE: Record<string, string> = {
  air: airBad.url,
  brake: brakeBad.url,
  oil: oilBad.url,
  coolant: coolantBad.url,
};

type Tab = {
  id: string;
  label: string;
  pros: string[];
  cons: string[];
};

const TABS: Tab[] = [
  {
    id: "air",
    label: "Air Filter",
    pros: [
      "Increased filtration efficiency",
      "Optimal engine performance",
      "Maintains airflow",
      "Prevents moisture & corrosion",
    ],
    cons: [
      "Low dust holding capacity",
      "Incomplete combustion → high fuel use",
      "Low reliability",
      "Hazardous to environment",
    ],
  },
  {
    id: "brake",
    label: "Brake Pad",
    pros: [
      "Optimum hardness of friction lining",
      "No noise during braking",
      "Less wear & tear on brake system",
      "Eco-friendly, asbestos-free",
    ],
    cons: [
      "Inconsistent braking performance",
      "Loud squealing & vibration",
      "Rapid disc & drum wear",
      "Contains hazardous materials",
    ],
  },
  {
    id: "oil",
    label: "Oil Filter",
    pros: [
      "Removes all engine contaminants",
      "Superior filtration surface",
      "High-quality O-Ring, no leakage",
      "Extends engine life",
    ],
    cons: [
      "May not remove contaminants",
      "Less filtration → ineffective cleaning",
      "Poor O-Ring, high leak risk",
      "Engine life at risk, can seize",
    ],
  },
  {
    id: "coolant",
    label: "Coolant",
    pros: [
      "Maximum boiling & freezing protection",
      "Efficient heat transfer",
      "Superior chemical stability",
      "Long-life corrosion inhibitors",
    ],
    cons: [
      "Low corrosion protection",
      "Accelerated engine wear",
      "High viscosity causes overheating",
      "Short service life",
    ],
  },
];

export function GenuineCompare() {
  const [active, setActive] = useState(TABS[0].id);
  const [pos, setPos] = useState(50); // % of width
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const tab = TABS.find((t) => t.id === active)!;

  const setFromClientX = (clientX: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(6, Math.min(94, pct)));
  };

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const x = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      setFromClientX(x);
    };
    const onUp = () => (dragging.current = false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  // Gentle auto-sweep on tab change for a "wow" reveal
  useEffect(() => {
    let raf = 0;
    let start = 0;
    const dur = 1100;
    const from = 18;
    const to = 50;
    setPos(from);
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setPos(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="mb-6 flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> Spot the difference
          </span>
          <h2 className="mt-3 text-2xl font-bold md:text-3xl">Genuine vs Non-Genuine</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Drag the divider — see why OEM parts protect your Maruti Suzuki.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                active === t.id
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                  : "border border-border bg-surface/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border shadow-2xl shadow-primary/10 select-none"
        onMouseDown={(e) => {
          dragging.current = true;
          setFromClientX(e.clientX);
        }}
        onTouchStart={(e) => {
          dragging.current = true;
          setFromClientX(e.touches[0].clientX);
        }}
      >
        {/* GENUINE side (full width, behind) */}
        <Panel side="genuine" tab={tab} />

        {/* NON-GENUINE side (clipped, in front) */}
        <div
          className="absolute inset-0 transition-[clip-path] duration-75 ease-out"
          style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
        >
          <Panel side="nongenuine" tab={tab} />
        </div>

        {/* Divider */}
        <div
          className="pointer-events-none absolute inset-y-0 z-20 w-px bg-gradient-to-b from-primary via-amber-300 to-primary shadow-[0_0_24px_rgba(245,166,35,0.7)]"
          style={{ left: `${pos}%` }}
        />
        <div
          className="absolute z-30 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full border-2 border-primary bg-background/95 text-primary shadow-xl shadow-primary/40 backdrop-blur transition hover:scale-110"
          style={{ left: `${pos}%`, top: "50%" }}
        >
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Corner badges */}
        <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-md bg-emerald-600/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
          Genuine
        </div>
        <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-md bg-rose-600/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
          Non-Genuine
        </div>
      </div>
    </section>
  );
}

function Panel({ side, tab }: { side: "genuine" | "nongenuine"; tab: Tab }) {
  const isGenuine = side === "genuine";
  const items = isGenuine ? tab.pros : tab.cons;
  return (
    <div
      className="absolute inset-0 grid grid-cols-[minmax(92px,1fr)_minmax(150px,0.78fr)_minmax(92px,1fr)] items-center gap-2 px-3 py-10 md:grid-cols-[minmax(270px,1fr)_minmax(320px,0.82fr)_minmax(270px,1fr)] md:gap-10 md:px-12"
      style={{
        background: isGenuine
          ? "linear-gradient(135deg, hsl(160 60% 8%) 0%, hsl(200 60% 12%) 100%)"
          : "linear-gradient(135deg, hsl(0 50% 12%) 0%, hsl(20 55% 14%) 100%)",
      }}
    >
      {/* soft tint overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isGenuine
            ? "radial-gradient(60% 80% at 20% 50%, rgba(16,185,129,0.18), transparent 70%)"
            : "radial-gradient(60% 80% at 80% 50%, rgba(244,63,94,0.20), transparent 70%)",
        }}
      />

      {/* Feature list — outside of image, on the appropriate side */}
      <FeatureList side={side} tab={tab} items={items} />

      {/* Product image */}
      <div className="relative z-[2] col-start-2 row-start-1 flex min-h-0 items-center justify-center overflow-hidden self-stretch">
        <div className="pointer-events-none absolute inset-y-3 left-1/2 w-[min(52vw,430px)] -translate-x-1/2 rounded-full bg-background/20 blur-3xl" />
        <img
          src={isGenuine ? GENUINE[tab.id] : NONGENUINE[tab.id]}
          alt=""
          onError={(event) => {
            event.currentTarget.style.opacity = "0";
          }}
          draggable={false}
          className="relative z-[1] block max-h-[68%] w-auto max-w-[145px] object-contain drop-shadow-[0_22px_34px_rgba(0,0,0,0.68)] sm:max-w-[220px] md:max-h-[76%] md:max-w-[340px]"
        />
      </div>
    </div>
  );
}

function FeatureList({ side, tab, items }: { side: "genuine" | "nongenuine"; tab: Tab; items: string[] }) {
  const isGenuine = side === "genuine";
  return (
    <ul
      key={tab.id + side}
      className={`relative z-[3] col-start-1 row-start-1 flex max-w-[230px] flex-col gap-1.5 self-center md:max-w-[290px] md:gap-3 ${
        isGenuine ? "justify-self-start" : "col-start-3 justify-self-end text-right"
      }`}
    >
      {items.map((txt, i) => (
        <li
          key={txt}
          className="flex animate-fade-in items-start gap-1.5 rounded-md bg-background/24 px-1.5 py-1 text-[9px] leading-snug text-foreground/90 backdrop-blur-sm sm:px-2 sm:text-[10px] md:bg-transparent md:px-0 md:py-0 md:text-sm"
          style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards", flexDirection: isGenuine ? "row" : "row-reverse" }}
        >
          <span
            className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full md:h-5 md:w-5 ${
              isGenuine ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
            }`}
          >
            {isGenuine ? <Check className="h-3 w-3 md:h-3.5 md:w-3.5" /> : <X className="h-3 w-3 md:h-3.5 md:w-3.5" />}
          </span>
          <span>{txt}</span>
        </li>
      ))}
    </ul>
  );
}
