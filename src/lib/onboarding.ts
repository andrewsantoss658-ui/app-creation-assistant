// Gerenciar estado do onboarding

const ONBOARDING_KEY = "gestum_onboarding_completed";

export const hasCompletedOnboarding = (): boolean => {
  return localStorage.getItem(ONBOARDING_KEY) === "true";
};

export const markOnboardingAsCompleted = () => {
  localStorage.setItem(ONBOARDING_KEY, "true");
};

export const resetOnboarding = () => {
  localStorage.removeItem(ONBOARDING_KEY);
};
