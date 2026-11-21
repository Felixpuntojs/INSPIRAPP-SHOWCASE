export const CATEGORY_OPTIONS = [
  "Autoestima",
  "Filosofía",
  "Disciplina",
  "Religión",
  "Motivación",
  "Espiritualidad",
  "Amor",
  "Exito",
  "Reflexión",
  "Vida",
  "Hábitos",
  "Budismo / Zen",
] as const;

export type CategoryOption = (typeof CATEGORY_OPTIONS)[number];
