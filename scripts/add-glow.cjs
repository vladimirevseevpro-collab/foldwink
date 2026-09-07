const fs = require("fs");
let code = fs.readFileSync("src/styles/index.css", "utf8");
code += `
.fw-grid-glow::before {
  content: "";
  position: absolute;
  inset: -100px;
  background: radial-gradient(circle 250px at var(--mouse-x, -250px) var(--mouse-y, -250px), rgba(255, 255, 255, 0.08), transparent 100%);
  pointer-events: none;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.4s;
}
.fw-grid-glow:hover::before {
  opacity: 1;
}
`;
fs.writeFileSync("src/styles/index.css", code);
