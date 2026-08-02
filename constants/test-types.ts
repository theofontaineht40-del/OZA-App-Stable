export type TestCategory = "mobility" | "physical";

export type TestDefinition = {
  key: string;
  label: string;
  groupe: string; // sous-catégorie d'affichage (ex: "Hanche", "Force")
  unite: string;
  description: string;
  protocole: string;
  comparaisonCotes: boolean; // true si le test se mesure à droite ET à gauche
};
