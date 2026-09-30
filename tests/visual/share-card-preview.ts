import "@fontsource-variable/manrope/wght.css";
import { drawShareCard } from "../../src/share/shareCard";

const canvas = document.querySelector<HTMLCanvasElement>("#share-card");
const params = new URLSearchParams(window.location.search);

if (canvas) {
  drawShareCard(canvas, {
    mode: "daily",
    title: "Set sail",
    subtitle: "Daily · 2026-07-22",
    result: params.get("loss") === "1" ? "loss" : "win",
    mistakesUsed: 1,
    durationMs: 148_000,
    difficulty: "medium",
    difficultyLabel: "Medium",
    groupOrder: ["small-boats", "sailing-ships", "powered-vessels", "parts"],
    solvedGroupIds:
      params.get("loss") === "1"
        ? ["small-boats", "sailing-ships"]
        : ["small-boats", "sailing-ships", "powered-vessels", "parts"],
    winkUsed: true,
    winkAvailable: true,
    winkedGroupId: "powered-vessels",
    supporter: params.get("supporter") === "1",
    labels: {
      solved: "Solved",
      closeCall: "Close call",
      time: "Time",
      mistakes: "Mistakes",
      winkUsed: "Wink used",
      noWink: "No Wink",
      supporter: "Supporter",
    },
  });
}
