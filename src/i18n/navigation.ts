import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/** Link / useRouter / usePathname locales-aware (añaden el prefijo de idioma). */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
