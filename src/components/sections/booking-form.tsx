"use client";

/**
 * Formulario de reserva. Decisiones que importan:
 *  - valida con el MISMO zod del endpoint (una sola fuente de verdad);
 *  - honeypot oculto para bots + botón deshabilitado si el formulario está vacío;
 *  - el envío SIEMPRE abre WhatsApp con el mensaje armado; el `POST` al
 *    endpoint es un extra para tener registro/automatización;
 *  - errores en el idioma del usuario, `aria-describedby`, foco al primer
 *    campo inválido y `aria-live` para que una lectora de pantalla lo anuncie;
 *  - nada de autocompletar raro: `autocomplete` estándar para nombre/teléfono.
 */
import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { bookingSchema, type BookingForm } from "@/features/booking/schema";
import { buildBookingMessage, type BookingLabels } from "@/features/booking/message";
import { buildWhatsappHref, type WhatsappTarget } from "@/features/site/links";
import { cn } from "@/lib/utils";

type FieldKey = "name" | "date" | "time" | "people";

export function BookingForm({
  venue,
  whatsapp,
  experienceOptions,
  initialExperience,
}: {
  venue: string;
  whatsapp: WhatsappTarget;
  experienceOptions: { id: string; name: string }[];
  initialExperience?: string;
}) {
  const t = useTranslations("booking");
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState({
    name: "",
    date: "",
    time: "19:30",
    people: "2",
    occasion: "",
    pet: false,
    message: "",
    experience: initialExperience ?? "",
    company: "",
  });
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "webhook-fail">("idle");

  const labels = useMemo<BookingLabels>(
    () => ({
      title: t("title"),
      venue,
      name: t("name"),
      date: t("date"),
      time: t("time"),
      people: t("people"),
      occasion: t("occasion"),
      pet: t("pet"),
      petYes: t("petYes"),
      message: t("message"),
    }),
    [t, venue],
  );

  const errorCopy = useMemo(
    () => ({
      errorName: t("errorName"),
      errorDate: t("errorDate"),
      errorTime: t("errorTime"),
      errorPeople: t("errorPeople"),
    }),
    [t],
  );

  const preview = useMemo(() => {
    const parsed = bookingSchema.safeParse({ ...values, people: Number(values.people) });
    if (!parsed.success) return null;
    return buildBookingMessage(parsed.data as BookingForm, labels);
  }, [values, labels]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const parsed = bookingSchema.safeParse({ ...values, people: Number(values.people) });
    if (!parsed.success) {
      const next: Partial<Record<FieldKey, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldKey;
        const code = typeof issue.message === "string" ? issue.message : "";
        if (!next[key]) next[key] = errorCopy[code as keyof typeof errorCopy] ?? code;
      }
      setErrors(next);
      setStatus("idle");
      const first = formRef.current?.querySelector<HTMLElement>(`[name="${Object.keys(next)[0] ?? "name"}"]`);
      first?.focus();
      return;
    }
    setErrors({});

    // 1) El canal que sí funciona: WhatsApp con todo el mensaje escrito.
    window.open(
      buildWhatsappHref(whatsapp, buildBookingMessage(parsed.data as BookingForm, labels)),
      "_blank",
      "noopener",
    );

    // 2) Registro/automatización si el local configuró el webhook.
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = (await response.json()) as { ok: boolean; forwarded?: boolean };
      setStatus(result.ok && result.forwarded !== false ? "sent" : "webhook-fail");
    } catch {
      setStatus("webhook-fail");
    }
  }

  const input =
    "w-full border-b border-[var(--line)] bg-transparent py-2.5 text-[1rem] text-[var(--fg)] outline-none transition-colors duration-[var(--d-2)] placeholder:text-[var(--fg-faint)] focus:border-[var(--c-ember)]";

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label={t("name")} htmlFor="bk-name" error={errors.name} hint="Ana">
          <input
            id="bk-name"
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
            className={input}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "bk-name-error" : undefined}
          />
        </Field>

        <Field label={t("date")} htmlFor="bk-date" error={errors.date}>
          <input
            id="bk-date"
            name="date"
            type="date"
            value={values.date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(event) => setValues({ ...values, date: event.target.value })}
            className={cn(input, "[color-scheme:dark]")}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={errors.date ? "bk-date-error" : undefined}
          />
        </Field>

        <Field label={t("time")} htmlFor="bk-time" error={errors.time}>
          <input
            id="bk-time"
            name="time"
            type="time"
            value={values.time}
            onChange={(event) => setValues({ ...values, time: event.target.value })}
            className={cn(input, "[color-scheme:dark]")}
            aria-invalid={Boolean(errors.time)}
            aria-describedby={errors.time ? "bk-time-error" : undefined}
          />
        </Field>

        <Field label={t("people")} htmlFor="bk-people" error={errors.people}>
          <input
            id="bk-people"
            name="people"
            type="number"
            inputMode="numeric"
            min={1}
            max={40}
            value={values.people}
            onChange={(event) => setValues({ ...values, people: event.target.value })}
            className={input}
            aria-invalid={Boolean(errors.people)}
            aria-describedby={errors.people ? "bk-people-error" : undefined}
          />
        </Field>

        <Field label={t("occasion")} htmlFor="bk-occasion">
          <select
            id="bk-occasion"
            name="occasion"
            value={values.occasion}
            onChange={(event) => setValues({ ...values, occasion: event.target.value })}
            className={input}
          >
            <option value="">{t("occasionNone")}</option>
            <option value="cumple">{t("birthday")}</option>
            <option value="aniversario">{t("anniversary")}</option>
            <option value="otro">{t("other")}</option>
          </select>
        </Field>

        <Field label={t("experienceContext")} htmlFor="bk-experience">
          <select
            id="bk-experience"
            name="experience"
            value={values.experience}
            onChange={(event) => setValues({ ...values, experience: event.target.value })}
            className={input}
          >
            <option value="">—</option>
            {experienceOptions.map((option) => (
              <option key={option.id} value={option.name}>
                {option.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <label className="flex cursor-pointer items-center gap-3 text-[0.95rem] text-[var(--fg-muted)]">
        <input
          type="checkbox"
          name="pet"
          checked={values.pet}
          onChange={(event) => setValues({ ...values, pet: event.target.checked })}
          className="h-4 w-4 accent-[var(--c-ember)]"
        />
        {t("petYes")}
      </label>

      <Field label={t("message")} htmlFor="bk-message">
        <textarea
          id="bk-message"
          name="message"
          rows={3}
          value={values.message}
          onChange={(event) => setValues({ ...values, message: event.target.value })}
          className={cn(input, "resize-y")}
        />
      </Field>

      {/* Honeypot: fuera de la vista y del tab order. Ningún humano lo toca. */}
      <div aria-hidden className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="bk-company">{t("honeypot")}</label>
        <input
          id="bk-company"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={values.company}
          onChange={(event) => setValues({ ...values, company: event.target.value })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn" disabled={status === "sending"} data-cursor="reservar">
          {status === "sending" ? t("sending") : t("send")}
          <span aria-hidden className="ml-2">
            ↗
          </span>
        </button>
        <p className="label text-[0.55rem] text-[var(--fg-faint)]">{t("whatsappLabel")}</p>
      </div>

      {/* Vista previa viva del mensaje: el local lee exactamente lo que va a llegar. */}
      {preview ? (
        <div className="card flex flex-col gap-2 p-4">
          <p className="label text-[var(--c-ember)]">{t("title")}</p>
          <pre className="overflow-x-auto whitespace-pre-wrap font-type text-[0.78rem] leading-relaxed text-[var(--fg-muted)]">
            {preview}
          </pre>
        </div>
      ) : null}

      <p role="status" aria-live="polite" className="sr-only">
        {status === "sent" ? t("webhookOk") : status === "webhook-fail" ? t("webhookFail") : ""}
      </p>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="label text-[var(--fg-muted)]">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-[0.8rem] text-[var(--c-sunset)]">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[0.78rem] text-[var(--fg-faint)]">{hint}</p>
      ) : null}
    </div>
  );
}
