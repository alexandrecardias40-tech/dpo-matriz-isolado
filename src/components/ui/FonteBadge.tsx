import React from 'react';

interface FonteBadgeProps {
  fonte: "matriz" | "tg" | "ambos" | string;
  size?: "xs" | "sm" | "md" | "lg";
}

export function FonteBadge({ fonte, size = "md" }: FonteBadgeProps) {
  const fs = size === "xs" ? 8 : size === "sm" ? 9 : size === "md" ? 11 : 13;
  const px = size === "xs" ? 4 : size === "sm" ? 6 : size === "md" ? 8 : 10;
  const py = size === "xs" ? 1 : size === "sm" ? 2 : size === "md" ? 3 : 4;
  const ml = size === "lg" ? 10 : size === "xs" ? 4 : 6;

  const baseStyle: React.CSSProperties = {
    padding: `${py}px ${px}px`,
    borderRadius: 6,
    fontSize: fs,
    fontWeight: 800,
    letterSpacing: "0.05em",
    marginLeft: ml,
    display: "inline-flex",
    alignItems: "center",
    whiteSpace: "nowrap",
  };

  const fLower = fonte.toLowerCase();

  if (fLower === "matriz") {
    return (
      <span style={{ ...baseStyle, background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
        MATRIZ
      </span>
    );
  }
  if (fLower === "tg" || fLower === "tesouro") {
    return (
      <span style={{ ...baseStyle, background: "#faf5ff", color: "#7c3aed", border: "1px solid #e9d5ff" }}>
        TESOURO
      </span>
    );
  }
  if (fLower === "ambos" || fLower === "integrado") {
    return (
      <span style={{ ...baseStyle, background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" }}>
        INTEGRADO
      </span>
    );
  }
  
  // Default/all
  return (
    <span style={{ ...baseStyle, background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}>
      Matriz <span style={{ color: "#6366f1", margin: "0 4px", fontSize: "1.1em" }}>+</span> C. Indiretos <span style={{ color: "#6366f1", margin: "0 4px", fontSize: "1.1em" }}>+</span> Arrecadação
    </span>
  );
}
