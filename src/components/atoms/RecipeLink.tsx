interface RecipeLinkProps {
  /** The recipe URL. Renders nothing when empty. */
  url: string;
  /** Optional label; defaults to "Recipe". */
  label?: string;
}

/**
 * A clickable recipe link that opens in a separate window/tab. Missing the
 * `https://` scheme is tolerated — it's prepended so the link isn't treated as
 * a relative path. Renders nothing when there is no URL.
 */
export function RecipeLink({ url, label = "Recipe" }: RecipeLinkProps) {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  return (
    <a
      className="recipe-link"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      // Keep clicks from bubbling to parent card/chip handlers.
      onClick={(e) => e.stopPropagation()}
    >
      <i className="pi pi-external-link" />
      <span>{label}</span>
    </a>
  );
}
