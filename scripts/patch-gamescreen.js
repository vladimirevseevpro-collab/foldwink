const fs = require("fs");
let code = fs.readFileSync("c:/AI/neural-void.com/foldwink/src/screens/GameScreen.tsx", "utf8");

// Pitch variation
code = code.replace(
  'play(already ? "deselect" : "select");',
  `
    const pitch = already ? 0.94 : (SELECT_PITCHES[active.selection.length] ?? 1.0);
    play(already ? "deselect" : "select", { playbackRate: pitch * (0.98 + Math.random() * 0.04) });
  `,
);

// Deal Index
code = code.replace("{active.order.map((value) => {", "{active.order.map((value, index) => {");
code = code.replace(
  "<Card\n              key={value}\n              value={value}\n              state={state}",
  "<Card\n              key={value}\n              value={value}\n              state={state}\n              dealIndex={index}",
);

// Vignette
code = code.replace(
  "<div className={`transition-shadow rounded-2xl ${flashRingClass}`}>",
  '<> {flash === "one-away" && !active.result && <div className="pointer-events-none fixed inset-0 z-[100] animate-pulse bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-danger/15" aria-hidden="true" />} <div className={`transition-shadow rounded-2xl ${flashRingClass}`}>',
);
code = code.replace(
  "      </div>\n    </div>\n  );\n}",
  "      </div>\n    </div>\n    </>\n  );\n}",
);

fs.writeFileSync("c:/AI/neural-void.com/foldwink/src/screens/GameScreen.tsx", code);
