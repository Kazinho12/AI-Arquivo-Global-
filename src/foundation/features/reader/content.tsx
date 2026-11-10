import { Fragment, memo, type ReactNode } from "react";
/** AG text v1: toolbar markup only. Unknown HTML remains literal escaped text. */
export function InlineContent({
  text,
  depth = 0,
}: {
  text: string;
  depth?: number;
}): ReactNode {
  if (depth > 16) return text;
  const pattern = /\*\*([^]+?)\*\*|<u>([^]+?)<\/u>|\*([^*\n]+?)\*/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index!;
    if (index > last) nodes.push(text.slice(last, index));
    const inner = (
      <InlineContent
        depth={depth + 1}
        text={match[1] ?? match[2] ?? match[3]}
      />
    );
    nodes.push(
      match[1] !== undefined ? (
        <strong key={index}>{inner}</strong>
      ) : match[2] !== undefined ? (
        <u key={index}>{inner}</u>
      ) : (
        <em key={index}>{inner}</em>
      ),
    );
    last = index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}
const linesWithBreaks = (lines: string[]) =>
  lines.map((line, index) => (
    <Fragment key={index}>
      {index > 0 && <br />}
      <InlineContent text={line} />
    </Fragment>
  ));
export const ProseContent = memo(function ProseContent({
  text,
}: {
  text: string;
}) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;
  const structural = (line: string) =>
    /^(#{1,3}\s|>\s?|[-*]\s|\d+\.\s|\* \* \*\s*$|---\s*$)/.test(line);
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index++;
      continue;
    }
    const key = index;
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const Tag =
        heading[1].length === 1 ? "h2" : heading[1].length === 2 ? "h3" : "h4";
      blocks.push(
        <Tag key={key}>
          <InlineContent text={heading[2]} />
        </Tag>,
      );
      index++;
      continue;
    }
    if (/^(\* \* \*|---)\s*$/.test(line)) {
      blocks.push(<hr key={key} />);
      index++;
      continue;
    }
    if (/^>/.test(line)) {
      const group: string[] = [];
      while (index < lines.length && /^>/.test(lines[index]))
        group.push(lines[index++].replace(/^>\s?/, ""));
      blocks.push(<blockquote key={key}>{linesWithBreaks(group)}</blockquote>);
      continue;
    }
    const ordered = /^\d+\.\s/.test(line),
      unordered = /^[-*]\s/.test(line);
    if (ordered || unordered) {
      const pattern = ordered ? /^\d+\.\s+/ : /^[-*]\s+/;
      const items: ReactNode[] = [];
      while (index < lines.length && pattern.test(lines[index])) {
        const itemKey = index;
        items.push(
          <li key={itemKey}>
            <InlineContent text={lines[index++].replace(pattern, "")} />
          </li>,
        );
      }
      blocks.push(
        ordered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>,
      );
      continue;
    }
    const paragraph: string[] = [line];
    index++;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !structural(lines[index])
    )
      paragraph.push(lines[index++]);
    blocks.push(
      <p key={key} className="prose-paragraph">
        {linesWithBreaks(paragraph)}
      </p>,
    );
  }
  return <>{blocks}</>;
});
