import { Fragment, type CSSProperties, type ReactNode } from "react";
import { normalizeDocument, safeLink, type RichNode } from "./document";
export function RichContent({ document }: { document: RichNode }) {
  const doc = normalizeDocument(document);
  function render(node: RichNode, key: number): ReactNode {
    if (node.type === "text")
      return (
        <Fragment key={key}>
          {(node.marks ?? []).reduce<ReactNode>((child, mark) => {
            switch (mark.type) {
              case "bold":
                return <strong>{child}</strong>;
              case "italic":
                return <em>{child}</em>;
              case "underline":
                return <u>{child}</u>;
              case "strike":
                return <s>{child}</s>;
              case "link": {
                const href = safeLink(mark.attrs?.href);
                return href ? (
                  <a
                    href={href}
                    target={/^https?:/.test(href) ? "_blank" : undefined}
                    rel="noopener noreferrer"
                  >
                    {child}
                  </a>
                ) : (
                  child
                );
              }
              default:
                return child;
            }
          }, node.text)}
        </Fragment>
      );
    const children = (node.content ?? []).map(render);
    const style: CSSProperties = {
      textAlign: node.attrs?.textAlign as CSSProperties["textAlign"],
    };
    switch (node.type) {
      case "hardBreak":
        return <br key={key} />;
      case "horizontalRule":
        return <hr key={key} />;
      case "paragraph":
        return (
          <p key={key} style={style}>
            {children.length ? children : <br />}
          </p>
        );
      case "heading": {
        const Tag =
          Number(node.attrs?.level) === 3
            ? "h4"
            : Number(node.attrs?.level) === 2
              ? "h3"
              : "h2";
        return (
          <Tag key={key} style={style}>
            {children}
          </Tag>
        );
      }
      case "bulletList":
        return <ul key={key}>{children}</ul>;
      case "orderedList":
        return (
          <ol key={key} start={node.attrs?.start as number | undefined}>
            {children}
          </ol>
        );
      case "listItem":
        return <li key={key}>{children}</li>;
      case "blockquote":
        return <blockquote key={key}>{children}</blockquote>;
      default:
        return <Fragment key={key}>{children}</Fragment>;
    }
  }
  return <div className="ag-rich-content">{doc.content?.map(render)}</div>;
}
