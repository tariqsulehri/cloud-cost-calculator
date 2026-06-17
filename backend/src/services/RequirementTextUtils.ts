function promptIntentText(input: string): string {
  const promptMatch = input.match(/\bprompt\s*:\s*/i);
  if (!promptMatch || promptMatch.index === undefined) {
    return input;
  }

  const beforePrompt = input.slice(0, promptMatch.index).trim();
  const afterPrompt = input.slice(promptMatch.index + promptMatch[0].length);
  const resultIndex = afterPrompt.search(/\bresult\s*:\s*/i);
  const promptBody = (resultIndex >= 0 ? afterPrompt.slice(0, resultIndex) : afterPrompt).trim();
  return [beforePrompt, promptBody].filter(Boolean).join('\n');
}

function removeConditionalOptionPhrases(input: string): string {
  return input
    .replace(/\([^)]*\bif\s+(?:http\/s|https?|http\s+s)\s+(?:is\s+)?specified[^)]*\)/gi, ' ')
    .replace(/\bif\s+(?:http\/s|https?|http\s+s)\s+(?:is\s+)?specified\b/gi, ' ');
}

function isAnsweredOpenItem(line: string): boolean {
  const separatorIndex = line.indexOf(':');
  if (separatorIndex < 0) {
    return false;
  }

  const value = line.slice(separatorIndex + 1).trim().replace(/[.]+$/, '');
  return Boolean(value) && !/^(not specified|unspecified|unknown|tbd|to be confirmed|n\/a|none)$/i.test(value);
}

function removeOpenItemChecklistLines(input: string): string {
  const lines = input.split(/\r?\n/);
  const kept: string[] = [];
  let inOpenItems = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const isOpenItemHeading = /^open\s+(?:items?|questions)(?:\s+to\s+complete(?:\s+before\s+estimate)?)?\s*:?\s*$/i.test(trimmed);

    if (isOpenItemHeading) {
      inOpenItems = true;
      continue;
    }

    if (inOpenItems) {
      if (!trimmed) {
        continue;
      }

      if (/^[-*]\s+/.test(trimmed)) {
        const itemText = trimmed.replace(/^[-*]\s+/, '');
        if (isAnsweredOpenItem(itemText)) {
          kept.push(itemText);
        }
        continue;
      }

      inOpenItems = false;
    }

    kept.push(line);
  }

  return kept.join('\n');
}

export function pricingIntentText(input: string): string {
  return removeConditionalOptionPhrases(removeOpenItemChecklistLines(promptIntentText(input)));
}
