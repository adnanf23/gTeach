export default function Paragraph({
  children,
  align,
  fontSize = "base",
  color = "#c9c9c9",
}) {
  return (
    <>
      <p
        className={`
        text-${fontSize} text-${align} text-[#6d6d6d] leading-relaxed
        `}
      >
        {children}
      </p>
    </>
  );
}