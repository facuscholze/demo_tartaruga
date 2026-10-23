/**
 * Prompt de consola mínimo (sin dependencias).
 * - Con TTY: pregunta una por una.
 * - Con caño (`printf ... | pnpm add:dish`) o CI sin stdin: lee todas las
 *   líneas por adelantado y las consume en orden. Así el script es testeable.
 */
import { createInterface } from "node:readline";

const queue: string[] = [];
let buffered: Promise<void> | null = null;
let rl: ReturnType<typeof createInterface> | null = null;

const isTty = Boolean(process.stdin.isTTY);

function interface_() {
  if (!rl) rl = createInterface({ input: process.stdin, terminal: isTty });
  return rl;
}

async function fillBuffer(): Promise<void> {
  if (isTty) return;
  if (!buffered) {
    buffered = new Promise<void>((resolve) => {
      const rlLocal = interface_();
      rlLocal.on("line", (line) => queue.push(line));
      rlLocal.on("close", () => resolve());
      if (process.stdin.readableEnded) resolve();
    });
  }
  return buffered;
}

function write(prompt: string) {
  process.stdout.write(prompt);
}

export async function ask(question: string, fallback = ""): Promise<string> {
  if (isTty) {
    const answer = await new Promise<string>((resolve) =>
      interface_().question(`${question} `, resolve),
    );
    write("\n");
    const trimmed = answer.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  await fillBuffer();
  const answer = (queue.shift() ?? "").trim();
  write(`${question} ${answer.length > 0 ? answer : `(por defecto: ${fallback || "—"})`}\n`);
  return answer.length > 0 ? answer : fallback;
}

export async function askNumber(question: string, fallback = 0): Promise<number> {
  const raw = await ask(question, String(fallback));
  const parsed = Number(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}

export async function askChoice(
  question: string,
  options: string[],
  fallback: string,
): Promise<string> {
  write(`  ${options.map((option, index) => `${index + 1}) ${option}`).join("   ")}\n`);
  const raw = await ask(question, fallback);
  const index = Number(raw) - 1;
  if (Number.isInteger(index) && options[index]) return options[index]!;
  const lower = raw.toLowerCase();
  return options.find((option) => option.toLowerCase() === lower) ?? fallback;
}

export async function askYesNo(question: string, fallback = false): Promise<boolean> {
  const raw = await ask(question, fallback ? "s" : "n");
  return /^(s|y|1|true)$/i.test(raw.trim());
}

export function done() {
  if (rl) rl.close();
}

export function info(...args: unknown[]) {
  console.info(...args);
}
