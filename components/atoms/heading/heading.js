export default function H1({
  align = "left",
  children,
  className = "",
  fontWeight = "font-bold ",
}) {
  const validAlignments = ["left", "center", "right", "justify"];
  const alignmentClass = validAlignments.includes(align)
    ? `text-${align}`
    : "text-left";

  return (
    <h1
      className={`
        ${alignmentClass} 
        ${fontWeight} text-[black]
        text-3xl    
        ${className}
      `
        .trim()
        .replace(/\s+/g, " ")}
    >
      {children}
    </h1>
  );
}

export function H2({ align = "left", children, className = "" }) {
  // Validasi alignment options
  const validAlignments = ["left", "center", "right", "justify"];
  const alignmentClass = validAlignments.includes(align)
    ? `text-${align}`
    : "text-left";

  return (
    <h2
      className={`
        text-3xl text-[black]
        md:text-4xl 
        font-bold 
        ${alignmentClass} 
        ${className}
      `
        .trim()
        .replace(/\s+/g, " ")}
    >
      {children}
    </h2>
  );
}

export function H3({ align = "left", children, className = "" }) {
  const validAlignments = ["left", "center", "right", "justify"];
  const alignmentClass = validAlignments.includes(align)
    ? `text-${align}`
    : "text-left";

  return (
    <h3
      className={`
        text-2xl text-[black]
        font-bold 
        ${alignmentClass} 
        ${className}
      `
        .trim()
        .replace(/\s+/g, " ")}
    >
      {children}
    </h3>
  );
}