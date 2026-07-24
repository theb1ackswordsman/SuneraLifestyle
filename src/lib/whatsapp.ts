const WA_NUMBER = "919135564607";

const DEFAULT_MESSAGE =
  "Hi! I am [Your Name], a customer of SunEra Lifestyle. I would like to know more about your products. Could you please help me?";

export function buildWaLink(message: string = DEFAULT_MESSAGE): string {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const WA_LINK = buildWaLink();
