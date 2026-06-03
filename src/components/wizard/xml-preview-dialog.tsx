import { Check, Copy } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Configuration } from "@/types/config";
import { generateXml } from "@/xml/generate";

interface XmlPreviewDialogProps {
  config: Configuration;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** A single syntax-highlighted token produced by the XML tokenizer. */
interface XmlToken {
  type:
    | "declaration"
    | "tag-open"
    | "tag-name"
    | "attr-name"
    | "attr-value"
    | "tag-close"
    | "text"
    | "comment";
  value: string;
}

/** Maps a token type to the appropriate Tailwind semantic color class. */
function tokenColorClass(type: XmlToken["type"]): string {
  switch (type) {
    case "declaration":
    case "comment":
      return "text-muted-foreground";
    case "tag-open":
    case "tag-close":
      return "text-foreground/60";
    case "tag-name":
      return "text-primary";
    case "attr-name":
      return "text-foreground";
    case "attr-value":
      return "text-success";
    case "text":
      return "text-foreground";
  }
}

/**
 * Tokenizes a single line of XML into typed tokens for syntax highlighting.
 * Handles the XML declaration, comments, opening/closing tags, attributes,
 * and plain text content. Returns an array of tokens with no innerHTML.
 */
function tokenizeLine(line: string): XmlToken[] {
  const tokens: XmlToken[] = [];

  // XML declaration: <?xml ... ?>
  const declMatch = /^(<\?xml[^?]*\?>)(.*)$/.exec(line);
  if (declMatch) {
    tokens.push({ type: "declaration", value: declMatch[1] });
    if (declMatch[2]) tokens.push({ type: "text", value: declMatch[2] });
    return tokens;
  }

  // XML comment: <!-- ... -->
  const commentMatch = /^(<!--[\s\S]*?-->)(.*)$/.exec(line);
  if (commentMatch) {
    tokens.push({ type: "comment", value: commentMatch[1] });
    if (commentMatch[2]) tokens.push({ type: "text", value: commentMatch[2] });
    return tokens;
  }

  // Closing tag: </TagName>
  const closeMatch = /^(<\/)([\w:-]+)(>)(.*)$/.exec(line);
  if (closeMatch) {
    tokens.push({ type: "tag-open", value: closeMatch[1] });
    tokens.push({ type: "tag-name", value: closeMatch[2] });
    tokens.push({ type: "tag-close", value: closeMatch[3] });
    if (closeMatch[4]) tokens.push(...tokenizeLine(closeMatch[4]));
    return tokens;
  }

  // Opening/self-closing tag: <TagName attr="val" ...> or <TagName .../>
  const tagStartMatch = /^(<)([\w:-]+)/.exec(line);
  if (tagStartMatch) {
    tokens.push({ type: "tag-open", value: tagStartMatch[1] });
    tokens.push({ type: "tag-name", value: tagStartMatch[2] });

    let rest = line.slice(tagStartMatch[0].length);

    // Consume attributes: name="value" pairs
    const attrRe = /^\s+([\w:-]+)="([^"]*)"/;
    let attrMatch = attrRe.exec(rest);
    while (attrMatch) {
      tokens.push({ type: "text", value: " " });
      tokens.push({ type: "attr-name", value: attrMatch[1] });
      tokens.push({ type: "tag-close", value: "=" });
      tokens.push({ type: "attr-value", value: `"${attrMatch[2]}"` });
      rest = rest.slice(attrMatch[0].length);
      attrMatch = attrRe.exec(rest);
    }

    // Closing bracket (> or />), optional inline text content
    const tailMatch = /^(\s*\/?>)(.*)(<\/[\w:-]+>)?$/.exec(rest);
    if (tailMatch) {
      tokens.push({ type: "tag-close", value: tailMatch[1] });
      if (tailMatch[2] && !/^\s*$/.test(tailMatch[2])) {
        // Inline text possibly followed by close tag
        const inlineClose = /^([^<]*)(<\/[\w:-]+>)$/.exec(tailMatch[2]);
        if (inlineClose) {
          tokens.push({ type: "text", value: inlineClose[1] });
          tokens.push(...tokenizeLine(inlineClose[2]));
        } else {
          tokens.push({ type: "text", value: tailMatch[2] });
        }
      }
    } else if (rest) {
      tokens.push({ type: "text", value: rest });
    }

    return tokens;
  }

  // Plain text (element content or whitespace)
  tokens.push({ type: "text", value: line });
  return tokens;
}

/**
 * Renders a single highlighted line of XML as an array of React span elements.
 * Each token is keyed by its absolute character offset (stable, content-derived)
 * so React keys never fall back to the array index.
 */
function HighlightedLine({
  line,
  lineStart,
}: {
  line: string;
  lineStart: number;
}): React.JSX.Element {
  const tokens = tokenizeLine(line);
  let offset = lineStart;
  return (
    <>
      {tokens.map((token) => {
        const key = offset;
        offset += token.value.length;
        return (
          <span key={key} className={tokenColorClass(token.type)}>
            {token.value}
          </span>
        );
      })}
      {"\n"}
    </>
  );
}

/**
 * Dialog showing the generated PanelConfiguration XML with light syntax highlighting
 * and a copy-to-clipboard button.
 */
export function XmlPreviewDialog({
  config,
  open,
  onOpenChange,
}: XmlPreviewDialogProps): React.JSX.Element {
  const xml = useMemo(() => generateXml(config), [config]);
  const [copied, setCopied] = useState(false);

  // Reset copied state when dialog closes or re-opens
  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  function handleCopy() {
    navigator.clipboard
      .writeText(xml)
      .then(() => setCopied(true))
      .catch(() => undefined);
  }

  // Each line carries its absolute start offset so child spans get stable,
  // content-derived keys (never the array index).
  const lines = useMemo(() => {
    let start = 0;
    return xml.split("\n").map((content) => {
      const entry = { content, start };
      start += content.length + 1;
      return entry;
    });
  }, [xml]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Preview XML</DialogTitle>
          <DialogDescription>
            Generated PanelConfiguration XML for this configuration. Use the copy button to transfer
            it to another application.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              aria-label={copied ? "Copied to clipboard" : "Copy XML to clipboard"}
            >
              {copied ? (
                <>
                  <Check className="text-success" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto rounded-md border bg-muted">
            <pre className="p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
              <code>
                {lines.map((line) => (
                  <HighlightedLine key={line.start} line={line.content} lineStart={line.start} />
                ))}
              </code>
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
